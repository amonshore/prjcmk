/**
 * Ionic Angular module: rmm
 * - $utils
 * - $undoPopup: Undo Popup (google way)
 *   promise return: 'ok', 'timeout', 'discarded'
 * - $toast: simple toast
 * - $datex: date munipulation utilities
 * - $file: cordova file utilities
 */

var IonicModule = angular.module('rmm', ['ngAnimate', 'ngSanitize', 'ui.router']),
  extend = angular.extend,
  forEach = angular.forEach,
  isDefined = angular.isDefined,
  isString = angular.isString,
  jqLite = angular.element;

var UNDO_TPL = 
  '<div class="undo-container">' +
    '<span ng-bind-html="title"></span>' +
    '<a href="" ng-click="$undo($event)" ng-bind-html="text" autofocus></a>'
  '</div>';

var TOAST_TPL = 
  '<div class="toast-container" ng-class="position">' +
    '<span ng-bind-html="text"></span>'
  '</div>';

IonicModule
.factory('$utils', function() {
  return {
    //
    indexFindWhere: function(arr, filter) {
      var found = false;
      for (var ii=0; ii<arr.length; ii++) {
        found = true;
        for (var aa in filter) {
          if (arr[ii][aa] !== filter[aa]) {
            found = false
          }
        }
        if (found) return ii;
      }
      return -1;
    },
    //
    arrayAddRange: function(dst, src, from, len) {
      if (_.isArray(src)) {
        var start = from || 0;
        var end = start + Math.min(src.length, len || src.length);
        for (var ii=start; ii<end; ii++) {
          dst.push(src[ii]);
        }
      } else {
        dst.push(src);
      }
      return dst;
    }
  };
});

/*
$undoPopup
TODO: 
- se già aperto chiuderlo con resolve false -> OK
- posizionare al centro orizzontalmente (calcolare width?) -> per ora risolvo con margin-left: -125px;
- chiudere su perdita focus
- gestire back
*/

IonicModule
.factory('$undoPopup', [
  '$ionicTemplateLoader',
  '$q',
  '$timeout',
  '$document',
  '$ionicGesture',
  '$ionicPlatform',
function($ionicTemplateLoader, $q, $timeout, $document, $ionicGesture, $ionicPlatform) {
	
  var previousUndo = null;
	var $undoPopup = {
		show: showPopup,
		_createPopup: createPopup
	}; //end $undoPopup

	return $undoPopup;

	function createPopup(options) {
		options = extend({
			scope: null,
			title: 'Operation done',
			text: '<i class="icon ion-android-system-back"></i> CANCEL',
      timeout: 0 //nessun timeout
		}, options || {});

    if (options.timeout == 'short') options.timeout = 2000;
    else if (options.timeout == 'long') options.timeout = 10000;

		var popupPromise = $ionicTemplateLoader.compile({
			template: UNDO_TPL,
			scope: options.scope && options.scope.$new(),
			appendTo: $document[0].body
		});
		//per ora non supporto il template da URL
		var contentPromise =  $q.when(options.template || options.content || '');

		return $q.all([popupPromise, contentPromise])
    .then(function(results) {
      var self = results[0];
      var content = results[1];
      var responseDeferred = $q.defer();

      self.responseDeferred = responseDeferred;

      extend(self.scope, {
      	title: options.title,
      	text: options.text,
      	$undo: function(event) {
      		event = event.originalEvent || event; //jquery events
      		if (!event.defaultPrevented) {
      			responseDeferred.resolve('ok');
      		}
      	}
      });

      self.show = function() {
        if (self.isShown) return;

        self.isShown = true;
        ionic.requestAnimationFrame(function() {
          //if hidden while waiting for raf, don't show
          if (!self.isShown) return;

          self.element.removeClass('undo-hidden');
          self.element.addClass('undo-showing active');
          focusInput(self.element);

          self.fnTouch = function(e) { if (e.target.parentNode != self.element[0]) responseDeferred.resolve('lostfocus'); };
          self.gesture = $ionicGesture.on('touch', self.fnTouch, $document);

          if (options.timeout > 0) {
            self.timeoutPromise = $timeout(function() {
              responseDeferred.resolve('timeout');
            }, options.timeout);
          }
        });
      };
      self.hide = function(callback) {
        callback = callback || angular.noop;
        if (!self.isShown) return callback();

        self.isShown = false;
        self.element.removeClass('active');
        self.element.addClass('undo-hidden');
        $timeout(callback, 250);
      };
      self.remove = function() {
        if (self.removed) return;

        self.hide(function() {
          self.element.remove();
          self.scope.$destroy();
          if (self.timeoutPromise) $timeout.cancel(self.timeoutPromise);
          $ionicGesture.off(self.gesture, 'touch', self.fnTouch);
        });

        self.removed = true;
      };

      return self;
    });
	} //end createPopup

	function onHardwareBackButton(e) {
		previousUndo && previousUndo.responseDeferred.resolve('back');
	} //end onHardwareBackButton

	function showPopup(options) {
		var popupPromise = $undoPopup._createPopup(options);

    if (previousUndo) {
      previousUndo.responseDeferred.resolve('discarded');
    }

    var resultPromise = $timeout(angular.noop, 0)
    .then(function() { return popupPromise; })
    .then(function(popup) {
      previousUndo = popup;

      $undoPopup._backButtonActionDone = $ionicPlatform.registerBackButtonAction(
        onHardwareBackButton, 400);

      popup.show();
      return popup.responseDeferred.promise.then(function(result) {
        popup.remove();
        ($undoPopup._backButtonActionDone || angular.noop)();
        return result;
      });
    });

    return resultPromise;
	} //end showPopup

  function focusInput(element) {
    var focusOn = element[0].querySelector('[autofocus]');
    if (focusOn) {
      focusOn.focus();
    } //end focusInput
  }

}]); //end $undoPopup

