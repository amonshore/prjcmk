//
angular.module('starter', 
  ['ionic', 'ngCordova', 'pasvaz.bindonce', 'starter.controllers', 'ngAnimate', 'rmm', 'dateParser', 'pascalprecht.translate'])

.provider('$initOptions', function $initOptionsProvider() {
  var str = window.localStorage.getItem("OPTIONS");
  var settings = {};
  if (str) {
    angular.extend(settings, JSON.parse(str));
  }

  this.defaultUrl = settings.defaultUrl || '/app/comics';
  this.$get = [function $initOptionsFactory() {
    return new provme();
  }];
})

.config(['$stateProvider', '$urlRouterProvider', '$initOptionsProvider', '$translateProvider', '$ionicConfigProvider', '$provide',
function($stateProvider, $urlRouterProvider, $initOptionsProvider, $translateProvider, $ionicConfigProvider, $provide) {

  //estendo la direttiva ion-radio modificando il template
  //  che aggiunge un'icona per gli elementi non selezionati
  $provide.decorator('ionRadioDirective', function($delegate) {
    var directive = $delegate[0];

    directive.template = '<label class="item item-radio">' +
        '<input type="radio" name="radio-group">' +
        '<div class="item-content disable-pointer-events" ng-transclude></div>' +
        '<i class="radio-icon disable-pointer-events icon flaticon-radio-checked"></i>' +
        '<i class="radio-icon disable-pointer-events icon flaticon-radio-unchecked" style="visibility: visible"></i>' +
      '</label>';

    return $delegate;
  });

  //TODO caricare le stringhe da file esterni
  $translateProvider.translations('en', {
    "Monday.1": "Monday",
    "Lost & Wishlist.1": "Lost & Wishlist"
  })
  .translations('it', {
    "Comics": "Fumetti",
    "Comics removed": "Fumetti rimossi",
    "Releases": "Uscite",
    "Lost & Wishlist": "Persi &amp; desiderati",
    "Lost & Wishlist.1": "Persi & desiderati",
    "Purchased": "Acquistati",
    "To buy": "Da acquistare",
    "Settings": "Impostazioni",
    "CANCEL": "ANNULLA",
    "Sort by release": "Ordina per uscita",
    "Sort by name": "Ordina per nome",
    "New comics entry": "Nuovo fumetto",
    "Edit comics entry": "Modifica",
    "Name": "Nome",
    "Publisher": "Editore",
    "Series": "Serie",
    "Authors": "Autore",
    "Price": "Prezzo",
    "Comics released every": "Fumetto in uscita ogni",
    "Not specified": "Non specificato",
    "Week": "Settimana",
    "Month": "Mese",
    "2 months": "2 mesi",
    "3 months": "3 mesi",
    "4 months": "4 mesi",
    "6 months": "6 mesi",
    "Year": "Anno",
    "Reserved": "Prenotato",
    "Notes": "Note",
    "comics title": "titolo",
    "publisher": "editore",
    "comics series": "serie",
    "authors": "autore",
    "price": "prezzo",
    "notes": "note",
    "Group by week": "Raggruppa per settimane",
    "Group by month": "Raggruppa per mesi",
    "This week": "Questa settimana",
    "Next week": "Settimana prossima",
    "This month": "Questo mese",
    "Next month": "Mese prossimo",
    "Wishlist": "Lista dei desideri",
    "Lost": "Persi",
    "Releases removed": "Uscite rimosse",
    "Release purchased": "Numero acquistato",
    "Purchase canceled": "Acquisto annullato",
    "Releases purchased": "Numeri acquistati",
    "Issue #": "Numero",
    "release number": "numero uscita",
    "Date": "Data",
    "Release date is required with reminder checked!": "Data obbligatoria con il promemoria attivo",
    "Purchased.1": "Acquistato",
    "General settings": "Impostazioni generali",
    "Backup data": "Backup dei dati",
    "Data": "Dati",
    "About Comikku": "Informazioni",
    "Auto fill release data": "Impostazione automatica nuova uscita",
    "Week start on": "La settimana inizia di",
    "Monday": "Luned&igrave;",
    "Monday.1": "Lunedì",
    "Sunday": "Domenica",
    "On start show": "All'avvio mostra",
    "Data": "Dati",
    "Delete": "Elimina",
    "Delete all data": "Elimina tutti i dati",
    "Delete releases": "Rimuovi uscite",
    "You\'ll lose all comics and releases!": "Perderai tutti i fumetti e le uscite!",
    "Reset settings": "Ripristina le impostazioni di default",
    "Cancel": "Annulla",
    "About": "Informazioni",
    "Backup data.1": "Esegui il backup dei dati",
    "Restore": "Ripristina",
    "Restore data": "Ripristina i dati",
    "Last backup:": "Ultimo backup:",
    "not found": "non trovato",
    "Backup": "Backup",
    "Backup data?": "Eseguire il backup dei dati?",
    "Previous backup will be overridden.": "Eventuali backup precedenti verranno sovrascritti.",
    "Backup complete": "Backup completo",
    "Restore": "Ripristina",
    "Restore data from backup?": "Ripristinare i dati dal bakcup?",
    "Current data will be overridden.": "I dati correnti verranno sovrascritti.",
    "Restore complete": "Ripristino completato",
    "Confirm": "Conferma",
    "Delete all data?": "Eliminare tutti i dati?",
    "Data deleted": "Dati eliminati",
    "Reset to default Settings?": "Ripristinare le impostazioni di default?",
    "Cancel": "Annulla",
    "OK": "OK",
    "Enabled": "Abilitata",
    "Disabled": "Disabilitata",
    "Ordered": "Ordinato",
    "Releases ordered": "Numeri ordinati",
    "Order canceled": "Ordine annullato",
    "Send comment": "Invia commenti",
    "Comment about Comikku": "Commenti su Comikku",
    "Version": "Versione",
    "Done": "Fatto",
    "Group releases by": "Raggruppa uscite per"
  });

  //imposto la lingua di default
  $translateProvider.preferredLanguage("en")
    .fallbackLanguage("en")
    .determinePreferredLanguage()
    .useStorage('StorageService');
  //
  moment.locale('en');

  //configuro il pulsante 'back' in modo che non mostri alcun testo (ma solo l'icona)
  $ionicConfigProvider.backButton.text('').previousTitleText(false);

  //
  $stateProvider

    .state('app', {
      url: "/app",
      abstract: true,
      templateUrl: "templates/tabs.html",
      controller: 'AppCtrl'
    })

    .state('app.comics', {
      url: "/comics",
      views: {
        'app-comics' :{
          templateUrl: "templates/comics.html",
          controller: 'ComicsCtrl'
        }
      }
    })
/*    .state('app.comics_editor', {
      url: "/comics/:comicsId",
      views: {
        'app-comics' :{
          templateUrl: "templates/comicsEditor.html",
          controller: 'ComicsEditorCtrl'
        }
      }
    })*/

    .state('app.releases', {
      url: "/releases",
      views: {
        'app-releases' :{
          templateUrl: "templates/releases.html",
          controller: 'ReleasesEntryCtrl'
        }
      }
    })
    .state('app.releases_entry', {
      url: "/comics/:comicsId/releases",
      views: {
        'app-comics' :{
          templateUrl: "templates/releases.html",
          controller: 'ReleasesEntryCtrl'
        }
      }
    })
/*    .state('app.comics_release_editor', {
      url: "/comics/:comicsId/releases/:releaseId",
      views: {
        'app-comics' :{
          templateUrl: "templates/releaseEditor.html",
          controller: 'ReleaseEditorCtrl'
        }
      }
    })
    .state('app.releases_release_editor', {
      url: "/comics/:comicsId/releases/:releaseId",
      views: {
        'app-releases' :{
          templateUrl: "templates/releaseEditor.html",
          controller: 'ReleaseEditorCtrl'
        }
      }
    })
    .state('app.wishlist_release_editor', {
      url: "/comics/:comicsId/releases/:releaseId",
      views: {
        'app-wishlist' :{
          templateUrl: "templates/releaseEditor.html",
          controller: 'ReleaseEditorCtrl'
        }
      }
    })*/

    .state('app.wishlist', {
      url: "/wishlist",
      views: {
        'app-wishlist' :{
          templateUrl: "templates/releases.html",
          controller: 'ReleasesEntryCtrl'
        }
      }
    })
    .state('app.purchased', {
      url: "/purchased",
      views: {
        'app-purchased' :{
          templateUrl: "templates/releases.html",
          controller: 'ReleasesEntryCtrl'
        }
      }
    })

    .state('app.options', {
      url: "/options",
      views: {
        'app-options' :{
          templateUrl: "templates/options.html",
          controller: 'OptionsCtrl'
        }
      }
    })
    .state('app.settings', {
      url: "/settings",
      views: {
        'app-settings' :{
          templateUrl: "templates/settings.html",
          controller: 'OptionsCtrl'
        }
      }
    })
    .state('app.about', {
      url: "/about",
      views: {
        'app-about' :{
          templateUrl: "templates/about.html",
          controller: 'OptionsCtrl'
        }
      }
    })
    .state('app.backup', {
      url: "/backup",
      views: {
        'app-backup' :{
          templateUrl: "templates/backup.html",
          controller: 'OptionsCtrl'
        }
      }
    })
    .state('app.debug', {
      url: "/debug",
      views: {
        'app-debug' :{
          templateUrl: "templates/debug.html",
          controller: 'OptionsCtrl'
        }
      }
    });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise($initOptionsProvider.defaultUrl);
}])

