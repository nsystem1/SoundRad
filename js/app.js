'use strict';
// Beta config
var clientID = '66828e9e2042e682190d1fde4b02e265';
var callbackUrl = 'http://beta.soundrad.com/callback';
// Official config
// var clientID = '683f27c0c6dace16e7498ebffcbef8be';
// var callbackUrl = 'http://soundrad.com/callback';
'use strict';
var app = angular.module('app', [
    'ngTouch',
    'ngRoute'
  ]);
app.config([
  '$routeProvider',
  '$locationProvider',
  function ($routeProvider, $locationProvider) {
    $routeProvider.when('/', {
      templateUrl: '/partials/stream.html',
      controller: 'StreamCtrl'
    });
    $routeProvider.when('/callback', {
      templateUrl: '/partials/callback.html',
      controller: 'CallbackCtrl'
    });
    $routeProvider.when('/settings', {
      templateUrl: '/partials/settings.html',
      controller: 'SettingsCtrl'
    });
    $routeProvider.when('/search', {
      templateUrl: '/partials/search.html',
      controller: 'SearchCtrl'
    });
    $routeProvider.when('/:user', {
      templateUrl: '/partials/user.html',
      controller: 'UserCtrl'
    });
    $routeProvider.when('/:user/likes', {
      templateUrl: '/partials/likes.html',
      controller: 'LikesCtrl'
    });
    $routeProvider.when('/:user/sets', {
      templateUrl: '/partials/sets.html',
      controller: 'SetsCtrl'
    });
    $routeProvider.when('/:user/sets/:set', {
      templateUrl: '/partials/set.html',
      controller: 'SetCtrl'
    });
    $locationProvider.html5Mode(true);
  }
]);
'use strict';
app.factory('soundcloud', [
  '$window',
  '$http',
  'storage',
  function ($window, $http, storage) {
    var soundcloud = {};
    var token = storage.get('token');
    // soundcloud.api = 'https://api-v2.soundcloud.com';
    soundcloud.api = 'https://api.soundcloud.com';
    soundcloud.params = {
      client_id: clientID,
      oauth_token: token
    };
    soundcloud.next_href = null;
    soundcloud.connect = function () {
      $window.location.href = 'https://soundcloud.com/connect?client_id=' + clientID + '&redirect_uri=' + callbackUrl + '&response_type=code_and_token&scope=non-expiring&display=popup';
    };
    soundcloud.get = function (path, callback) {
      $http.get(this.api + path, { params: this.params }).error(function (err) {
        console.error('error', err);
      }).success(function (data) {
        if (callback)
          callback(data);
      });
    };
    soundcloud.getStream = function (callback) {
      $http.get(this.api + '/me/activities/tracks', { params: this.params }).error(function (err) {
        console.error('error', err);
      }).success(function (data) {
        soundcloud.next_href = data.next_href;
        var tracks = [];
        for (var i = 0; i < data.collection.length; i++) {
          tracks.push(data.collection[i].origin);
        }
        if (callback)
          callback(tracks);
      });
    };
    soundcloud.getStreamNextPage = function (callback) {
      $http.get(this.next_href, { params: this.params }).error(function (err) {
        console.error('error', err);
      }).success(function (data) {
        soundcloud.next_href = data.next_href;
        var tracks = [];
        for (var i = 0; i < data.collection.length; i++) {
          tracks.push(data.collection[i].origin);
        }
        if (callback)
          callback(tracks);
      });
    };
    return soundcloud;
  }
]);
'use strict';
app.factory('player', [
  'soundcloud',
  function (soundcloud) {
    var player = {};
    player.params = '?';
    var paramsArray = [];
    for (var param in soundcloud.params) {
      paramsArray.push(encodeURIComponent(param) + '=' + encodeURIComponent(soundcloud.params[param]));
    }
    ;
    player.params += paramsArray.join('&');
    player.audio = document.createElement('audio');
    player.tracks = [];
    player.index = 0;
    // Consider using audio.paused instead
    //player.playing = false;
    player.load = function (tracks) {
      this.tracks = tracks;
    };
    player.play = function (index) {
      if (index != null)
        this.index = index;
      if (!this.tracks[this.index])
        return false;
      this.audio.src = this.tracks[this.index].stream_url + this.params;
      this.audio.play();
    };
    player.pause = function () {
      this.audio.pause();
    };
    player.playPause = function () {
      if (this.audio.paused) {
        if (!this.audio.src)
          this.audio.src = this.tracks[this.index].stream_url + this.params;
        this.audio.play();
      } else {
        this.audio.pause();
      }
    };
    player.next = function () {
      if (this.index < this.tracks.length - 1) {
        this.index++;
        this.play();
      }
    };
    player.previous = function () {
      if (this.index > 0) {
        this.index--;
        this.play();
      }
    };
    player.audio.addEventListener('ended', function () {
      player.next();
    }, false);
    return player;
  }
]);
'use strict';
app.factory('storage', function () {
  return {
    set: function (key, obj) {
      var string = JSON.stringify(obj);
      localStorage.setItem(key, string);
    },
    get: function (key, callback) {
      var data = localStorage.getItem(key);
      var obj = JSON.parse(data);
      return obj;
    },
    clear: function () {
      localStorage.clear();
    }
  };
});
'use strict';
app.directive('icon', function () {
  var sprite = {
      play: 'M0 0 L32 16 L0 32 z',
      pause: 'M0 0 H12 V32 H0 z M20 0 H32 V32 H20 z',
      previous: 'M0 0 H4 V14 L32 0 V32 L4 18 V32 H0 z',
      next: 'M0 0 L28 14 V0 H32 V32 H28 V18 L0 32 z',
      close: 'M4 8 L8 4 L16 12 L24 4 L28 8 L20 16 L28 24 L24 28 L16 20 L8 28 L4 24 L12 16 z',
      chevronRight: 'M12 1 L26 16 L12 31 L8 27 L18 16 L8 5 z',
      chevronLeft: 'M20 1 L24 5 L14 16 L24 27 L20 31 L6 16 z',
      heart: 'M0 10 C0 6, 3 2, 8 2 C12 2, 15 5, 16 6 C17 5, 20 2, 24 2 C30 2, 32 6, 32 10 C32 18, 18 29, 16 30 C14 29, 0 18, 0 10'
    };
  return {
    restrict: 'A',
    scope: true,
    link: function (scope, elem, attrs) {
      var el = elem[0], id = attrs.icon, path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      console.log(id);
      if (!sprite[id])
        return false;
      el.classList.add('plangular-icon', 'plangular-icon-' + id);
      el.setAttribute('viewBox', '0 0 32 32');
      el.setAttribute('style', 'max-height:100%');
      el.setAttribute('fill', 'currentcolor');
      path.setAttribute('d', sprite[id]);
      el.appendChild(path);
    }
  };
});
'use strict';
app.controller('MainCtrl', [
  '$scope',
  '$window',
  '$location',
  'storage',
  'soundcloud',
  'player',
  function ($scope, $window, $location, storage, soundcloud, player) {
    $scope.currentUser = storage.get('currentUser');
    $scope.token = storage.get('token');
    $scope.player = player;
    $scope.audio = player.audio;
    // Get token from URL hash
    if ($location.hash()) {
      var token = $location.hash().replace('#', '').split('&')[0].split('=')[1];
      if (token) {
        storage.set('token', token);
        $scope.token = token;
        soundcloud.params.oauth_token = token;
        soundcloud.get('/me', function (data) {
          $scope.currentUser = data;
          storage.set('currentUser', data);
          console.log('me', data);
        });
        $location.search('');
        $location.hash('');
      }
      ;
    }
    ;
    $scope.connect = soundcloud.connect;
    $scope.logout = function () {
      storage.clear();
      $window.location.href = '/';
    };
  }
]);
'use strict';
app.controller('TracklistCtrl', [
  '$scope',
  'player',
  function ($scope, player) {
  }
]);
'use strict';
app.controller('StreamCtrl', [
  '$scope',
  'soundcloud',
  'player',
  function ($scope, soundcloud, player) {
    $scope.page = 0;
    $scope.isLoading = true;
    soundcloud.getStream(function (data) {
      $scope.tracks = data;
      $scope.isLoading = false;
      player.load(data);
    });
    $scope.loadMore = function () {
      $scope.isLoading = true;
      soundcloud.getStreamNextPage(function (data) {
        $scope.tracks = $scope.tracks.concat(data);
        $scope.isLoading = false;
        player.load($scope.tracks);
      });
    };
  }
]);
'use strict';
app.controller('UserCtrl', [
  '$scope',
  '$routeParams',
  'soundcloud',
  'player',
  function ($scope, $routeParams, soundcloud, player) {
    soundcloud.get('/users/' + $routeParams.user, function (data) {
      $scope.user = data;
    });
    soundcloud.get('/users/' + $routeParams.user + '/tracks', function (data) {
      $scope.tracks = data;
      player.load(data);
    });
  }
]);
'use strict';
app.controller('LikesCtrl', [
  '$scope',
  '$routeParams',
  'soundcloud',
  'player',
  function ($scope, $routeParams, soundcloud, player) {
    console.log('likes controller', $routeParams);
    $scope.user = {};
    $scope.user.username = $routeParams.user;
    soundcloud.get('/users/' + $routeParams.user, function (data) {
      $scope.user = data;
    });
    soundcloud.get('/users/' + $routeParams.user + '/favorites', function (data) {
      $scope.tracks = data;
      player.load(data);
    });
  }
]);
'use strict';
app.controller('SetsCtrl', [
  '$scope',
  'soundcloud',
  function ($scope, soundcloud) {
    console.log('sets controller');
  }
]);
'use strict';
app.controller('SetCtrl', [
  '$scope',
  'soundcloud',
  function ($scope, soundcloud) {
    console.log('set controller');
  }
]);