IonicModule
.factory('$toast', [
  '$ionicTemplateLoader',
  '$q',
  '$timeout',
  '$document',
function($ionicTemplateLoader, $q, $timeout, $document) {
  
  var previousToast = null;
  var $toast = {
    show: showToast,
    _createToast: createToast
  }; //end $undoPopup

  return $toast;

  function createToast(options) {
    if (typeof(options) == "string") options = { text: options };

    options = extend({
      scope: null,
      text: 'message',
      timeout: 'short',
      position: 'bottom'
    }, options || {});

    if (options.timeout == 'short' || options.timeout < 0) options.timeout = 2000;
    else if (options.timeout == 'long') options.timeout = 10000;
    else if (options.timeout == 'none') options.timeout = -1;

    var popupPromise = $ionicTemplateLoader.compile({
      template: TOAST_TPL,
      scope: options.scope && options.scope.$new(),
      appendTo: $document[0].body
    });
    //per ora non supporto il template da URL
    var contentPromise =  $q.when(options.template || options.content || '');

    return $q.all([popupPromise, contentPromise])
    .then(function(results) {
      var self = results[0];
      var content = results[1];
      var responseDeferred = $q.defer();

      self.responseDeferred = responseDeferred;

      extend(self.scope, {
        text: options.text,
        position: options.position
      });

      self.show = function() {
        if (self.isShown) return;

        self.isShown = true;
        ionic.requestAnimationFrame(function() {
          //if hidden while waiting for raf, don't show
          if (!self.isShown) return;

          self.element.removeClass('toast-hidden');
          self.element.addClass('toast-showing active');

          if (options.timeout > 0) {
            self.timeoutPromise = $timeout(function() {
              responseDeferred.resolve('timeout');
            }, options.timeout);
          }
        });
      };
      self.hide = function(callback) {
        callback = callback || angular.noop;
        if (!self.isShown) return callback();

        self.isShown = false;
        self.element.removeClass('active');
        self.element.addClass('toast-hidden');
        $timeout(callback, 250);
      };
      self.remove = function() {
        if (self.removed) return;

        self.hide(function() {
          self.element.remove();
          self.scope.$destroy();
          if (self.timeoutPromise) $timeout.cancel(self.timeoutPromise);
        });

        self.removed = true;
      };

      return self;
    });
  } //end createPopup

  function onHardwareBackButton(e) {
    //TODO risolvere se back premuto
  } //end onHardwareBackButton

  function showToast(options) {
    var popupPromise = $toast._createToast(options);

    if (previousToast) {
      previousToast.responseDeferred.resolve('discarded');
    }

    var resultPromise = $timeout(angular.noop, 0)
    .then(function() { return popupPromise; })
    .then(function(popup) {
      previousToast = popup;
      popup.show();
      return popup.responseDeferred.promise.then(function(result) {
        popup.remove();
        return result;
      });
    });

    return resultPromise;
  } //end showToast

}]); //end $toast

