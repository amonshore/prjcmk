angular.module('starter.controllers')
.controller('ReleasesEntryCtrl', [
	'$scope', '$ionicModal', '$timeout', '$state', '$undoPopup', '$utils', '$toast', '$ionicPopover',
	'$stateParams', '$debounce', '$ionicScrollDelegate', '$ionicNavBarDelegate', '$ionicPlatform', '$filter', 
	'$comicsData', '$settings', '$dateParser', '$templateCache', '$ionicHistory', '$q', '$rmmEditors',
function($scope, $ionicModal, $timeout, $state, $undoPopup, $utils, $toast, $ionicPopover, 
	$stateParams, $debounce, $ionicScrollDelegate, $ionicNavBarDelegate, $ionicPlatform, $filter, 
	$comicsData, $settings, $dateParser, $templateCache, $ionicHistory, $q, $rmmEditors) {

  //
  var today = moment().format('YYYY-MM-DD');
	//week, month
	var lblThisTime = null;
	var lblNextTime = null;
	var grpDateFormat = null;
	var funcName = null;
	var kkPref = 0; //è necessario altrimenti ci sarebbere elementi con chiave uguale anche se con gruppo diverso
		//e questo crea problemi a ionic durante l'aggiornamento della lista
		//NB per evitare che il sistema di cache non aggiorni l'elemento della lista assegno a kkPref un numero random
		//	che verrà aggiornato solo se la lista cambia
	//indcia quanti dati caricare alla volta tramite infinite scroll
	var loadChunk = $settings.userOptions.infiniteScrollChunk;
	var items = [];
	//contiene le release dopo aver applicato i filtri 
	var rels = null;

	var changeGroup = function() {
		if ($scope.groupBy == 'week') { 
			lblThisTime = $filter('translate')('This week');
			lblNextTime = $filter('translate')('Next week');
			grpDateFormat = 'ddd, DD MMM YYYY';
			funcName = 'firstDayOfWeek';
			kkPref = parseInt(Math.random() * 10000);
			$scope.thisTime = moment().firstDayOfWeek().format('YYYY-MM-DD');
			$scope.nextTime = moment($scope.thisTime).add(1, 'w').format('YYYY-MM-DD');
		} else if ($scope.groupBy == 'month') {
			lblThisTime = $filter('translate')('This month');
			lblNextTime = $filter('translate')('Next month');
			grpDateFormat = 'MMMM YYYY';
			funcName = 'firstDayOfMonth';
			kkPref = parseInt(Math.random() * 10000);
			$scope.thisTime = moment().startOf('month').format('YYYY-MM-DD');
			$scope.nextTime = moment($scope.thisTime).add(1, 'M').format('YYYY-MM-DD');
		}
		$settings.userOptions.releaseGroupBy = $scope.groupBy;
	};

  //
  var applyFilter = function() {
  	//console.log(new Date().getTime() + " applyFilter")
    var _items = [];

    //chiavi gruppo -> aaa=to buy, lll=lost, zzz=wishlist, zzzz=purchased

    //estraggo tutt le releases
    rels = $comicsData.getReleases($stateParams.comicsId == null ? null : 
    	[$scope.entry]);
		lastReadTime = new Date().getTime();
    var grps;

    if ($scope.isWishlist) {

    	rels = _.filter(rels, function(rel) {
    		return (rel.purchased != 'T' && (!rel.date || rel.date < today));
    	});

	    grps = _.groupBy(rels, function(rel) {
	    	if (rel.date) {
		    	return  'lll';
	    	} else {
	    		return 'zzz';
	    	}
	    });

	  } else if ($scope.isPurchased) {

    	rels = _.filter(rels, function(rel) {
    		return (rel.purchased == 'T');
    	});

	    //raggruppare per settimana/mese
	    grps = _.groupBy(rels, function(rel) {
	    	if (rel.date) {
		    	return moment(rel.date)[funcName]().format('YYYY-MM-DD');
	    	} else {
	    		return 'zzz';
	    	}
	    });

	  } else if ($stateParams.comicsId != null) {
	  	//se sono le uscite di un fumetto raggruppo per categoria
			grps = _.groupBy(rels, function(rel) {
				if (rel.purchased == 'T') {
					return 'zzzz'; //purchased
				} else if (!rel.date) {
					return 'zzz'; //wishlist
				} else if (rel.date < today) {
					return 'lll'; //lost
				} else {
					return 'aaa'; //to purchase
				}
			});

    } else {
	    //raggruppa per settimana/mese
	    grps = _.groupBy(rels, function(rel) {
	    	if (rel.date) {
		    	return moment(rel.date)[funcName]().format('YYYY-MM-DD');
	    	} else {
	    		return 'zzz';
	    	}
	    });
  	}

    //creo un array che contiene sia le intestazioni del gruppo che i dati per non essere costretto
    //	ad utilzzare ng-repeat innestati
    var grpKeys = _.keys(grps).sort();

    //aggiungo una chiave _kk sequenziale ad ogni elemento (sia intestazione gruppo che release) per renderlo
    //	univoco. usato come track da ngRepeat  
    var kk = kkPref;
    for (var ii=0; ii<grpKeys.length; ii++) {

    	var grp = grps[grpKeys[ii]];

    	if (grpKeys[ii] == 'zzz') {
    		if ($scope.entry == null && !$scope.isWishlist && !$scope.isPurchased) continue;
				_items.push({ _kk: kk++, label: $filter('translate')('Wishlist'), count: grp.length });
    	} else if (grpKeys[ii] == 'lll') {
    		if ($scope.entry == null && !$scope.isWishlist) continue;
				_items.push({ _kk: kk++, label: $filter('translate')('Lost'), count: grp.length });
			} else if (grpKeys[ii] == 'aaa') {
				_items.push({ _kk: kk++, label: $filter('translate')('To buy'), count: grp.length });
			} else if (grpKeys[ii] == 'zzzz') {
				_items.push({ _kk: kk++, label: $filter('translate')('Purchased'), count: grp.length });
			} else if (grpKeys[ii] == $scope.thisTime) {
				_items.push({ _kk: kk++, label: lblThisTime, count: grp.length });
			} else if (grpKeys[ii] == $scope.nextTime) {
				_items.push({ _kk: kk++, label: lblNextTime, count: grp.length });
    	} else if ($scope.entry != null || $scope.isPurchased || grpKeys[ii] >= $scope.thisTime) {
    		_items.push({ _kk: kk++, label: moment(grpKeys[ii]).format(grpDateFormat), count: grp.length });
    	} else {
    		continue;
    	}

    	$utils.arrayAddRange(_items, _.each(grp, function(rel) { rel._kk = kk++; }));
    }

    items = _items;
    //console.log("items", items.length)
    $scope.releases = [];
		$ionicScrollDelegate.scrollTop();
  };
	//
	var lastReadTime = null;
	var needReload = function() {
		return items == undefined ||
			($scope.groupBy != $settings.userOptions.releaseGroupBy) ||
			($comicsData.lastSaveTime != null && $comicsData.lastSaveTime > lastReadTime) || 
			(!moment().isSame(moment(lastReadTime), 'days'));
	};
	//TODO da perfezionare, lo scroll deve avvenire dopo il caricamento dei (primi) dati altrimenti lo scroll non funziona
	// var scrollPos = { left: 0, top: 0 };
	// var scrollToLastPos = function() {
	//   //console.log("scroll to ", scrollPos)
	//   $timeout(function() { $ionicScrollDelegate.scrollTo(scrollPos.left, scrollPos.top, false); }, 100);		
	// }
	//comics selezionato (se arrivo dal menu laterale, sarà sempre null)
  $scope.entry = $stateParams.comicsId == null ? null : ($scope.entry = $comicsData.getComicsById($stateParams.comicsId));
	//
	$scope.debugMode = $settings.userOptions.debugMode == 'T';
	//se true mostro solo wishlist (senza data) e scadute, e non acquistate
	$scope.isWishlist = $state.is('app.wishlist');
	//
	//$scope.canGroup = !$scope.isWishlist && !$scope.entry; <- spostato nelle maschera della opzioni
	$scope.canGroup = false;
	//
	$scope.isPurchased = $state.is('app.purchased');
	//
	$scope.currentBar = 'title';
	//
	$scope.selectedReleases = [];
	//
	$scope.title = ($scope.isPurchased ? 'Purchased' : ($scope.isWishlist ? 'Lost & Wishlist' : ($scope.entry ? $scope.entry.name : 'Releases')));
	//
	$scope.groupBy = $settings.userOptions.releaseGroupBy || 'week';
	$scope.thisTime = null;
	$scope.nextTime = null;


	//
	$scope.$on('stateChangeSuccess', function() {
		$scope.loadMore();
	});
	//carico altri dati (da items)
	$scope.loadMore = function() {
		$timeout(function() {
			var from = $scope.releases.length;
			var max = Math.min(from + loadChunk, items.length);
			//console.log("loadMore", from, max);
			if (from < max) {
				$scope.releases = _.union($scope.releases, items.slice(from, max));
				//console.log(" - ", $scope.releases.length);
			}
			//NB sembra ci sia un baco, con $scope.$apply è una pezza
			$scope.$apply(function(){
			    $scope.$broadcast('scroll.infiniteScrollComplete');
			});
		}, 10);
	};
	//
	$scope.moreDataCanBeLoaded = function() {
		//console.log('moreDataCanBeLoaded', $scope.releases.length, items.length);
		return $scope.releases && items && $scope.releases.length < items.length;
	};

	//creo l'editor
	var releaseEditor = null;
	$rmmEditors.createReleaseEditor().then(function(editor) {
		releaseEditor = editor;
	});

  //apre te template per l'editing dell'uscita
  $scope.showAddRelease = function(item) {
		releaseEditor.show(item || $comicsData.getComicsById($scope.selectedReleases[0].comicsId), 
			($settings.userOptions.autoFillReleaseData == 'T' ? 'next' : 'new'),
			angular.bind(this, function() {
			  $scope.showNavBar();
			  changeGroup();
			  applyFilter();
			}),
			$scope.showNavBar);
  };
  //
  $scope.editReleaseEntry = function(release) {
  	release = release || $scope.selectedReleases[0];
		releaseEditor.show($comicsData.getComicsById(release.comicsId), 
			release || $scope.selectedReleases[0],
			angular.bind(this, function() {
			  $scope.showNavBar();
			  changeGroup();
			  applyFilter();
			}),
			$scope.showNavBar);
  };
  //
  $scope.removeReleaseEntry = function(bAll) {
  	//
  	var relsToRemove = bAll ? rels : $scope.selectedReleases;

		if (!_.isEmpty(relsToRemove)) {
			$comicsData.removeReleases(relsToRemove);
			$comicsData.save();
			$scope.selectedReleases = [];
			$scope.canEdit = false;
			applyFilter();
			// scrollToLastPos();

			$timeout(function() {
			  $undoPopup.show({title: $filter('translate')('Releases removed'),
			  								text: '<i class="icon ion-android-system-back"></i> ' + $filter('translate')('CANCEL'),  
			  								timeout: "long"}).then(function(res) {
			    if (res == 'ok') {
			    	if (bAll) {
			    		$comicsData.undoRemoveReleases();
			    	} else {
			      	$scope.selectedReleases = $comicsData.undoRemoveReleases() || [];
			      	$scope.canEdit = ($scope.selectedReleases.length == 1);
			      }
			      $comicsData.save();
			      applyFilter();
			      // scrollToLastPos();
			    } else if (res == 'back') {
			    	$scope.showNavBar();
			    }
			  });
			}, 250);
		}
  };
  //
  $scope.setPurchased = function(release, value) {
  	if (release) {
	    release.purchased = value;
	    $comicsData.save();
	    $toast.show($filter('translate')(value == 'T' ? "Release purchased" : "Purchase canceled"));
	  } else {
	  	angular.forEach($scope.selectedReleases, function(release) {
	  		release.purchased = value;
	  	});
	  	$comicsData.save();
			$toast.show($filter('translate')(value == 'T' ? "Releases purchased" : "Purchase canceled"));
	  }
  };
  //
  $scope.togglePurchased = function(release) {
  	if (release) {
	    release.purchased = (release.purchased == 'T' ? 'F' : 'T');
	    $comicsData.save();
	    $toast.show($filter('translate')(release.purchased == 'T' ? "Release purchased" : "Purchase canceled"));
	  } else {
	  	var value = ($scope.selectedReleases[0].purchased == 'T' ? 'F' : 'T');
	  	angular.forEach($scope.selectedReleases, function(release) {
	  		release.purchased = value;
	  	});
	  	$comicsData.save();
			$toast.show($filter('translate')(value == 'T' ? "Releases purchased" : "Purchase canceled"));
	  }
  };
  //
  $scope.toggleOrdered = function(release) {
  	if (release) {
	    release.ordered = (release.ordered == 'T' ? 'F' : 'T');
	    $comicsData.save();
	    $toast.show($filter('translate')(release.ordered == 'T' ? "Release ordered" : "Order canceled"));
	  } else {
	  	var value = ($scope.selectedReleases[0].ordered == 'T' ? 'F' : 'T');
	  	angular.forEach($scope.selectedReleases, function(release) {
	  		release.ordered = value;
	  	});
	  	$comicsData.save();
			$toast.show($filter('translate')(value == 'T' ? "Releases ordered" : "Order canceled"));
	  }
  };
  //
  $scope.getComicsById = function(comicsId) {
  	return $comicsData.getComicsById(comicsId);
  };
	//
	$scope.hasNavBar = function() {
		return ($scope.currentBar == 'title');
	};
	$scope.showNavBar = function() {
		$scope.selectedReleases = [];
		$scope.currentBar = 'title'
		$ionicNavBarDelegate.showBar(true);
		$scope._deregisterBackButton && $scope._deregisterBackButton();
		$scope._deregisterBackButton = null;
	};
	$scope.showOptionsBar = function() {
		$scope.currentBar = 'options';
		$ionicNavBarDelegate.showBar(false);

		$scope._deregisterBackButton = $ionicPlatform.registerBackButtonAction(function() {
			//console.log("[r] BACK BTN " + $state.current.name + " " + $ionicHistory.backTitle());
			if ($scope.currentBar == 'options') {
				$scope.showNavBar();
				$scope.$apply(); //altrimenti non vengono aggiornati 
			}
		}, 400);
	};
	//
	$scope.clickRelease = function(release) {
		if ($scope.currentBar == 'options') {
			$scope.selectRelease(release);
		} else {
			$scope.setPurchased(release, release.purchased == 'T' ? 'F' : 'T');
		}
	};
	//
	$scope.selectRelease = function(release) {
		//cerco l'indice dell'elemento selezionato
		var idx = $utils.indexFindWhere($scope.selectedReleases, {comicsId: release.comicsId, number: release.number});

		//se è già selezionato lo rimuovo
		if (idx >= 0) {
			$scope.selectedReleases.splice(idx, 1);
		} else {
			$scope.selectedReleases.push(release);
		}

		//nascondo la barra di navigazione (e mostro quella delle opzioni) se c'è almeno un elemento selezionato
		if ($scope.selectedReleases.length == 0) {
	    $scope.showNavBar();
			// $scope._deregisterBackButton && $scope._deregisterBackButton();
  	// 	$scope._deregisterBackButton = null;
		} else {
			//salvo la posizione dello scroll in modo da riposizionarmi in un secondo momento
			//TODO scrollPos = $ionicScrollDelegate.getScrollPosition();
			$scope.canEdit = ($scope.selectedReleases.length == 1);
			if ($scope.currentBar != 'options') {
				$scope.showOptionsBar();
				// $scope._deregisterBackButton = $ionicPlatform.registerBackButtonAction(function() { 
				// 	$scope.showNavBar();
				// 	$scope.$apply(); //altrimenti non vengono aggiornati 
				// 	$scope._deregisterBackButton && $scope._deregisterBackButton();
	   //  		$scope._deregisterBackButton = null;
				// }, 100);
			}
		}
	}
	//
	$scope.isSelected = function(release) {
		return $utils.indexFindWhere($scope.selectedReleases, {comicsId: release.comicsId, number: release.number}) >= 0;
	};
	//
	$scope.menuPopover = null;
	$scope.openMenuPopover = function($event) {
		if (!$scope.menuPopover) {
		  $ionicPopover.fromTemplateUrl('menu-popover.html', {
		    scope: $scope,
		  }).then(function(popover) {
		    $scope.menuPopover = popover;
		    $scope.menuPopover.show($event);
		  });
		} else {
			$scope.menuPopover.show($event);
		}
	};
	//
	$scope.closeMenuPopover = function(action, option) {
		$scope.menuPopover.hide();
		if (action == 'group') {
			$scope.groupBy = option;
			changeGroup();
			applyFilter();
		} else if (action == 'delete') {
			$scope.removeReleaseEntry(true);
		}
	};
  //
  // changeGroup();
  // applyFilter();

	//NB meglio registrare il back button ogni volta che si entra nella modalità opzioni
	// //gestisco il back hw in base a quello che sto facendo
	// $scope._deregisterBackButton = $ionicPlatform.registerBackButtonAction(function() {
	// 	if ($scope.currentBar == 'options') {
	// 		$scope.showNavBar();
	// 		$scope.$apply(); //altrimenti non vengono aggiornati
	// 	} else if ($ionicHistory.backTitle()) {
	// 		console.log("[r] BACK BTN " + $state.current.name + " " + $ionicHistory.backTitle());
	// 		$ionicHistory.goBack();
	// 	} else {
	// 		console.log("[r] BACK BTN exit");
	// 		navigator.app.exitApp();
	// 	}
	// }, 100);
	////deregistro l'evento sul back all'uscita
	$scope.$on('$destroy', function() {
		$scope.menuPopover && $scope.menuPopover.remove(); 
		//$scope._deregisterBackButton && $scope._deregisterBackButton(); -> gestito in beforeLeave
		$settings.save();
	});

	//console.log('releases-ctrl end')

	//gestione eventi
	$scope.$on('$ionicView.beforeEnter', function(scopes, states) {
		//se sono stati modificati i dati devo aggiornare la vista
		//console.log('releases beforeEnter', lastReadTime, needReload());
		$timeout(function() {
			if (needReload()) {
				$scope.groupBy = $settings.userOptions.releaseGroupBy || 'week';
			  changeGroup();
			  applyFilter();
		  }
		}, 1);
	});
	$scope.$on('$ionicView.afterEnter', function(scopes, states) {
		//in ogni caso gestire gli elementi selezionati in precedenza
		//	(attualmente l'effeto è che l'elemento è selezionato ma l'header è nello stato 'title')
		if (!$scope.hasNavBar()) {
			$scope.showNavBar();			
		}
	});
	$scope.$on('$ionicView.beforeLeave', function(scopes, states) {
		$scope._deregisterBackButton && $scope._deregisterBackButton();
	});

}])
.directive('comicsRelease', function() {
  return {
    restrict: 'E',
    scope: {
      release: '='
    },
    controller: ['$scope', '$filter', '$comicsData', function($scope, $filter, $comicsData) {
    	//console.log('comicsRelease')
  	  var today = moment().format('YYYY-MM-DD');
  	  $scope.datestr = _.isEmpty($scope.release.date) ? '' : moment($scope.release.date).format('ddd, DD MMM');
    	$scope.comics = $comicsData.getComicsById($scope.release.comicsId);
    	$scope.near = ($scope.release.date && $scope.release.date == today);
		  $scope.expired = ($scope.release.date && $scope.release.date <= today);

		  //console.log($scope.release.number, $scope.release.date, $scope.release.comicdId, $scope.comics.name)
    }],
    templateUrl: 'templates/comicsRelease.html'
  };
})
/*.controller('ReleaseEditorCtrl', [
	'$scope', '$stateParams', '$ionicHistory', '$comicsData', '$settings',
	'$filter', '$dateParser', '$state',
function($scope, $stateParams, $ionicHistory, $comicsData, $settings,
	$filter, $dateParser, $state) {
  $scope.entry = $comicsData.getComicsById($stateParams.comicsId);
  //originale
  $scope.master = $comicsData.getReleaseById($scope.entry, $stateParams.releaseId);

  if ($scope.master.number == null) {
	  if ($settings.userOptions.autoFillReleaseData == 'T') {
	    var maxrel = _.max($scope.entry.releases, function(rel) { return rel.number; });
	    //console.log(maxrel);
	    if (_.isEmpty(maxrel)) {
	      $scope.master.number = 1;
	    } else if (maxrel.number > 0) {
	    	//numero +1
	      $scope.master.number = maxrel.number + 1;
	      //data uscita + periodicità
	      if (!_.isEmpty($scope.entry.periodicity) && maxrel.date) {
	      	var type = $scope.entry.periodicity.charAt(0);
	    		var amount = parseInt($scope.entry.periodicity.substr(1));
	    		$scope.master.date = moment(maxrel.date).add(amount, type).format('YYYY-MM-DD');
	      }
	    }
	  }
    //prezzo
    $scope.master.price = $scope.entry.price;
	}

  //aggiorno l'originale e torno indietro
  $scope.update = function(release) {

    //TODO eliminare eventuali notifiche create in precedenza
    //  con comicsId + number (master)

    //TODO se !purchased e !expired creare notifica locale
    // con comicsId + number (release)

    angular.copy(release, $scope.master);
    $comicsData.updateRelease($scope.entry, $scope.master);
    $comicsData.save();
    //$ionicHistory.backView().stateParams = angular.extend($ionicHistory.backView().stateParams, { 'forceHideTabs': 'yes' });
    $ionicHistory.goBack();

   //  var pars = angular.extend($ionicHistory.backView().stateParams, { 'forceHideTabs': 'yes' });
  	// console.log('PARS', pars);
   //  $state.go($ionicHistory.backView().stateName, pars);
  };
  $scope.reset = function() {
    $scope.release = angular.copy($scope.master);
  };
  $scope.cancel = function() {
    $ionicHistory.goBack();
  };
  $scope.isUnique = function(release) {
    return $stateParams.releaseId == release.number || $comicsData.isReleaseUnique($scope.entry, release);
  };
  $scope.reset();
}])*/;