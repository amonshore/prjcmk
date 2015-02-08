function indexByKey(arr, value, property) {
	for (var ii=0; ii<arr.length; ii++) {
		if (arr[ii][property] == value)
			return ii;
	}
	return -1;
}

angular.module('starter.services', [])

.factory('$comicsData', ['$q', '$filter', '$utils', '$file', 
function ($q, $filter, $utils, $file) {
	//console.log("new $comicsData");

	var updated = function(item) { item.lastUpdate = new Date().getTime(); };
	var lastsRemoved = [];
	var lastsRemovedRelease = [];

	var comicsDefaults = {
		id: null,
		name: null,
		series: null,
		publisher: null,
		authors: null,
		price: 0.0,
		periodicity: '', //w1, M1, M2, M3, M4, M6, Y1
		reserved: "F",
		notes: null,
		releases: [],
		bestRelease: null, // aggiornata da refreshBestRelease
		lastUpdate: new Date().getTime()
	}

	var releaseDefaults = {
		comicsId: null,
		number: null,
		date: null,
		price: null,
		reminder: null, //null, 1
		ordererd: "F",
		notes: null,
		purchased: "F"
	}

	//localstorage DB
	var DB = {
		//
		uid: null,
		comics: null,
		lastSaveTime: null,
		//
		read: function(uid, refresh) {
			//console.log(uid, refresh);
			if (this.comics == null || uid != this.uid || refresh) {
				var dbkey = uid + "_comics";
				this.uid = uid;
				var str = window.localStorage.getItem(dbkey);
				if (str) {
					return (this.comics = JSON.parse(str));
				} else {
					return (this.comics = []);
				}
			} else {
				return this.comics;
			}
		},
		//
		save: function() {
			this.lastSaveTime = new Date().getTime();
			var dbkey = this.uid + "_comics";
			window.localStorage.setItem(dbkey, JSON.stringify( this.comics ));
		},
		//orderBy: bestRelease, namse, lastUpdate
		getComics: function(orderBy, desc) {
			//provo ad aggiornare best release ogni volta che vengono richiesti i comics
			this.refreshBestRelease(this.comics);

			if (orderBy == "bestRelease") {
				var sorted = this.comics.sort(function(a, b) {
					var res = 0;
					if (a.bestRelease.date && b.bestRelease.date) {
						res = a.bestRelease.date.localeCompare(b.bestRelease.date);
					} else if (a.bestRelease.date && !b.bestRelease.date) {
						res = -1;
					} else if (!a.bestRelease.date && b.bestRelease.date) {
						res = 1;
					} else if (a.bestRelease.number && b.bestRelease.number) {
						res = a.bestRelease.number - b.bestRelease.number;
					} else if (a.bestRelease.number && !b.bestRelease.number) {
						res = -1;
					} else if (!a.bestRelease.number && b.bestRelease.number) {
						res = 1;
					}
					
					if (res == 0) {
						res = a.name.toLowerCase() > b.name.toLowerCase() ? 1: -1;
						//res = a.lastUpdate > b.lastUpdate ? -1 : 1;
					}

					if (desc)
						res = -res;

					return res;
				});
				return (this.comics = sorted);
			} else if (orderBy == "name") {
				var sorted = this.comics.sort(function(a, b) {
					if (desc)
						return a.name.toLowerCase() > b.name.toLowerCase() ? -1 : 1;
					else
						return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
				});
				return (this.comics = sorted);
			} else if (orderBy == "lastUpdate") {
				var sorted = this.comics.sort(function(a, b) {
					if (desc)
						return a.lastUpdate > b.lastUpdate ? -1 : 1;
					else
						return a.lastUpdate > b.lastUpdate ? 1 : -1;
				});
				return (this.comics = sorted);				
			} else {
				console.log("getComics: orderBy not supported " + orderBy);
				return this.comics;
			}
		},
		//
		getComicsById: function(id) {
			//console.log("getComicsById", id)
			//TODO cache comics in una mappa con id come chiave
			if (id == "new") {
				return this.newComics({id: 'new'});
			} else {
				return _.findWhere(this.comics, { id: id }) || this.newComics();
			}
		},
		//
		isComicsUnique: function(item) {
			var name = this.normalizeComicsName(item.name);
			return _.find(this.comics, function(cc) { return this.normalizeComicsName(cc.name) == name; }, this) == undefined;
		},
		//
		normalizeComicsName: function(name) {
			return _.str.clean(name).toLowerCase();
		},
		//
		getReleaseById: function(item, id) {
	  	if (id == "new") {
	  		return this.newRelease({ comicsId: item.id });
	  	} else {
	  		return _.findWhere(item.releases, { number: parseInt(id) }) || this.newRelease({ comicsId: item.id });
		  }
		},
		//ritorna le uscite per gli elementi in parametro ordinate per data
		getReleases: function(items) {
			var releases = [];
			angular.forEach(items || this.comics, function(item) {
				//console.log(item)
				$utils.arrayAddRange(releases, item.releases);
			});
			return _.sortBy(releases, function(rel) {
				return rel.date || rel.number;
			});
		},
		//
		isReleaseUnique: function(item, release) {
			return _.find(item.releases, function(rel) { return rel.number == release.number; }) == undefined;
		},
		//
		updateRelease: function(item, release) {
			//console.log("updateRelease", item.id, release.number);
			var idx = indexByKey(item.releases, release.number, 'number');
			if (idx == -1) {
				item.releases.push(release);
			}
			//aggiorno ultima modifica
			updated(item);
		},
		//
		removeReleases: function(releases) {
			lastsRemovedRelease = [];

			angular.forEach(releases, function(release) {
				var comicsId = release.comicsId;
				var number = release.number;
				var item = this.getComicsById(comicsId);
				var idx = indexByKey(item.releases, release.number, 'number');
				if (idx > -1) {
					lastsRemovedRelease.push(item.releases[idx]);
					item.releases.splice(idx, 1);
					//aggiorno ultima modifica
					updated(item);
				}
			}, this);
		},
		//
		undoRemoveReleases: function() {
			if (lastsRemovedRelease != null && lastsRemovedRelease.length > 0) {
				for (var ii=lastsRemovedRelease.length-1; ii>=0; ii--) {
					var release = lastsRemovedRelease[ii];
					var comicsId = release.comicsId;
					var number = release.number;
					var item = this.getComicsById(comicsId);
					item.releases.push(release);
				}
				var cp = lastsRemovedRelease;
				lastsRemovedRelease = [];
				return cp;
			}
			return null;
		},
		//
		getBestRelease: function(item) {
			//ritorna la prima scaduta e non acquistata, altrimenti la prossima non scaduta
			if (item.releases.length > 0) {
				var today = $filter('date')(new Date(), 'yyyy-MM-dd');
				var sorted = _.sortBy(item.releases, function(rel) {
					return rel.date || rel.number;
				});

				return _.find(sorted, function(rel) { /*console.log(item.name, rel.date, rel.purchased);*/ return rel.date < today && rel.purchased != 'T'; }) || 
					_.find(sorted, function(rel) { return rel.date >= today && rel.purchased != 'T'; }) ||
					_.find(sorted, function(rel) { return !rel.date && rel.purchased != 'T'; }) ||
					this.newRelease();
			} else
				return this.newRelease();
		},
		//
		refreshBestRelease: function(items) {
			items = items || this.comics;
			angular.forEach(items, function(item) {
				item.bestRelease = this.getBestRelease(item);
			}, this);
		},
		//
		update: function(item) {
			if (item.id == "new") {
				item.id = UUID.genV1().toString();
				this.comics.push(item);
			}
			//aggiorno ultima modifica
			updated(item);
		},
		//
		remove: function(items) {
			lastsRemoved = [];

			angular.forEach(items, function(item) {
				var id = item.id;
				var idx = indexByKey(this.comics, item.id, 'id');
				if (idx > -1) {
					lastsRemoved.push([idx, this.comics[idx]]);
					this.comics.splice(idx, 1);
				}
			}, this);
		},
		//
		undoRemove: function() {
			if (lastsRemoved != null && lastsRemoved.length > 0) {
				var cp = [];
				for (var ii=lastsRemoved.length-1; ii>=0; ii--) {
					var lr = lastsRemoved[ii];
					this.comics.splice(lr[0], 0, lr[1]);
					cp.push(lr[1]);
				}
				lastsRemoved = [];
				return cp;
			}
			return null;
		},
		//
		clear: function() {
			this.comics = [];
		},
		//
		repairData: function() {
			if (this.comics) {
				for (var ii=0; ii<this.comics.length; ii++) {
					updated(this.comics[ii]);

					angular.forEach(
						_.filter(_.keys(this.comics[ii]), function(v) { return _.str.startsWith(v, '$$') }), 
						function(key) { delete this.comics[ii][key]; }, this);

					for (var jj=0; jj<this.comics[ii].releases.length; jj++) {
						angular.forEach(_.filter(_.keys(this.comics[ii].releases[jj]), function(v1) { return _.str.startsWith(v1, '$$') }), function(key1) {
							delete this.comics[ii].releases[jj][key1];
						}, this);
					}
					
				}
			}
		},
		//
		getLastBackup: function() {
			return $file.readFileMetadata(this.uid + "_backup.json");
		},
		//
		backupDataToFile: function() {
			var dbkey = this.uid + "_comics";
			var str = window.localStorage.getItem(dbkey);			
			return $file.writeFile(this.uid + "_backup.json", str);
		},
		//
		restoreDataFromFile: function() {
			var $this = this;
			var q = $q.defer();
			$file.readFileAsText(this.uid + "_backup.json").then(function(result) {
				try {
					var obj = JSON.parse(result);
					$this.comics = obj;
					$this.save();
					q.resolve(true);
				} catch (e) {
					q.reject({code: 'errparse'});
				}
			}, function(error) {
				q.reject(error);
			});
			return q.promise;
		},
		//
		newComics: function(opts) {
			return angular.extend(angular.copy(comicsDefaults), opts);
		},
		//
		newRelease: function(opts) {
			return angular.extend(angular.copy(releaseDefaults), opts);
		},
		//
		countReleases: function(date) {
			var count = 0;
			angular.forEach(this.comics, function(item) {
				angular.forEach(item.releases, function(rel) {
					if (rel.reminder && rel.date == date) count++;
				});
			});
			return count;
		}
		//,
		// addNotification: function(date) {
		// 	$cordovaLocalNotification.isScheduled(date, this).then(function(scheduled) {
		// 		var badge = 1;
		// 		if (scheduled) {
		// 			badge = this.countReleases(date);
		// 		}
		// 		//TODO alre proprietà impostare defaults in deviceready
		// 		//TODO ora da $settings
		// 		var dd = new Date(Date.parse(date + " 06:00:00"));
		// 		$cordovaLocalNotification.add({ id: date, date: dd, title: "Comikku", message: "Seams to be some releases today", badge: badge })
		// 		.then(function(result) {
		// 			console.log("add notification " + dd + " " + badge);
		// 		});
		// 	});
		// },
		//
		// removeNotification: function(date) {
		// 	$cordovaLocalNotification.isScheduled(date, this).then(function(scheduled) {
		// 		if (scheduled) {
		// 			var badge = this.countReleases(date);
		// 			if (badge == 0) {
		// 				$cordovaLocalNotification.cancel(date)
		// 				.then(function(result) {
		// 					console.log("cancel notification " + dd);
		// 				});		
		// 			} else {
		// 				//TODO alre proprietà impostare defaults in deviceready
		// 				//TODO ora da $settings
		// 				var dd = new Date(Date.parse(date + " 06:00:00"));
		// 				$cordovaLocalNotification.add({ id: date, date: dd, title: "Comikku", message: "Seams to be some releases today", badge: badge })
		// 				.then(function(result) {
		// 					console.log("add notification " + dd + " " + badge);
		// 				});
		// 			}
		// 		}
		// 	});
		// }		
	};

  return DB;
}])

.factory('$settings', function () {

	var def = {
		debugMode: 'F',
		comicsCompactMode: 'F',
		comicsSearchPublisher: 'T',
		autoFillReleaseData: 'T',
		comicsOrderBy: 'bestRelease',
		comicsOrderByDesc: 'F',
		weekStartMonday: 'F',
		defaultUrl: '/app/comics',
		releaseGroupBy: 'week',
		language: null, //system
		infiniteScrollChunk: 20
	};

	//localstorage DB
	var DB = {
		//
		userOptions: angular.copy(def),
		//
		load: function() {
			var str = window.localStorage.getItem("OPTIONS");
			if (str) {
				angular.extend(this.userOptions, JSON.parse(str));
			}
		},
		loadDefault: function() {
			this.userOptions = angular.copy(def);
		},
		//
		save: function() {
			window.localStorage.setItem("OPTIONS", JSON.stringify(this.userOptions))
		}
	};

	return DB;
});