IonicModule
.factory('$datex', function() {
  var $datex = {
    weekStartMonday: false,
    getDay: function(date) {
      var day = date.getDay();
      if (this.weekStartMonday) {
        if (day == 0) return 6;
        else return day-1;
      } else {
        return day;
      }
    },
    firstDayOfWeek: function(date) {
      if (!date) date = new Date();
      var dd = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      dd.setDate(date.getDate() - this.getDay(date));
      return dd;
    },
    lastDayOfWeek: function(date) {
      if (!date) date = new Date();
      var dd = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      dd.setDate(date.getDate() - this.getDay(date) + 6);
      return dd;
    },
    firstDayOfMonth: function(date) {
      if (!date) date = new Date();
      var dd = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      dd.setDate(1);
      return dd;
    },
    lastDayOfMonth: function(date) {
      if (!date) date = new Date();
      return new Date(date.getFullYear(), date.getMonth()+1, 0);
    },
    fromNow: function(milliseconds) {
      return new Date(Date.now() + milliseconds);
    },
    getMax: function() {
      return new Date(9999, 11, 31);
    },
    addDays: function(date, days) {
      var dd = new Date(date.getTime());
      dd.setDate(dd.getDate() + days);
      return dd;
    },
    addMonths: function(date, months) {
      var dd = new Date(date.getTime());
      dd.setMonth(dd.getMonth() + months);
      return dd;
    },
    add: function(date, type, amount) {
      var dd = new Date(date.getTime());
      if (type == 'M')
        dd.setMonth(dd.getMonth() + amount);
      else if (type == 'Y')
        dd.setFullYear(dd.getFullYear() + amount);
      else if (type == 'd')
        dd.setDate(dd.getDate() + amount);
      else if (type == 'W')
        dd.setDate(dd.getDate() + (amount * 7));
      return dd;
    }
  };
  return $datex;
}); //end $datex

