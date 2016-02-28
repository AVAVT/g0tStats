var gotStatsApp = angular.module('gotStatsApp', [
  'ngRoute',
  'gotStatsControlers',
  'gotStatsDirectives'
]);

gotStatsApp.run(function($rootScope, $location, $anchorScroll, $routeParams){
	gotStatsApp.init();
});

gotStatsApp.config(['$routeProvider', function($routeProvider) {
	$routeProvider.
	when('/', {
		templateUrl: 'view/welcome.html'
	}).
	when('/user/:userId', {
		templateUrl: 'view/user-stats.html'
	}).
	otherwise({
		redirectTo: '/'
	});
}]);