.run(['$ionicPlatform', '$translate', '$state', '$ionicHistory', '$settings', '$rootScope', '$rmmTrack', '$ionicActionSheet', '$filter',
function($ionicPlatform, $translate, $state, $ionicHistory, $settings, $rootScope, $rmmTrack, $ionicActionSheet, $filter) {

  //imposto la lingua a moment prima che parta cordova
  //  visto che solitamente parte dopo il caricamento della prima pagina
  moment.locale($translate.use());
  //console.log("Language moment " + moment.locale() + " translate " + $translate.use());

  $ionicPlatform.ready(function() {
    //inizializzo tracking
    if ($settings.userOptions.traceEnabled == 'T') {
      $rootScope.$on('$stateChangeSuccess',
      function(event, toState, toParams, fromState, fromParams) {
        $rmmTrack.start();
        $rmmTrack.view(toState.url);
        $rmmTrack.event('ROUTE_EVT', 'STATE_CHANGE_START', 'params', toParams);
        //visualizzo nuovamente la barra delle tab eventualmente nascosta tramite l'attributo hide-tabs
        //console.log('$stateChangeSuccess', toState, toParams, fromState, fromParams);
        $rootScope.hideTabs = false;
      });
    } else {
      $rootScope.$on('$stateChangeSuccess',
      function(event, toState, toParams, fromState, fromParams) {
        //visualizzo nuovamente la barra delle tab eventualmente nascosta tramite l'attributo hide-tabs
        //console.log('$stateChangeSuccess', toState, toParams, fromState, fromParams);
        $rootScope.hideTabs = false;
      });      
    }
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

    //leggo la lingua di sistema e la uso in moment e $translate
    if(typeof navigator.globalization !== "undefined") {
      navigator.globalization.getPreferredLanguage(function(language) {
        var lang = (language.value).split("-")[0];
        moment.locale(lang);
        $translate.use(lang)/*.then(function(data) {
          console.log("SUCCESS -> " + data);
        }, function(error) {
          console.log("ERROR -> " + error);
        })*/;
      });
    }

    //gesisco l'evento resume
    $ionicPlatform.on('resume', function() {
      if ($settings.userOptions.traceEnabled == 'T') {
        $rmmTrack.start();
        $rmmTrack.view('HOME');
        $rmmTrack.event('APP_EVT', 'resume');
      }
    });

    //gestisco il pulsante harware del menu su dispositivi android
    //  per aprire l'action sheet
    var fnActionSheetHide;
    function showActionSheet() {
      if (fnActionSheetHide) {
        fnActionSheetHide();
      } else {
        fnActionSheetHide = $ionicActionSheet.show({
          cssClass: 'android',
          buttons: [
              { text: $filter('translate')('Settings') },
              { text: $filter('translate')('Data') },
              { text: $filter('translate')('About Comikku') }
            ],
          cancel: function() {
            fnActionSheetHide = null;
          },
          buttonClicked: function(index) {
            if (index == 0) {
              $state.go('app.settings');
            } else if (index == 1) {
              $state.go('app.backup');
            } else {
              $state.go('app.about');
            }
            fnActionSheetHide = null;
            return true;
          }
         });
      }
    }
    if (window.cordova) {
      document.addEventListener("menubutton", showActionSheet, false);
    } else {
      document.addEventListener("keypress", function(evt) {
        if (evt.which == 109) { showActionSheet(); }
      }, false);
    }

    //nascondo la splash screen al termine del caricamento
    if (navigator.splashscreen) {
      navigator.splashscreen.hide();
    }
  });

  $ionicPlatform.registerBackButtonAction(function(e) {
    //console.log("BACK BTN " + $ionicHistory.currentView().url + " def " + $settings.userOptions.defaultUrl);
    var backView = $ionicHistory.backView();
    if (backView) {
      backView.go();
    // } else if ($ionicHistory.currentView().url != $settings.userOptions.defaultUrl) {
    //   console.log("go to def view " + $settings.userOptions.defaultUrl);
    //   $state.go();
    } else {
      $settings.save();
      ionic.Platform.exitApp();
    }
  }, 100);
}]);

angular.module('starter.controllers', ['starter.services'])
.controller('AppCtrl', [ '$scope', '$settings', '$comicsData', '$rmmTrack',
function($scope, $settings, $comicsData, $rmmTrack) {
  //
  console.log("***** Comikku STARTING");
  //
  $settings.load();
  //console.log("   ---- LOAD " + JSON.stringify($settings.userOptions))
  moment.weekStartOnMonday($settings.userOptions.weekStartMonday == 'T');
  //leggo l'elenco dei fumetti (per utente USER)
  $comicsData.read('USER');
  //
  $scope.$on('$ionicView.beforeEnter', function(scopes, states) {
    $scope.uid = $comicsData.uid;
    $scope.debugMode = ($settings.userOptions.debugMode == 'T');
  });
}]);