IonicModule
.factory('$file', ['$q' ,function($q) {

  if (!window.cordova) return {};

  return {
    //
    readFileAsText: function(file) {
      console.log("readFileAsText " + file);

      var q = $q.defer();
      getFileEntry(file).then(function(fileEntry) {
        console.log("readFileAsText " + fileEntry);

        fileEntry.file(function(file) {
          var reader = new FileReader();
          reader.onloadend = function(evt) {
            q.resolve(this.result);
          };
          reader.readAsText(file);
        },
        function(error) {
          q.reject(error);
        });
      })
      return q.promise;
    },
    //
    readFileMetadata: function(file) {
      console.log("readFileMetadata " + file);

      var q = $q.defer();
      getFileEntry(file).then(
        function(fileEntry) {
          console.log("fileEntry " + fileEntry);

          fileEntry.file(function(file) {
            q.resolve({ modificationTime: new Date(file.lastModified), size: file.size });
          },
          function(error) {
            q.reject(error);
          });
        },
        function(error) {
          q.reject(error);
        }
      );
      return q.promise;
    },
    //
    writeFile: function(file, content) {
      console.log("writeFile " + file);

      var q = $q.defer();
      getFileEntry(file, true).then(function(fileEntry) {
        console.log("writeFile " + fileEntry);

        fileEntry.createWriter(function(writer) {
          writer.truncate(0);
          writer.onwriteend = function(evt) {
            writer.write(content);
            writer.onwriteend = function(evt) {
              q.resolve(writer.length);
            };
          };
        }, 
        function(error) {
          q.reject(error);
        });
      })
      return q.promise;
    },
    //
    FileError: { NOT_FOUND_ERR: 1, SECURITY_ERR: 2, ABORT_ERR: 3, NOT_READABLE_ERR: 4, ENCODING_ERR: 5, NO_MODIFICATION_ALLOWED_ERR: 6, INVALID_STATE_ERR: 7, SYNTAX_ERR: 8, INVALID_MODIFICATION_ERR: 9, QUOTA_EXCEEDED_ERR: 10, TYPE_MISMATCH_ERR: 11, PATH_EXISTS_ERR: 12 }
  };

  function getFileEntry(file, create) {
    //console.log("getFileEntry " + directory + file);

    var directory = cordova.file.externalDataDirectory;
    if (false) { //if device.platform.toLowerCase() == "android"
      directory += "Android/data/it.amonshore.comikku/files";
    }

    console.log("getFileEntry: " + directory + file);

    var q = $q.defer();
    window.resolveLocalFileSystemURL(directory, 
      function(entry) {
        console.log("resolve ok: " + JSON.stringify(entry));
        entry.getFile(file, {create: create || false}, 
          function(fileEntry) {
            q.resolve(fileEntry);
          },
          function(error) {
            console.log("getFile err: " + JSON.stringify(error));
            q.reject(error);
          }
        );
      },
      function(error) {
        console.log("resolve err: " + JSON.stringify(error));
        q.reject(error);
      }
    );
    return q.promise;
  }

}]); //end $file

IonicModule
.factory('$debounce', ['$rootScope', '$browser', '$q', '$exceptionHandler',
    function($rootScope,   $browser,   $q,   $exceptionHandler) {
        var deferreds = {},
            methods = {},
            uuid = 0;

        function debounce(fn, delay, invokeApply) {
            var deferred = $q.defer(),
                promise = deferred.promise,
                skipApply = (angular.isDefined(invokeApply) && !invokeApply),
                timeoutId, cleanup,
                methodId, bouncing = false;

            // check we dont have this method already registered
            angular.forEach(methods, function(value, key) {
                if(angular.equals(methods[key].fn, fn)) {
                    bouncing = true;
                    methodId = key;
                }
            });

            // not bouncing, then register new instance
            if(!bouncing) {
                methodId = uuid++;
                methods[methodId] = {fn: fn};
            } else {
                // clear the old timeout
                deferreds[methods[methodId].timeoutId].reject('bounced');
                $browser.defer.cancel(methods[methodId].timeoutId);
            }

            var debounced = function() {
                // actually executing? clean method bank
                delete methods[methodId];

                try {
                    deferred.resolve(fn());
                } catch(e) {
                    deferred.reject(e);
                    $exceptionHandler(e);
                }

                if (!skipApply) $rootScope.$apply();
            };

            timeoutId = $browser.defer(debounced, delay);

            // track id with method
            methods[methodId].timeoutId = timeoutId;

            cleanup = function(reason) {
                delete deferreds[promise.$$timeoutId];
            };

            promise.$$timeoutId = timeoutId;
            deferreds[timeoutId] = deferred;
            promise.then(cleanup, cleanup);

            return promise;
        }


        // similar to angular's $timeout cancel
        debounce.cancel = function(promise) {
            if (promise && promise.$$timeoutId in deferreds) {
                deferreds[promise.$$timeoutId].reject('canceled');
                return $browser.defer.cancel(promise.$$timeoutId);
            }
            return false;
        };

        return debounce;
}]);

