angular.module('starter.controllers')
.controller('ComicsCtrl', [
	'$scope', '$ionicModal', '$timeout', '$state', '$filter', '$undoPopup', '$utils', '$debounce', '$toast', '$ionicPopover',
	'$ionicScrollDelegate', '$ionicNavBarDelegate', '$ionicPlatform', '$comicsData', '$settings', '$ionicHistory', '$q',
	'$rmmEditors',
function($scope, $ionicModal, $timeout, $state, $filter, $undoPopup, $utils, $debounce, $toast, $ionicPopover,
	$ionicScrollDelegate, $ionicNavBarDelegate, $ionicPlatform, $comicsData, $settings, $ionicHistory, $q,
	$rmmEditors) {
	//recupero i dati già ordinati
	var orderedComics = null;
	//conterrà i dati filtrati (tramite campo di ricerca)
	var filteredComics = null;
	//indcia quanti dati caricare alla volta tramite infinite scroll
	var loadChunk = $settings.userOptions.infiniteScrollChunk;
	var changeOrder = function() {
		filteredComics = orderedComics = $comicsData.getComics($scope.orderBy, $scope.orderByDesc);
		lastReadTime = new Date().getTime();
		$scope.totComics = filteredComics.length;
		$settings.userOptions.comicsOrderBy = $scope.orderBy;
		$settings.userOptions.comicsOrderByDesc = ($scope.orderByDesc ? 'T' : 'F');
	};
	//funzione di filtraggio dei dati (su orderedComics)
	//TODO attenzione! questa funzione fa casino con infinite scroll etc, rivederla
	var applyFilter = function() {
		//console.log("applyFilter");

		if (_.isEmpty($scope.search)) {
			filteredComics = orderedComics;
		} else {
			filteredComics = orderedComics.filter(function(item) {
	      var bOk = false;
	      if ($settings.userOptions.comicsSearchPublisher == 'T') {
	        bOk = !$scope.search || _.str.include(_.str.clean(item.publisher).toLowerCase(), _.str.clean($scope.search).toLowerCase());   
	      }
	      return bOk || (!$scope.search || _.str.include(_.str.clean(item.name).toLowerCase(), _.str.clean($scope.search).toLowerCase()));				
			});
		}
		$scope.comics = [];
		$scope.totComics = filteredComics.length;
		//$scope.loadMore(); -> non necessario
		//rc0 tolgo altrimenti va in errore
		//$ionicScrollDelegate.scrollTop();
		
		//rc0 forzo l'evento stateChangeSuccess altrimenti loadMore non viene chiamata
		$scope.$broadcast('stateChangeSuccess');
	};
	//
	var lastReadTime = null;
	var needReload = function() {
		return filteredComics == null || ($comicsData.lastSaveTime != null && $comicsData.lastSaveTime > lastReadTime) || 
			(!moment().isSame(moment(lastReadTime), 'days'));
	};
	//
	$scope.debugMode = $settings.userOptions.debugMode == 'T';
	//
	$scope.orderBy = $settings.userOptions.comicsOrderBy || 'bestRelease';
	$scope.orderByDesc = $settings.userOptions.comicsOrderByDesc == 'T';
	//
	$scope.currentBar = 'title';
	//conterrà i comics caricati poco alla volta tramite infirnite scroll
	$scope.comics = [];
	//
	$scope.totComics = 0;
	//
	$scope.selectedComics = [];
	//indica è possibile editare l'elemento selezionato
	$scope.canEdit = false;
	//campo di ricerca
	$scope.search = "";
	//
	$scope.$watch('search', function(newValue, oldValue) {
		if (newValue === oldValue) { return; }
		$debounce(applyFilter, 300); //chiamo applyFilter solo se non viene modificato search per 300ms
	});
	//pulisco filtro
	$scope.clearSearch = function() {
		$scope.search = "";
		applyFilter();
	};
	//
	$scope.$on('stateChangeSuccess', function() {
		$scope.loadMore();
	});
	//carico altri dati (da filteredComics)
	$scope.loadMore = function() {
		$timeout(function() {
			var from = $scope.comics.length;
			var max = Math.min(from + loadChunk, filteredComics.length);
			// console.log("loadMore", from, max);
			if (from < max) {
				$scope.comics = _.union($scope.comics, filteredComics.slice(from, max));
				//console.log(" - ", $scope.comics.length);
			}
			//rc0 //NB sembra ci sia un baco, con $scope.$apply è una pezza
			//rc0 $scope.$apply(function(){
			    $scope.$broadcast('scroll.infiniteScrollComplete');
			//rc0 });
		}, 1);
	};
	//
	$scope.moreDataCanBeLoaded = function() {
		// console.log('moreDataCanBeLoaded', $scope.comics && $scope.comics.length, filteredComics && filteredComics.length);
		return $scope.comics && filteredComics && $scope.comics.length < filteredComics.length;
	};
	//
	$scope.getComicsInfo = function(item) {
		return $utils.join(' | ', item.series, item.authors, 
			(item.bestRelease && item.bestRelease.notes) || item.notes);
		// if (item.bestRelease && !_.str.isBlank(item.bestRelease.notes)) {
		// 	return item.bestRelease.notes;
		// } else if (_.str.isBlank(item.series)) {
		//   return item.notes;
		// } else if (_.str.isBlank(item.notes)) {
		// 	return item.series
		// } else {
  //     return item.series + " - " + item.notes;
  //   }
	};
	//funzione di rimozione elemento
	$scope.removeComicsEntry = function() {
		if (!_.isEmpty($scope.selectedComics)) {
			$comicsData.remove($scope.selectedComics);
			$comicsData.save();
			$scope.selectedComics = [];
			$scope.canEdit = false;
			applyFilter();

			$timeout(function() {
			  $undoPopup.show({title: $filter('translate')('Comics removed'), 
			  									text: $filter('translate')('CANCEL'), 
			  									timeout: "long"}).then(function(res) {
			    if (res == 'ok') {
			      $scope.selectedComics = $comicsData.undoRemove() || [];
			      $scope.canEdit = ($scope.selectedComics.length == 1);
			      $comicsData.save();
			      applyFilter();
			    } else if (res == 'back') {
			    	$scope.showNavBar();
			    }
			  });
			}, 250);
		}
	};

	//creo l'editor
	var comicsEditor = null;
	$rmmEditors.createComicsEditor().then(function(editor) {
		comicsEditor = editor;
	});

	var releaseEditor = null;
	$rmmEditors.createReleaseEditor().then(function(editor) {
		releaseEditor = editor;
	});

	//apre il template per l'editing
	$scope.addComicsEntry = function() {
		comicsEditor.show('new', 
			angular.bind(this, function() {
				$scope.showNavBar();
				changeOrder();
				applyFilter();
			}), 
			$scope.showNavBar);
	};
	//apre il template per l'editing
	$scope.cloneComicsEntry = function(item) {
		item = $comicsData.cloneComics(item || $scope.selectedComics[0]);
		comicsEditor.show(item, 
			angular.bind(this, function() {
				$scope.showNavBar();
				changeOrder();
				applyFilter();
			}), 
			$scope.showNavBar);
	};
	//apre il template per l'editing del fumetto
	$scope.editComicsEntry = function(item) {
		comicsEditor.show(item || $scope.selectedComics[0], 
			angular.bind(this, function() {
				$scope.showNavBar();
			}), 
			$scope.showNavBar);
	};
	//apre te template per l'editing dell'uscita
	$scope.showAddRelease = function(item) {
		releaseEditor.show(item || $scope.selectedComics[0], 
			($settings.userOptions.autoFillReleaseData == 'T' ? 'next' : 'new'),
			angular.bind(this, function() {
			  $scope.showNavBar();
			  changeOrder();
			  applyFilter();
			}),
			$scope.showNavBar);
	};
	//
	$scope.hasNavBar = function() {
		return ($scope.currentBar == 'title');
	};
	$scope.showNavBar = function() {
		$scope.selectedComics = [];
		$scope.currentBar = 'title';
		$ionicNavBarDelegate.showBar(true);
		$scope._deregisterBackButton && $scope._deregisterBackButton();
		$scope._deregisterBackButton = null;
	};
	$scope.showOptionsBar = function() {
		$scope.currentBar = 'options';
		$ionicNavBarDelegate.showBar(false);

		$scope._deregisterBackButton = $ionicPlatform.registerBackButtonAction(function() {
			//console.log("[c] BACK BTN " + $state.current.name + " " + $ionicHistory.backTitle());
			if ($scope.currentBar == 'options') {
				$scope.showNavBar();
				$scope.$apply(); //altrimenti non vengono aggiornati 
			}
		}, 400);

	};
	//
	$scope.clickItem = function(item) {
		if ($scope.currentBar == 'options') {
			$scope.selectItem(item);
		} else {
			$state.go('app.releases_entry', {comicsId: item.id});
		}
	};
	//
	$scope.selectItem = function(item) {
		//cerco l'indice dell'elemento selezionato
		var idx = $utils.indexFindWhere($scope.selectedComics, {id: item.id});

		//se è già selezionato lo rimuovo
		if (idx >= 0) {
			$scope.selectedComics.splice(idx, 1);
		} else {
			$scope.selectedComics.push(item);
		}

		//nascondo la barra di navigazione (e mostro quella delle opzioni) se c'è almeno un elemento selezionato
		if ($scope.selectedComics.length == 0) {
	    $scope.showNavBar();
			// $scope._deregisterBackButton && $scope._deregisterBackButton();
  	// 	$scope._deregisterBackButton = null;
		} else {
			$scope.canEdit = ($scope.selectedComics.length == 1);
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
	$scope.isSelected = function(id) {
		return $utils.indexFindWhere($scope.selectedComics, {id: id}) >= 0;
	};
	//
	$scope.orderByPopover = null;
	$scope.openOrderByPopover = function($event) {
		if (!$scope.orderByPopover) {
		  $ionicPopover.fromTemplateUrl('orderby-popover.html', {
		    scope: $scope,
		  }).then(function(popover) {
		    $scope.orderByPopover = popover;
		    $scope.orderByPopover.show($event);
		  });
		} else {
			$scope.orderByPopover.show($event);
		}
	};
	//
	$scope.closeOrderByPopover = function(orderBy, orderByDesc) {
		$scope.orderByPopover.hide();
		$scope.orderBy = orderBy;
		$scope.orderByDesc = orderByDesc;
		changeOrder();
		applyFilter();
	};
	//
	$scope.switchOrderby = function() {
		if ($scope.orderBy == 'bestRelease') { $scope.orderBy = 'name'; }
		else if ($scope.orderBy == 'name') { $scope.orderBy = 'bestRelease'; }
		$scope.orderByDesc = false;
		changeOrder();
		applyFilter();
	}
	//NB meglio registrare il back button ogni volta che si entra nella modalità opzioni
	//gestisco il back hw in base a quello che sto facendo
	// $scope._deregisterBackButton = $ionicPlatform.registerBackButtonAction(function() {
	// 	if ($scope.currentBar == 'options') {
	// 		$scope.showNavBar();
	// 		$scope.$apply(); //altrimenti non vengono aggiornati 
	// 	} else if ($ionicHistory.backTitle()) {
	// 		console.log("[c] BACK BTN " + $state.current.name + " " + $ionicHistory.backTitle());
	// 		$ionicHistory.goBack();
	// 	} else {
	// 		console.log("[c] BACK BTN exit");
	// 		navigator.app.exitApp();
	// 	}
	// }, 100);

	////chiamo la prima volta le funzioni per l'ordinamento e il filtro (???)
	//changeOrder();
	//applyFilter();

	////deregistro l'evento sul back all'uscita
	//TODO non viene chiamata, può essere che ionic.Platform.exitApp()
	$scope.$on('$ionicView.unloaded', function() {
		$scope.orderByPopover && $scope.orderByPopover.remove(); 
		//$scope._deregisterBackButton && $scope._deregisterBackButton(); -> gestito in beforeLeave
		//console.log("   ---- SAVE " + JSON.stringify($settings.userOptions))
		$settings.save();
	});

	//gestione eventi
	$scope.$on('$ionicView.beforeEnter', function(scopes, states) {
		//se sono stati modificati i dati devo aggiornare la vista
		//console.log('comics beforeEnter', needReload());
		$timeout(function() {
			if (needReload()) {
			  changeOrder();
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
.directive('bestRelease', function() {
  return {
    restrict: 'E',
    scope: {
      comics: '='
    },
    controller: ['$scope', '$filter', '$comicsData', function($scope, $filter, $comicsData) {
      var today = moment().format('YYYY-MM-DD');
      $scope.best = $scope.comics.bestRelease;
      $scope.datestr = _.isEmpty($scope.best.date) ? '' : moment($scope.best.date).format('DD MMM');
      $scope.near = $scope.best.date && $scope.best.date == today;
      $scope.expired = $scope.best.date && $scope.best.date <= today;
    }],
    templateUrl: 'templates/bestRelease.html'
  };
})
/*.controller('ComicsEditorCtrl', [
'$scope', '$stateParams', '$ionicHistory', '$comicsData', '$ionicPopup', '$filter', '$dialogs',
function($scope, $stateParams, $ionicHistory, $comicsData, $ionicPopup, $filter, $dialogs) {
	//usato per contenere la form in modo da poter accedere alla form anche all'esterno del tag <form>
	$scope.data = {};
  //console.log($stateParams, $comicsData)
  //originale
  $scope.master = $comicsData.getComicsById($stateParams.comicsId);
  //aggiorno l'originale e torno indietro
  $scope.update = function(entry) {
	  angular.copy(entry, $scope.master);
	  $comicsData.update($scope.master);
	  $comicsData.save();
	  $ionicHistory.goBack();
  };
  $scope.reset = function() {
    $scope.entry = angular.copy($scope.master);
  };
  $scope.cancel = function() {
    $ionicHistory.goBack();
  };
  $scope.isUnique = function(entry) {
    return $comicsData.normalizeComicsName($scope.master.name) == $comicsData.normalizeComicsName(entry.name) || 
      $comicsData.isComicsUnique(entry);
  };
	//
  $scope.chooseComicsPeriodicity = function() {
  	if (!window.cordova) {
	    $scope.comicsPeriodicityPopup = $ionicPopup.show({
	      templateUrl: 'comicsPeriodicity.html',
	      title: $filter('translate')('Comics released every'),
	      scope: $scope,
	      buttons: [{
	        text: $filter('translate')('Cancel'),
	        type: 'button-default',
	        onTap: function(e) { return false; }
	      }]
	    });
		} else {
			var config = {
			    title: $filter('translate')('Comics released every'), 
			    items: [
			        { value: "", text: $filter('translate')('Not specified') },
			        { value: "w1", text: $filter('translate')('Week') },
			        { value: "M1", text: $filter('translate')('Month') },
			        { value: "M2", text: $filter('translate')('2 month') },
			        { value: "M3", text: $filter('translate')('3 month') },
			        { value: "M4", text: $filter('translate')('4 month') },
			        { value: "M6", text: $filter('translate')('6 month') },
			        { value: "Y1", text: $filter('translate')('Year') }
			    ],
			    selectedValue: $scope.entry.periodicity,
			    doneButtonLabel: $filter('translate')('Done'),
			    cancelButtonLabel: $filter('translate')('Cancel')
			};

			$dialogs.showPicker(config).then(function(res) {
				$scope.entry.periodicity = res;
			});
		}
  };
  $scope.reset();
}])*/;