angular.module('starter.controllers')
.controller('OptionsCtrl', [
	'$scope', '$q', '$ionicPopup', '$undoPopup', '$toast', '$ionicPopover', '$ionicModal', 
  '$file', '$timeout', '$filter', 
  '$comicsData', '$settings', '$ionicNavBarDelegate', '$translate', '$ionicHistory',
  '$dialogs', '$cordovaDialogs', '$cordovaGoogleAnalytics',
function($scope, $q, $ionicPopup, $undoPopup, $toast, $ionicPopover, $ionicModal, 
  $file, $timeout, $filter, 
  $comicsData, $settings, $ionicNavBarDelegate, $translate, $ionicHistory,
  $dialogs, $cordovaDialogs, $cordovaGoogleAnalytics) {
  //
  //TODO caricare i dati in beforeExit
  //
  $scope.version = null;
  $scope.lastBackup = $filter('translate')('not found');
  $scope.currentUser = $comicsData.uid;
  $scope.langinfo = 'moment: ' + moment.locale() + ' - translate: ' + $translate.use();
  //
  if (window.cordova && window.cordova.getAppVersion) {
    window.cordova.getAppVersion(function (version) {
      $scope.version = version;
    });
  }

  //
  $scope.userOptions = $settings.userOptions;
  //console.log($scope.userOptions)
  $scope.optionsChanged = function() {
    moment.weekStartOnMonday($scope.userOptions.weekStartMonday == 'T');
    $settings.save();
    //salvo anche i dati per forzare il refresh delle view comics e relases
    $comicsData.save();
  };
  //
  $scope.chooseAutoFill = function() {
    if (!window.cordova) {
      $scope.autoFillPopup = $ionicPopup.show({
        templateUrl: 'autoFillReleaseData.html',
        title: $filter('translate')('Auto fill release data'),
        scope: $scope,
        buttons: [{
          text: $filter('translate')('Cancel'),
          type: 'button-default',
          onTap: function(e) { return false; }
        }]
      });
      $scope.autoFillPopup.then(function(res) {
        if (res) {
          $scope.optionsChanged();
        }
      });
    } else {
      var config = {
        title: $filter('translate')('Auto fill release data'),
        items: [
          { value: "F", text: $filter('translate')('Disabled') },
          { value: "T", text: $filter('translate')('Enabled') }
        ],
        selectedValue: $scope.userOptions.autoFillReleaseData,
          doneButtonLabel: $filter('translate')('Done'),
          cancelButtonLabel: $filter('translate')('Cancel')
      };

      $dialogs.showPicker(config).then(function(res) {
        $scope.userOptions.autoFillReleaseData = res;
        $scope.optionsChanged();
      });      
    }
  };
  //
  $scope.chooseWeekStart = function() {
    if (!window.cordova) {
      $scope.weekStartPopup = $ionicPopup.show({
        templateUrl: 'weekStartMonday.html',
        title: $filter('translate')('Week start on'),
        scope: $scope,
        buttons: [{
          text: $filter('translate')('Cancel'),
          type: 'button-default',
          onTap: function(e) { return false; }
        }]
      });
      $scope.weekStartPopup.then(function(res) {
        if (res) {
          $scope.optionsChanged();
        }
      });
    } else {
      var config = {
        title: $filter('translate')('Week start on'),
        items: [
          { value: "F", text: $filter('translate')('Sunday') },
          { value: "T", text: $filter('translate')('Monday.1') }
        ],
        selectedValue: $scope.userOptions.weekStartMonday,
          doneButtonLabel: $filter('translate')('Done'),
          cancelButtonLabel: $filter('translate')('Cancel')
      };

      $dialogs.showPicker(config).then(function(res) {
        $scope.userOptions.weekStartMonday = res;
        $scope.optionsChanged();
      });      
    }
  };
  //
  $scope.chooseDefaultUrl = function() {
    if (!window.cordova) {
      $scope.defaultUrlPopup = $ionicPopup.show({
        templateUrl: 'defaultUrl.html',
        title: $filter('translate')('On start show'),
        scope: $scope,
        buttons: [{
          text: $filter('translate')('Cancel'),
          type: 'button-default',
          onTap: function(e) { return false; }
        }]
      });
      $scope.defaultUrlPopup.then(function(res) {
        if (res) {
          $scope.optionsChanged();
        }
      });
    } else {
      var config = {
        title: $filter('translate')('On start show'),
        items: [
          { value: "/app/comics", text: $filter('translate')('Comics') },
          { value: "/app/releases", text: $filter('translate')('Releases') },
          { value: "/app/wishlist", text: $filter('translate')('Lost & Wishlist.1') },
          { value: "/app/purchased", text: $filter('translate')('Purchased') }
        ],
        selectedValue: $scope.userOptions.defaultUrl,
          doneButtonLabel: $filter('translate')('Done'),
          cancelButtonLabel: $filter('translate')('Cancel')
      };

      $dialogs.showPicker(config).then(function(res) {
        $scope.userOptions.defaultUrl = res;
        $scope.optionsChanged();
      });      
    }
  };
  //
  $scope.resetOptions = function() {
    $ionicPopup.confirm({
      title: $filter('translate')('Confirm'),
      template: $filter('translate')('Reset to default Settings?'),
      cancelText: $filter('translate')('Cancel'),
      okText: $filter('translate')('OK')
    }).then(function(res) {
      if (res) {
        $settings.loadDefault();
        $settings.save();
        $scope.userOptions = $settings.userOptions;
        $toast.show("Settings reset to default");
      }
    });
  };
  //
  $scope.deleteAllData = function() {
    if (!window.cordova) {
      $ionicPopup.confirm({
        title: $filter('translate')('Delete all data?'),
        template: $filter('translate')('You\'ll lose all comics and releases!'),
        cancelText: $filter('translate')('Cancel'),
        okText: $filter('translate')('Delete')
      }).then(function(res) {
        if (res) {
          $comicsData.clear();
          $comicsData.save();
          $toast.show($filter('translate')('Data deleted'));
        }
      });
    } else {
      $cordovaDialogs.confirm($filter('translate')('You\'ll lose all comics and releases!'),
        $filter('translate')('Delete all data?'),
        [ $filter('translate')('Cancel'), $filter('translate')('Delete') ] ).then(function(res) {
          if (res === 2) { //delete
            $comicsData.clear();
            $comicsData.save();
            $toast.show($filter('translate')('Data deleted'));
          } 
        });
    }
  };
  //
  $scope.repairData = function() {
    $ionicPopup.confirm({
      title: $filter('translate')('Confirm'),
      template: 'Repair data?'
    }).then(function(res) {
      if (res) {
        $comicsData.repairData();
        $comicsData.save();
        $comicsData.read($comicsData.uid, true);
        $toast.show("Data repaired");
      }
    });
  };
  //
  $scope.readLastBackup = function() {
    if (window.cordova) {
      $comicsData.getLastBackup().then(function(result) {
        $scope.lastBackup = $filter('date')(result.modificationTime, 'medium');
      }, function(error) {
        console.log('readLastBackup ' + JSON.stringify(error));
        $scope.lastBackup = $filter('translate')('not found');
      });
    }
  };
  //
  $scope.backup = function() {
    if (!window.cordova) {
      $ionicPopup.confirm({
        title: $filter('translate')('Backup data?'),
        template: $filter('translate')('Previous backup will be overridden.'),
        cancelText: $filter('translate')('Cancel'),
        okText: $filter('translate')('Backup')
      }).then(function(res) {
        if (res) {
          $comicsData.backupDataToFile().then(function(res) {
            $scope.readLastBackup();
            $toast.show($filter('translate')('Backup complete'));
          }, function(error) {
            $toast.show("Write error " + error.code);
          });
        }
      });
    } else {
      $cordovaDialogs.confirm($filter('translate')('Previous backup will be overridden.'),
        $filter('translate')('Backup data?'),
        [ $filter('translate')('Cancel'), $filter('translate')('Backup') ] ).then(function(res) {
          if (res === 2) { //backup
            $comicsData.backupDataToFile().then(function(res) {
              $scope.readLastBackup();
              $toast.show($filter('translate')('Backup complete'));
            }, function(error) {
              $toast.show("Write error " + error.code);
            });
          } 
        });
    }
  };
  //
  $scope.restore = function() {
    if (!window.cordova) {
      $ionicPopup.confirm({
        title: $filter('translate')('Restore data from backup?'),
        template: $filter('translate')('Current data will be overridden.'),
        cancelText: $filter('translate')('Cancel'),
        okText: $filter('translate')('Restore')
      }).then(function(res) {
        if (res) {
          $comicsData.restoreDataFromFile().then(function(res) {
            $toast.show($filter('translate')('Restore complete'));
          }, function(error) {
            $toast.show("Read error " + error.code);
          });
        }
      });
    } else {
      $cordovaDialogs.confirm($filter('translate')('Current data will be overridden.'),
        $filter('translate')('Restore data from backup?'),
        [ $filter('translate')('Cancel'), $filter('translate')('Restore') ] ).then(function(res) {
          if (res === 2) { //restore
            $comicsData.restoreDataFromFile().then(function(res) {
              $toast.show($filter('translate')('Restore complete'));
            }, function(error) {
              $toast.show("Read error " + error.code);
            });
          } 
        });
    }      
  };
  //
  $scope.readLastBackup();

  //
  $scope.avatarTapped = 5;
  $scope.tapAvatar = function() {
    if ($settings.userOptions.debugMode == 'F' && $scope.avatarTapped <= 0) {
      $scope.avatarTapped = 5;
    }
    if (--$scope.avatarTapped <= 0) {
      $settings.userOptions.debugMode = 'T';
      $toast.show("Debug mode enabled!");
    } else if ($scope.avatarTapped <= 3) {
      $toast.show("You are now " + $scope.avatarTapped + " steps away from debug mode!");
    }
  };

  //DEBUG
  //
  $scope.fakeEntries = function() {
    // $comicsData.update( $comicsData.newComics( { id: "new", name: "One Piece", publisher: "Star Comics" } ) );
    // $comicsData.update( $comicsData.newComics( { id: "new", name: "Naruto", publisher: "Planet Manga" } ) );
    // $comicsData.update( $comicsData.newComics( { id: "new", name: "Dragonero", publisher: "Bonelli" } ) );
    // $comicsData.update( $comicsData.newComics( { id: "new", name: "Gli incredibili X-Men", publisher: "Marvel Italia" } ) );
    var dd = new Date();
    for (var ii=1; ii<=100; ii++) {
      var cc = $comicsData.newComics( { id: "new", name: "Comics " + ii, publisher: "Fake" } );
      $comicsData.update(cc);
      var rr = $comicsData.newRelease( { comicsId: cc.id, number: 1, date: $filter('date')(dd, 'yyyy-MM-dd') } );
      $comicsData.updateRelease(cc, rr);

      dd.setDate(dd.getDate() + 1);
    }
    $comicsData.save();
    $toast.show($comicsData.comics.length + " fake comics created");
  };
  //
  $scope.switchUser = function() {
    if ($comicsData.uid == "USER")
      $comicsData.read("DEBUG");
    else
      $comicsData.read("USER");
    $scope.currentUser = $comicsData.uid;
    $scope.readLastBackup();
    $ionicHistory.clearCache();
    $toast.show("Hello " + $scope.currentUser);
  };
  //
  $scope.clearCache = function() {
    $ionicHistory.clearCache();
    $toast.show("Cache cleared");
  };
  // //TEST POPOVER MENU
  // $ionicPopover.fromTemplateUrl('my-popover.html', {
  //   scope: $scope,
  // }).then(function(popover) {
  //   $scope.popover = popover;
  // });
  // $scope.openPopover = function($event) {
  //   $scope.popover.show($event);
  // };  
  //
  $scope.test = function($event) {

    // $scope.openPopover($event)

    // try {

      $cordovaGoogleAnalytics.debugMode();
      $cordovaGoogleAnalytics.startTrackerWithId('UA-59687686-1').then(function(resp) {  console.log('*** startTrackerWithId ' + resp) });
      $cordovaGoogleAnalytics.setUserId('USER_ID').then(function(resp) {  console.log('*** setUserId ' + resp) });
      $cordovaGoogleAnalytics.trackView('OPTIONS_TEST').then(function(resp) {  console.log('*** trackView ' + resp) });

    // } catch (e) {
    //   console.log("TEST ERR" + e);
    // }
  };
}]);