//http://forum.ionicframework.com/t/internationalization-of-an-ionic-app-multilanguage-support/8380/11
IonicModule
.factory('StorageService', ['$window', function($window) {
  return {
    set: function(key, value) {
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    setObject: function(key, value) {
      $window.localStorage[key] = angular.toJson(value);
    },
    getObject: function(key) {
      return angular.fromJson($window.localStorage[key]);
    }
  }
}]); // end of StorageService

//direttiva per gestire nella maniera corretta la conversione in Date delle stringhe con un input[date]
//  (nelle versioni precednti in angular input[date] era sempre gestito come una stringa mentre adesso come Date)
IonicModule
.directive( 'rmmInputDate', function() {
    return {
        restrict : 'A', //attributo (rmm-input-date)
        require : ['?ngModel'], //richiede ngModel
        priority : 100,
        link : function( scope, element, attr, ngModel ) {
          if ( attr.type === "date" ) {
            var model = ngModel[0];
            model.$parsers.push( function(value){
              //console.log('value', value, moment.locale());
              if (!value)
                return '';
              return moment(value).format('YYYY-MM-DD');
            });
            model.$formatters.push(function formatter(modelValue){
              //console.log('modelValue', modelValue, moment.locale());
              return moment(modelValue).toDate();
            });
          }
        }
    };
} );

//nascondo la barra delle tab
IonicModule
.directive('hideTabs', function($rootScope) {
    return {
        restrict: 'A',
        link: function(scope, element, attributes) {
            $rootScope.hideTabs = (attributes.hideTabs == 'true');

            // scope.$on('$ionicView.beforeEnter', function(scopes, states) {
            //   $rootScope.hideTabs = (attributes.hideTabs == 'true');
            //   console.log('rmm $ionicView.beforeEnter', $rootScope.hideTabs)
            // });

            scope.$on('$destroy', function() {
                $rootScope.hideTabs = false;
            });
        }
    };
});

// //https://github.com/driftyco/ionic/issues/2674
// //thx to cbruun
// //risolve il problema del menu laterale che non si chiude con lo swype
// IonicModule
// .directive('fixAndroidTouch', [
//   '$rootScope', '$ionicPlatform',
//   function(rootScope, ionicPlatform) {
//     return {
//       link: function() {
//         ionicPlatform.ready().then(function() {
//           if (ionic.Platform.isAndroid()) {
//             var documentOnTouchMoveFix = function (event) {
//               event.preventDefault();
//             };

//             document.ontouchmove = documentOnTouchMoveFix;

//             rootScope.$on('$ionicView.afterEnter', function () {
//               document.ontouchmove = documentOnTouchMoveFix;
//             });
//           }
//         });
//       }
//     };
//   }
// ]);

//
IonicModule
.factory('$dialogs', ['$q', 
function($q) {
  return {
    showPicker: function(config) {
      //sono costretto ad usare $q altrimenti non viene aggiornata la vista 
      var q = $q.defer();

      window.plugins.listpicker.showPicker(config, 
          function(item) {
            q.resolve(item);
          }, function() {
            q.reject();
          }
      );

      return q.promise;
    }
  };
}]);

//
IonicModule
.factory('$rmmTrack', ['$cordovaGoogleAnalytics', function($cordovaGoogleAnalytics) {
  var gaUserId = 'UID_' + (new Date()).getTime();

  return {
    start: function() {
      if (window.cordova) {
        $cordovaGoogleAnalytics.debugMode();
        $cordovaGoogleAnalytics.startTrackerWithId('UA-59687686-1');
        $cordovaGoogleAnalytics.setUserId(gaUserId);
      } else {
        console.log("starting track ", gaUserId);
      }
    },
    view: function(view) {
      if (window.cordova) {
        $cordovaGoogleAnalytics.trackView(view);
      } else {
        console.log("track view ", view);
      }
    },
    event: function(category, action, label, value) {
      if (window.cordova) {
        $cordovaGoogleAnalytics.trackEvent(category, action, label, value);
      } else {
        console.log("track event ", category, action, label, value);
      }
    }
  };
}]);