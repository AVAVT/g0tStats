var gotStatsControlers = angular.module('gotStatsControlers', ["googlechart", "ngSanitize"]);

gotStatsControlers.controller('SidebarController',  ['$scope','$rootScope', '$location',function($scope, $rootScope, $location) {

	$scope.scrollTo = function(hash){
		// because fuck angular and all this databinding bullshit that's why
    $('html,body').animate({scrollTop: $("#"+hash).offset().top},'fast');
	}

	$scope.getUserStatistic = function(){

		if(!$scope.searchForm.$invalid){
			$location.path("/user/" + $scope.searchId.trim());

			$scope.searchId = "";
			$scope.searchForm.$setPristine();
		}
	}

	$("#datepicker").flatpickr({
		defaultDate : "today",
		maxDate: "today"
	});

	$scope.saveUserData = function(){
		$rootScope.$emit('saveUserEvent');
	}

	$scope.filterGames = function(){
		$rootScope.$emit('filterGamesEvent');
	}
}]);

gotStatsControlers.controller('UserStatisticsController', ['$scope', '$rootScope', '$routeParams', '$http', '$filter', function($scope, $rootScope, $routeParams, $http, $filter) {
	$('html,body').animate({scrollTop: 0},'fast');

	var that = this;
	var unbindSaveEventWatching = false;
	var unbindFilterEventWatching = false;

	$rootScope.ready = false;
	$rootScope.player = false;

	$scope.loadingPage = 0;
	$scope.totalPages = false;

	$scope.connectionError = false;
	$scope.connectionErrorCode = 200;
	$scope.retryNumber = 0;

	$scope.rankingRetryNumber = 0;

	$scope.destroyed = false;

	var chartConfigs = {
		blackWhiteChart : {
			type : "PieChart",
			options : {
				backgroundColor : "transparent",
				colors : ["#000000", "#f8f8ff"],
				pieSliceTextStyle : {color: "#d93344"},
				legend : { position: "bottom", textStyle: {color: "#f8f8ff", fontName: "Helvetica Neue", fontSize: 14}},
				chartArea : {top: 10}
			}
		},
		colorChart : {
			type : "PieChart",
			options: {
				colors : ["#d93344","#41CD64", "#5486d1", "#9d4dc5"],
				backgroundColor : "transparent",
				legend : { position: "bottom", textStyle: {color: "#f8f8ff", fontName: "Helvetica Neue", fontSize: 14}},
				chartArea : {top: 10}
			}
		},
		outcomeChart : {
			type : "ColumnChart",
			options : {
				colors : ["#d93344","#41CD64", "#5486d1", "#9d4dc5"],
				backgroundColor : "transparent",
				isStacked : true,
				legend : { position: "bottom", textStyle: {color: "#f8f8ff", fontName: "Helvetica Neue", fontSize: 14}},
				hAxis : {textStyle : {color: "#f8f8ff", fontName: "Helvetica Neue", fontSize: 11} },
				vAxis : {textStyle : {color: "#f8f8ff", fontName: "Helvetica Neue", fontSize: 11} },
				chartArea : {top: 10}
			}
		},
		activityChart : {
			type : "ColumnChart",
			options : {
				colors : ["#d93344","#41CD64", "#5486d1", "#9d4dc5"],
				backgroundColor : "transparent",
				isStacked : true,
				legend : { position: "bottom", textStyle: {color: "#f8f8ff", fontName: "Helvetica Neue", fontSize: 14}},
				hAxis : {textStyle : {color: "#f8f8ff", fontName: "Helvetica Neue", fontSize: 11} },
				vAxis : {textStyle : {color: "#f8f8ff", fontName: "Helvetica Neue", fontSize: 11} },
				chartArea : {top: 10}
			}
		}
	}

	var globalSiteRankingData = {
		rank : 0,
		upperLim : 1,
		lowerLim : 0,
		currentPage : 1
	};

	$scope.statistics = {
		allGames : [],

		chartData : {
			totalGames : jQuery.extend(true, {}, chartConfigs.blackWhiteChart),
			totalWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),
			blackWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),
			whiteWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),

			winsDistribution: jQuery.extend(true, {}, chartConfigs.colorChart),
			lossesDistribution: jQuery.extend(true, {}, chartConfigs.colorChart),
			allGamesOutcome : jQuery.extend(true, {}, chartConfigs.outcomeChart),

			totalRankedGames : jQuery.extend(true, {}, chartConfigs.blackWhiteChart),
			totalRankedWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),
			blackRankedWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),
			whiteRankedWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),

			totalUnrankedGames : jQuery.extend(true, {}, chartConfigs.blackWhiteChart),
			totalUnrankedWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),
			blackUnrankedWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),
			whiteUnrankedWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),

			totalEvenGames : jQuery.extend(true, {}, chartConfigs.blackWhiteChart),
			totalEvenWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),
			blackEvenWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),
			whiteEvenWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),

			totalTournamentGames : jQuery.extend(true, {}, chartConfigs.blackWhiteChart),
			totalTournamentWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),
			blackTournamentWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),
			whiteTournamentWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),

			allBoardSizes : jQuery.extend(true, {}, chartConfigs.colorChart),
			nineteenWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),
			thirteenWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),
			nineWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),
			otherSizesWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),

			allTimeSettings : jQuery.extend(true, {}, chartConfigs.colorChart),
			blitzWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),
			liveWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),
			correspondenceWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),

			recentActivity : jQuery.extend(true, {}, chartConfigs.activityChart)
		},

		misc : {
			totalPlayers : 0
		},

		showAllGames : true,
		showRankedGames : true,
		showUnrankedGames : true,
		showOpponents : true
	};

	$scope.$on('$destroy', function () {
	  $scope.destroyed = true;
		if(unbindSaveEventWatching){
			unbindSaveEventWatching();
		}

		if(unbindFilterEventWatching){
			unbindFilterEventWatching();
		}
	});

	var init = function(){
		var connectionString = "";
		if(isNaN($routeParams.userId)){
			$http.get("https://online-go.com/api/v1/players/?username="+$routeParams.userId).then(
				function(successData){
					if(successData.data.results.length > 0){
						$scope.statistics.player = successData.data.results[0];
						requestPlayerById(successData.data.results[0].id);
					}
					else{
						$scope.connectionError = true;
						$scope.connectionErrorMessage = "Error: user not found. Are you sure you entered the correct username? If it still doesn't work, try using user id instead.";
					}
				},
				function(errorData){
					$scope.connectionError = true;
					$scope.connectionErrorMessage = "Error connecting to OGS server. <strong>Error code: " + errorData.status + "</strong>. Please try again later or contact me if you really have the need to stalk that person.";
				}
			);
		}
		else{
			requestPlayerById($routeParams.userId);
		}
	}

	var requestPlayerById = function(id){
		$http.get("https://online-go.com/api/v1/players/" + id).then(
			function(successData){
				$scope.statistics.player = successData.data;
				$rootScope.player = {username : successData.data.username, rank : gotStatsApp.utilities.convertRankToDisplay(successData.data.ranking), id: successData.data.id, isRanked : (successData.data.provisional_games_left < 1)};
				getAllGames(onGameFetchingComplete);
			},
			function(errorData){
				$scope.connectionError = true;
				$scope.connectionErrorMessage = "Error connecting to OGS server. <strong>Error code: " + errorData.status + "</strong>. Please try again later or contact me if you really have the need to stalk that person.";
			}
		);
	}

	var getAllGames = function(callBack, url){
	  if(url === undefined) url = "https://online-go.com/api/v1/players/" +$scope.statistics.player.id+ "/games/?ended__isnull=false&annulled=false&ordering=-ended&page_size=50";

	  var localData;
	  try{
	    localData = JSON.parse(localStorage.getItem('ogsUserData_'+$scope.statistics.player.id));
	  }
	  catch(e){
	    localData = undefined;
	  }

	  if(!localData){
	    $rootScope.userDataSaved = false;
	  }
	  else{
	    $rootScope.userDataSaved = true;
	  }


	  $http.get(url).then(
	    function(successData){
	      if($scope.destroyed) return;

	      $scope.connectionError = false;
	      $scope.retryNumber = 0;
	      $scope.loadingPage++;
	      $scope.totalPages = Math.ceil(successData.data.count/50);

	      var completedWithLocalStorage = false;

	      if(!localData){
	        $scope.statistics.allGames = $scope.statistics.allGames.concat(successData.data.results);
	      }
	      else{
	        for(var i=0;i<successData.data.results.length;i++){
	          if(successData.data.results[i].id == localData[0].id){
	            $scope.statistics.allGames = $scope.statistics.allGames.concat(localData);
	            completedWithLocalStorage = true;
	            break;
	          }
	          else{
	            $scope.statistics.allGames.push(successData.data.results[i]);
	          }
	        }
	      }

	      if(!completedWithLocalStorage && successData.data.next != null)
	        getAllGames(callBack, successData.data.next.replace("http://", "https://"));
	      else{
	        // Finishes querying
	        if(!!localData) saveUserData();
					$scope.statistics.analyzingGames = $scope.statistics.allGames;
	        callBack();
	      }
	    },
	    function(errorData){
	      if($scope.destroyed) return;

	      // If you can't get what this part mean, it means I don't know shit about Angularjs
	      $scope.connectionError = true;
	      $scope.retryNumber+=1;

	      if($scope.retryNumber < 5){
	          $scope.connectionErrorMessage = "Error connecting to OGS server. <strong>Error code: " + errorData.status + "</strong>. Retrying in "+(retryNumber*retryNumber)+" seconds...";
	          setTimeout(function(){getAllGames(callBack, url);}, $scope.retryNumber*$scope.retryNumber*1000);
	      }
	      else{
	        $scope.connectionErrorMessage = "Error connecting to OGS server. <strong>Error code: " + errorData.status + "</strong>. Please try again later or contact me if you really have the need to stalk that person.";
	      }
	    }
	  );
	};

	var calculateGlobalRanking = function(){
		var url = "https://online-go.com/api/v1/players?ordering=-rating&numProvisional__lt=1" + (globalSiteRankingData.currentPage > 1 ? ("&page="+globalSiteRankingData.currentPage) : "");

		$http.get(url).then(
			function(successData){
				if($scope.destroyed) return;

				$scope.rankingConnectionError = false;
				$scope.rankingRetryNumber = 0;
				$scope.statistics.misc.totalPlayers = successData.data.count;


				if(parseFloat(successData.data.results[successData.data.results.length-1].rating) > parseFloat($scope.statistics.player.rating)) {
					// console.log("UpperLim: " + globalSiteRankingData.currentPage + " Player rating: " + $scope.statistics.player.rating + " Comparision rating: "+successData.data.results[successData.data.results.length-1].rating);
					globalSiteRankingData.upperLim = globalSiteRankingData.currentPage;
				}
				else if(parseFloat(successData.data.results[0].rating) < parseFloat($scope.statistics.player.rating)) {
					// console.log("LowerLim: " + globalSiteRankingData.currentPage + " Player rating: " + $scope.statistics.player.rating + " Comparision rating: "+successData.data.results[0].rating);
					globalSiteRankingData.lowerLim = globalSiteRankingData.currentPage;
				}
				else {
					// console.log("Page hit: " + globalSiteRankingData.currentPage);
					globalSiteRankingData.rank = (globalSiteRankingData.currentPage-1)*gotStatsApp.config.ogsResultPageSize;
					for(var i=0;i<successData.data.results.length;i++){
						globalSiteRankingData.rank++
						if(successData.data.results[i].id == $scope.statistics.player.id){
							$scope.statistics.misc.globalRankMsg = "#" + globalSiteRankingData.rank + " amongs all " + $scope.statistics.misc.totalPlayers + " non-provisional players."
							return true;
						}
					}

					$scope.statistics.misc.globalRankMsg = "Not found, probably because of an error. I really need this information, if possible please <a href='mailto:itsavavt@gmail.com'>send me a message</a> with the id of this particular player.";
					return false;
				}

				var upperRank = globalSiteRankingData.upperLim*gotStatsApp.config.ogsResultPageSize;
				var lowerRank = globalSiteRankingData.lowerLim != 0 ? ((globalSiteRankingData.lowerLim-1)*gotStatsApp.config.ogsResultPageSize + 1) : 0;

				$scope.statistics.misc.globalRankMsg = "Below " + upperRank + (lowerRank != 0 ? (" and above "+lowerRank) : "" ) + "..." + ($scope.statistics.player.ranking < 20 ? " (It could take some time to get this information if you are DDK, please be patient)" : "");

				if(globalSiteRankingData.lowerLim == 0){
					globalSiteRankingData.currentPage+= 20;
					calculateGlobalRanking();
				}
				else if(globalSiteRankingData.lowerLim != 0 && globalSiteRankingData.lowerLim - globalSiteRankingData.upperLim > 1){
					globalSiteRankingData.currentPage = Math.floor((globalSiteRankingData.lowerLim + globalSiteRankingData.upperLim)/2);
					calculateGlobalRanking();
				}
				else{
					$scope.statistics.misc.globalRankMsg = "Not found, probably because of an error. I really need this information, if possible please <a href='mailto:itsavavt@gmail.com'>send me a message</a> with the id of this particular player.";
				}
			},
			function(errorData){
				// If you can't get what this part mean, it means I don't know shit about Angularjs
				if($scope.destroyed) return;

				var connectionErrorCode = errorData.status;
				$scope.rankingRetryNumber+=1;

				if($scope.retryNumber < 5){
					setTimeout(function(){calculateGlobalRanking();}, $scope.rankingRetryNumber*$scope.rankingRetryNumber*1000);
					$scope.statistics.misc.globalRankMsg = "Error connecting to OGS server with error code: "+connectionErrorCode+". Retrying in " + ($scope.rankingRetryNumber*$scope.rankingRetryNumber) + " seconds.";
				}
				else{
					$scope.statistics.misc.globalRankMsg = "Error connecting to OGS server with error code: "+connectionErrorCode+". Please try again later.";
				}
			}
		);
	}

	var onGameFetchingComplete = function(){
		// Clear date filter values since this is a new user
		$("#datepicker").val("");

		populateDisplays();

		unbindSaveEventWatching = $rootScope.$on('saveUserEvent', saveUserData);
		unbindFilterEventWatching = $rootScope.$on('filterGamesEvent', filterGames);
	}

	var populateDisplays = function(){
		generateAllGamesData();
		generateRankedGamesData();
		generateUnrankedGamesData();
		generateEvenGamesData();
		generateTournamentGamesData();
		generateBoardSizesData();
		generateTimeSettingsData();
		generateOpponentsData();
		generateMiscData();

		$rootScope.ready = true;

		if($scope.statistics.totalGames <= 0){
			$scope.statistics.showAllGames = false;
		}
		if($scope.statistics.totalRankedGames <= 0){
			$scope.statistics.showRankedGames = false;
		}
		if($scope.statistics.totalUnrankedGames <= 0){
			$scope.statistics.showUnrankedGames = false;
		}
		if($scope.statistics.totalOpponents <= 0){
			$scope.statistics.showOpponents = false;
		}
	}

	var filterGames = function(){
		var date = new Date($(datepicker).val());
		if(gotStatsApp.utilities.validateDate(date)){
			$scope.statistics.analyzingGames = [];

			for(var i=0; i < $scope.statistics.allGames.length; i++){
				if(new Date($scope.statistics.allGames[i].started) > date){
					$scope.statistics.analyzingGames.push($scope.statistics.allGames[i]);
				}
				else break;
			}
		}
		else{
			$scope.statistics.analyzingGames = $scope.statistics.allGames;
		}

		populateDisplays();
	}

	var saveUserData = function(){
		localStorage.clear();
		localStorage.setItem('ogsUserData_'+$scope.statistics.player.id, JSON.stringify($scope.statistics.analyzingGames));
		$rootScope.userDataSaved = true;
	}

	/*
	 *	ALL GAMES STATISTICS
	 */
	var generateAllGamesData = function(){
		var game;
		var blackGames = 0, whiteGames = 0,
				blackLosses = 0, whiteLosses = 0;
		var outcomeChartData = {
			"Opp+Count" : 0,
			"Opp+Res" 	: 0,
			"Opp+Time" 	: 0,
			"Opp+40+"		: 0,
			"Opp+30+"		: 0,
			"Opp+20+"		: 0,
			"Opp+10+"		: 0,
			"Opp+0+"		: 0,
			"Plr+0+"		: 0,
			"Plr+10+"		: 0,
			"Plr+20+"		: 0,
			"Plr+30+"		: 0,
			"Plr+40+"		: 0,
			"Plr+Time"	: 0,
			"Plr+Res"		: 0,
			"Plr+Count" : 0
		};

		for(var i=0;i<$scope.statistics.analyzingGames.length; i++){
			game = $scope.statistics.analyzingGames[i];

			if(game.players.black.id == $scope.statistics.player.id){
				blackGames++;
				if(game.black_lost){
					blackLosses++;
					outcomeChartData = calculateGameOutcome(false, game, outcomeChartData);
				}
				else{
					outcomeChartData = calculateGameOutcome(true, game, outcomeChartData);
				}
			}
			else{
				whiteGames++;
				if(game.white_lost){
					whiteLosses++;
					outcomeChartData = calculateGameOutcome(false, game, outcomeChartData);
				}
				else{
					outcomeChartData = calculateGameOutcome(true, game, outcomeChartData);
				}
			}
		}

		$scope.statistics.totalGames = $scope.statistics.analyzingGames.length;

		if(blackLosses > 50){
			$scope.statistics.lost50 = true;
		}

		$scope.statistics.chartData.totalGames.data = {
			"cols" : [
				{id: "c", label: "Color", type: "string"},
				{id: "g", label: "Games", type: "number"},
			],
			"rows": [
				{c: [ {v: "Black"}, {v: blackGames} ]},
				{c: [ {v: "White"}, {v: whiteGames} ]},
			]
		};

		if(whiteGames + blackGames > 0){
			$scope.statistics.chartData.totalWinRate.data = {
				"cols" : [
					{id: "r", label: "Result", type: "string"},
					{id: "g", label: "Games", type: "number"},
				],
				"rows": [
					{c: [ {v: "Losses"}, {v: (whiteLosses + blackLosses)} ]},
					{c: [ {v: "Wins"}, {v: (whiteGames - whiteLosses + blackGames - blackLosses)} ]},
				]
			};
		}

		if(blackGames > 0){
			$scope.statistics.chartData.blackWinRate.data = {
				"cols" : [
					{id: "r", label: "Result", type: "string"},
					{id: "g", label: "Games", type: "number"},
				],
				"rows": [
					{c: [ {v: "Losses"}, {v: blackLosses} ]},
					{c: [ {v: "Wins"}, {v: (blackGames - blackLosses)} ]},
				]
			};
		}

		if(whiteGames > 0){
			$scope.statistics.chartData.whiteWinRate.data = {
				"cols" : [
					{id: "r", label: "Result", type: "string"},
					{id: "g", label: "Games", type: "number"},
				],
				"rows": [
					{c: [ {v: "Losses"}, {v: whiteLosses} ]},
					{c: [ {v: "Wins"}, {v: (whiteGames - whiteLosses)} ]},
				]
			};
		}

		$scope.statistics.chartData.winsDistribution.data = {
			"cols" : [
				{id: "r", label: "Result", type: "string"},
				{id: "g", label: "Games", type: "number"},
			],
			"rows": [
				{c: [ {v: "Resign"}, {v: outcomeChartData["Plr+Res"]} ]},
				{c: [ {v: "Timeout"}, {v: outcomeChartData["Plr+Time"]} ]},
				{c: [ {v: "Scoring"}, {v: outcomeChartData["Plr+Count"]} ]},
			]
		};

		$scope.statistics.chartData.lossesDistribution.data = {
			"cols" : [
				{id: "r", label: "Result", type: "string"},
				{id: "g", label: "Games", type: "number"},
			],
			"rows": [
				{c: [ {v: "Resign"}, {v: outcomeChartData["Opp+Res"]} ]},
				{c: [ {v: "Timeout"}, {v: outcomeChartData["Opp+Time"]} ]},
				{c: [ {v: "Scoring"}, {v: outcomeChartData["Opp+Count"]} ]},
			]
		};

		$scope.statistics.chartData.allGamesOutcome.data = {
			"cols" : [
				{id: "o", label: "Outcome", type: "string"},
				{id: "g", label: "Games opponent wins", type: "number"},
				{id: "g", label: "Games " + $scope.player.username + " wins", type: "number"},
			],
			"rows": [
				{c: [ {v: "40+"}, {v: outcomeChartData["Opp+40+"]} ]},
				{c: [ {v: "30+"}, {v: outcomeChartData["Opp+30+"]} ]},
				{c: [ {v: "20+"}, {v: outcomeChartData["Opp+20+"]} ]},
				{c: [ {v: "10+"}, {v: outcomeChartData["Opp+10+"]} ]},
				{c: [ {v: "0+"}, {v: outcomeChartData["Opp+0+"]} ]},
				{c: [ {v: "0+"}, {v: 0}, {v: outcomeChartData["Plr+0+"]} ]},
				{c: [ {v: "10+"}, {v: 0}, {v: outcomeChartData["Plr+10+"]} ]},
				{c: [ {v: "20+"}, {v: 0}, {v: outcomeChartData["Plr+20+"]} ]},
				{c: [ {v: "30+"}, {v: 0}, {v: outcomeChartData["Plr+30+"]} ]},
				{c: [ {v: "40+"}, {v: 0}, {v: outcomeChartData["Plr+40+"]} ]}
			]
		};
	}

	var calculateGameOutcome = function(isWin, game, outcomeChartData){
		// ];
		if(game.outcome == "Resignation"){
			if(isWin){
				outcomeChartData["Plr+Res"]++;
			}
			else {
				outcomeChartData["Opp+Res"]++;
			}
		}
		else if(game.outcome == "Timeout"){
			if(isWin){
				outcomeChartData["Plr+Time"]++;
			}
			else {
				outcomeChartData["Opp+Time"]++;
			}
		}
		else if(!isNaN(game.outcome.split(" ")[0])){
			var points = parseFloat(game.outcome.split(" ")[0]);
			var result = "";

			if(points < 10){
				result = "0+";
			}
			else if(points < 20){
				result = "10+";
			}
			else if(points < 30){
				result = "20+";
			}
			else if(points < 40){
				result = "30+";
			}
			else{
				result = "40+";
			}

			if(isWin){
				result = "Plr+" + result;
				outcomeChartData["Plr+Count"]++;
			}
			else{
				result = "Opp+" + result;
				outcomeChartData["Opp+Count"]++;
			}
			outcomeChartData[result]++;
		}
		else{
			console.log("Error parsing game outcome: " + game.outcome);
		}

		return outcomeChartData;
	}

	/*
	 *	RANKED GAMES STATISTICS
	 */
	var generateRankedGamesData = function(){
		var rankedBlack = 0, rankedWhite = 0,
				rankedBlackLosses = 0, rankedWhiteLosses = 0;
		var game;

		for(var i=0;i<$scope.statistics.analyzingGames.length; i++){
			game = $scope.statistics.analyzingGames[i];
			if(game.ranked){
				if(game.players.black.id == $scope.statistics.player.id){
					rankedBlack++;
					if(game.black_lost) rankedBlackLosses++;
				}
				else{
					rankedWhite++;
					if(game.white_lost) rankedWhiteLosses++;
				}
			}
		}

		$scope.statistics.totalRankedGames = rankedBlack + rankedWhite;

		$scope.statistics.chartData.totalRankedGames.data = {
			"cols" : [
				{id: "c", label: "Color", type: "string"},
				{id: "g", label: "Games", type: "number"},
			],
			"rows": [
				{c: [ {v: "Black"}, {v: rankedBlack} ]},
				{c: [ {v: "White"}, {v: rankedWhite} ]},
			]
		};

		if(rankedBlack+rankedWhite > 0){
			$scope.statistics.chartData.totalRankedWinRate.data = {
				"cols" : [
					{id: "c", label: "Result", type: "string"},
					{id: "g", label: "Games", type: "number"},
				],
				"rows": [
					{c: [ {v: "Losses"}, {v: (rankedBlackLosses + rankedWhiteLosses)} ]},
					{c: [ {v: "Wins"}, {v: (rankedBlack - rankedBlackLosses + rankedWhite - rankedWhiteLosses)} ]},
				]
			};
		}

		if(rankedBlack > 0){
			$scope.statistics.chartData.blackRankedWinRate.data = {
				"cols" : [
					{id: "c", label: "Result", type: "string"},
					{id: "g", label: "Games", type: "number"},
				],
				"rows": [
					{c: [ {v: "Losses"}, {v: rankedBlackLosses} ]},
					{c: [ {v: "Wins"}, {v: (rankedBlack - rankedBlackLosses)} ]},
				]
			};
		}

		if(rankedWhite > 0){
			$scope.statistics.chartData.whiteRankedWinRate.data = {
				"cols" : [
					{id: "c", label: "Result", type: "string"},
					{id: "g", label: "Games", type: "number"},
				],
				"rows": [
					{c: [ {v: "Losses"}, {v: rankedWhiteLosses} ]},
					{c: [ {v: "Wins"}, {v: (rankedWhite - rankedWhiteLosses)} ]},
				]
			};
		}
	}

	/*
	 * UNRANKED GAMES STATISTICS
	 */
	var generateUnrankedGamesData = function(){
		var unrankedBlack = 0, unrankedWhite = 0,
				unrankedBlackLosses = 0, unrankedWhiteLosses = 0;
		var game;

		for(var i=0;i<$scope.statistics.analyzingGames.length; i++){
			game = $scope.statistics.analyzingGames[i];
			if(!game.ranked){
				if(game.players.black.id == $scope.statistics.player.id){
					unrankedBlack++;
					if(game.black_lost) unrankedBlackLosses++;
				}
				else{
					unrankedWhite++;
					if(game.white_lost) unrankedWhiteLosses++;
				}
			}
		}

		$scope.statistics.totalUnrankedGames = unrankedBlack + unrankedWhite;

		$scope.statistics.chartData.totalUnrankedGames.data = {
			"cols" : [
				{id: "c", label: "Color", type: "string"},
				{id: "g", label: "Games", type: "number"},
			],
			"rows": [
				{c: [ {v: "Black"}, {v: unrankedBlack} ]},
				{c: [ {v: "White"}, {v: unrankedWhite} ]},
			]
		};

		if(unrankedBlack+unrankedWhite > 0){
			$scope.statistics.chartData.totalUnrankedWinRate.data = {
				"cols" : [
					{id: "c", label: "Result", type: "string"},
					{id: "g", label: "Games", type: "number"},
				],
				"rows": [
					{c: [ {v: "Losses"}, {v: (unrankedBlackLosses + unrankedWhiteLosses)} ]},
					{c: [ {v: "Wins"}, {v: (unrankedBlack - unrankedBlackLosses + unrankedWhite - unrankedWhiteLosses)} ]},
				]
			};
		}

		if(unrankedBlack > 0){
			$scope.statistics.chartData.blackUnrankedWinRate.data = {
				"cols" : [
					{id: "c", label: "Result", type: "string"},
					{id: "g", label: "Games", type: "number"},
				],
				"rows": [
					{c: [ {v: "Losses"}, {v: unrankedBlackLosses} ]},
					{c: [ {v: "Wins"}, {v: (unrankedBlack - unrankedBlackLosses)} ]},
				]
			};
		}

		if(unrankedWhite > 0){
			$scope.statistics.chartData.whiteUnrankedWinRate.data = {
				"cols" : [
					{id: "c", label: "Result", type: "string"},
					{id: "g", label: "Games", type: "number"},
				],
				"rows": [
					{c: [ {v: "Losses"}, {v: unrankedWhiteLosses} ]},
					{c: [ {v: "Wins"}, {v: (unrankedWhite - unrankedWhiteLosses)} ]},
				]
			};
		}
	}

	/*
	 * EVEN GAMES STATISTICS
	 */
	 var generateEvenGamesData = function(){
 	  var evenBlack = 0, evenWhite = 0,
 	      evenBlackLosses = 0, evenWhiteLosses = 0;
 	  var game;

 	  for(var i=0;i<$scope.statistics.analyzingGames.length; i++){
 	    game = $scope.statistics.analyzingGames[i];
 	    if(game.handicap == 0){
 	      if(game.players.black.id == $scope.statistics.player.id){
 	        evenBlack++;
 	        if(game.black_lost) evenBlackLosses++;
 	      }
 	      else{
 	        evenWhite++;
 	        if(game.white_lost) evenWhiteLosses++;
 	      }
 	    }
 	  }

 	  $scope.statistics.totalEvenGames = evenBlack + evenWhite;

 	  $scope.statistics.chartData.totalEvenGames.data = {
 	    "cols" : [
 	      {id: "c", label: "Color", type: "string"},
 	      {id: "g", label: "Games", type: "number"},
 	    ],
 	    "rows": [
 	      {c: [ {v: "Black"}, {v: evenBlack} ]},
 	      {c: [ {v: "White"}, {v: evenWhite} ]},
 	    ]
 	  };

 	  if(evenBlack+evenWhite > 0){
 	    $scope.statistics.chartData.totalEvenWinRate.data = {
 	      "cols" : [
 	        {id: "c", label: "Result", type: "string"},
 	        {id: "g", label: "Games", type: "number"},
 	      ],
 	      "rows": [
 	        {c: [ {v: "Losses"}, {v: (evenBlackLosses + evenWhiteLosses)} ]},
 	        {c: [ {v: "Wins"}, {v: (evenBlack - evenBlackLosses + evenWhite - evenWhiteLosses)} ]},
 	      ]
 	    };
 	  }

 	  if(evenBlack > 0){
 	    $scope.statistics.chartData.blackEvenWinRate.data = {
 	      "cols" : [
 	        {id: "c", label: "Result", type: "string"},
 	        {id: "g", label: "Games", type: "number"},
 	      ],
 	      "rows": [
 	        {c: [ {v: "Losses"}, {v: evenBlackLosses} ]},
 	        {c: [ {v: "Wins"}, {v: (evenBlack - evenBlackLosses)} ]},
 	      ]
 	    };
 	  }

 	  if(evenWhite > 0){
 	    $scope.statistics.chartData.whiteEvenWinRate.data = {
 	      "cols" : [
 	        {id: "c", label: "Result", type: "string"},
 	        {id: "g", label: "Games", type: "number"},
 	      ],
 	      "rows": [
 	        {c: [ {v: "Losses"}, {v: evenWhiteLosses} ]},
 	        {c: [ {v: "Wins"}, {v: (evenWhite - evenWhiteLosses)} ]},
 	      ]
 	    };
 	  }
 	}

	/*
	 * TOURANMENT STATISTICS
	 */
	 var generateTournamentGamesData = function(){
	  var tournamentBlack = 0, tournamentWhite = 0,
	      tournamentBlackLosses = 0, tournamentWhiteLosses = 0,
				noTournaments = 0;
		var pastTournaments = [];
	  var game;



	  for(var i=0;i<$scope.statistics.analyzingGames.length; i++){
	    game = $scope.statistics.analyzingGames[i];
	    if(game.tournament != null){

				if(pastTournaments.indexOf(game.tournament) == -1){
					noTournaments++;
					pastTournaments.push(game.tournament);
				}

	      if(game.players.black.id == $scope.statistics.player.id){
	        tournamentBlack++;
	        if(game.black_lost) tournamentBlackLosses++;
	      }
	      else{
	        tournamentWhite++;
	        if(game.white_lost) tournamentWhiteLosses++;
	      }
	    }
	  }

	  $scope.statistics.totalTournaments = noTournaments;

	  $scope.statistics.chartData.totalTournamentGames.data = {
	    "cols" : [
	      {id: "c", label: "Color", type: "string"},
	      {id: "g", label: "Games", type: "number"},
	    ],
	    "rows": [
	      {c: [ {v: "Black"}, {v: tournamentBlack} ]},
	      {c: [ {v: "White"}, {v: tournamentWhite} ]},
	    ]
	  };

	  if(tournamentBlack+tournamentWhite > 0){
	    $scope.statistics.chartData.totalTournamentWinRate.data = {
	      "cols" : [
	        {id: "c", label: "Result", type: "string"},
	        {id: "g", label: "Games", type: "number"},
	      ],
	      "rows": [
	        {c: [ {v: "Losses"}, {v: (tournamentBlackLosses + tournamentWhiteLosses)} ]},
	        {c: [ {v: "Wins"}, {v: (tournamentBlack - tournamentBlackLosses + tournamentWhite - tournamentWhiteLosses)} ]},
	      ]
	    };
	  }

	  if(tournamentBlack > 0){
	    $scope.statistics.chartData.blackTournamentWinRate.data = {
	      "cols" : [
	        {id: "c", label: "Result", type: "string"},
	        {id: "g", label: "Games", type: "number"},
	      ],
	      "rows": [
	        {c: [ {v: "Losses"}, {v: tournamentBlackLosses} ]},
	        {c: [ {v: "Wins"}, {v: (tournamentBlack - tournamentBlackLosses)} ]},
	      ]
	    };
	  }

	  if(tournamentWhite > 0){
	    $scope.statistics.chartData.whiteTournamentWinRate.data = {
	      "cols" : [
	        {id: "c", label: "Result", type: "string"},
	        {id: "g", label: "Games", type: "number"},
	      ],
	      "rows": [
	        {c: [ {v: "Losses"}, {v: tournamentWhiteLosses} ]},
	        {c: [ {v: "Wins"}, {v: (tournamentWhite - tournamentWhiteLosses)} ]},
	      ]
	    };
	  }
	}

	/*
	 *	BOARD SIZES STATISTICS
	 */
	 var generateBoardSizesData = function(){
 		var nineteenGames = 0, thirteenGames = 0, nineGames = 0, otherGames = 0,
 				nineteenLosses = 0, thirteenLosses = 0, nineLosses = 0, otherLosses = 0;
 		var game;

 		for(var i=0;i<$scope.statistics.analyzingGames.length; i++){
 			game = $scope.statistics.analyzingGames[i];
			if(game.width == 19 && game.height == 19){
				nineteenGames++;
				if( (game.players.black.id == $scope.statistics.player.id && game.black_lost)
						|| (game.players.white.id == $scope.statistics.player.id && game.white_lost)){
					nineteenLosses++;
				}
			}
 			else if(game.width == 13 && game.height == 13){
				thirteenGames++;
				if( (game.players.black.id == $scope.statistics.player.id && game.black_lost)
						|| (game.players.white.id == $scope.statistics.player.id && game.white_lost)){
					thirteenLosses++;
				}
			}
			else if(game.width == 9 && game.height == 9){
				nineGames++;
				if( (game.players.black.id == $scope.statistics.player.id && game.black_lost)
						|| (game.players.white.id == $scope.statistics.player.id && game.white_lost)){
					nineLosses++;
				}
			}
			else{
				otherGames++;
				if( (game.players.black.id == $scope.statistics.player.id && game.black_lost)
						|| (game.players.white.id == $scope.statistics.player.id && game.white_lost)){
					otherLosses++;
				}
			}
 		}

 		$scope.statistics.chartData.allBoardSizes.data = {
 			"cols" : [
 				{id: "c", label: "Sizes", type: "string"},
 				{id: "g", label: "Games", type: "number"},
 			],
 			"rows": [
 				{c: [ {v: "19x19"}, {v: nineteenGames} ]},
 				{c: [ {v: "13x13"}, {v: thirteenGames} ]},
				{c: [ {v: "9x9"}, {v: nineGames} ]},
 				{c: [ {v: "Other Sizes"}, {v: otherGames} ]},
 			]
 		};

		if(nineteenGames > 0){
			$scope.statistics.chartData.nineteenWinRate.data = {
	 			"cols" : [
	 				{id: "c", label: "Result", type: "string"},
	 				{id: "g", label: "Games", type: "number"},
	 			],
	 			"rows": [
	 				{c: [ {v: "Losses"}, {v: nineteenLosses} ]},
	 				{c: [ {v: "Wins"}, {v: (nineteenGames - nineteenLosses) } ]},
	 			]
	 		};
		}

		if(thirteenGames > 0){
			$scope.statistics.chartData.thirteenWinRate.data = {
	 			"cols" : [
	 				{id: "c", label: "Result", type: "string"},
	 				{id: "g", label: "Games", type: "number"},
	 			],
	 			"rows": [
	 				{c: [ {v: "Losses"}, {v: thirteenLosses} ]},
	 				{c: [ {v: "Wins"}, {v: (thirteenGames - thirteenLosses)} ]},
	 			]
	 		};
		}

		if(nineGames > 0){
			$scope.statistics.chartData.nineWinRate.data = {
	 			"cols" : [
	 				{id: "c", label: "Result", type: "string"},
	 				{id: "g", label: "Games", type: "number"},
	 			],
	 			"rows": [
	 				{c: [ {v: "Losses"}, {v: nineLosses} ]},
	 				{c: [ {v: "Wins"}, {v: (nineGames - nineLosses)} ]},
	 			]
	 		};
		}

		if(otherGames > 0){
			$scope.statistics.chartData.otherSizesWinRate.data = {
	 			"cols" : [
	 				{id: "c", label: "Result", type: "string"},
	 				{id: "g", label: "Games", type: "number"},
	 			],
	 			"rows": [
	 				{c: [ {v: "Losses"}, {v: otherLosses} ]},
	 				{c: [ {v: "Wins"}, {v: (otherGames - otherLosses)} ]},
	 			]
	 		};
		}
 	}

	/*
	 *	TIME SETTINGS STATISTICS
	 */
	var generateTimeSettingsData = function(){
		var game;
		var blitzGames = 0, liveGames = 0, correspondenceGames = 0,
				blitzLosses = 0, liveLosses = 0, correspondenceLosses = 0;

		for(var i=0;i<$scope.statistics.analyzingGames.length; i++){
			game = $scope.statistics.analyzingGames[i];
			if(game.time_per_move < 20){
				blitzGames++;
				if( (game.players.black.id == $scope.statistics.player.id && game.black_lost)
						|| (game.players.white.id == $scope.statistics.player.id && game.white_lost)){
					blitzLosses++;
				}
			}
			else if(game.time_per_move > 10800){
				correspondenceGames++;
				if( (game.players.black.id == $scope.statistics.player.id && game.black_lost)
						|| (game.players.white.id == $scope.statistics.player.id && game.white_lost)){
					correspondenceLosses++;
				}
			}
			else{
				liveGames++;
				if( (game.players.black.id == $scope.statistics.player.id && game.black_lost)
						|| (game.players.white.id == $scope.statistics.player.id && game.white_lost)){
					liveLosses++;
				}
			}
		}

		$scope.statistics.chartData.allTimeSettings.data = {
 			"cols" : [
 				{id: "c", label: "Type", type: "string"},
 				{id: "g", label: "Games", type: "number"},
 			],
 			"rows": [
 				{c: [ {v: "Blitz"}, {v: blitzGames} ]},
 				{c: [ {v: "Live"}, {v: liveGames} ]},
				{c: [ {v: "Correspondence"}, {v: correspondenceGames} ]}
 			]
 		};
		if(blitzGames > 0){
			$scope.statistics.chartData.blitzWinRate.data = {
	 			"cols" : [
	 				{id: "c", label: "Result", type: "string"},
	 				{id: "g", label: "Games", type: "number"},
	 			],
	 			"rows": [
	 				{c: [ {v: "Losses"}, {v: blitzLosses} ]},
	 				{c: [ {v: "Wins"}, {v: (blitzGames - blitzLosses) } ]},
	 			]
	 		};
		}
		if(liveGames > 0){
			$scope.statistics.chartData.liveWinRate.data = {
	 			"cols" : [
	 				{id: "c", label: "Result", type: "string"},
	 				{id: "g", label: "Games", type: "number"},
	 			],
	 			"rows": [
	 				{c: [ {v: "Losses"}, {v: liveLosses} ]},
	 				{c: [ {v: "Wins"}, {v: (liveGames - liveLosses) } ]},
	 			]
	 		};
		}
		if(correspondenceGames > 0){
			$scope.statistics.chartData.correspondenceWinRate.data = {
	 			"cols" : [
	 				{id: "c", label: "Result", type: "string"},
	 				{id: "g", label: "Games", type: "number"},
	 			],
	 			"rows": [
	 				{c: [ {v: "Losses"}, {v: correspondenceLosses} ]},
	 				{c: [ {v: "Wins"}, {v: (correspondenceGames - correspondenceLosses) } ]},
	 			]
	 		};
		}
	}
	/*
	 *	OPPONENTS STATISTICS
	 */
	var generateOpponentsData = function(){
		var game, opponent;
		var opponents = [], numberOpponents = 0;
		var weakestOpp = {rank: 70}, strongestOpp = { rank : 0}, mostPlayed = { games : 0}, strongestDefeatedOpponent = { rank : 0};
		//var rankDifference = 0;

		for(var i=0;i<$scope.statistics.analyzingGames.length; i++){
			game = $scope.statistics.analyzingGames[i];

			if(game.players.black.id == $scope.statistics.player.id){
				opponent = game.players.white;
				//rankDifference += (game.white_player_rank - game.black_player_rank); Doesn't work

				if(game.white_lost && opponent.ranking > strongestDefeatedOpponent.rank){
					strongestDefeatedOpponent = {
						id: opponent.id,
						username: opponent.username,
						rank : opponent.ranking,
						url : game.related.detail.split("games/")[1],
						outcome : (game.outcome == "Resignation" ? "a bloody" : "an intense")
					};
				}
			}
			else{
				opponent = game.players.black;
				//rankDifference += (game.black_player_rank - game.white_player_rank);

				if(game.black_lost && opponent.ranking > strongestDefeatedOpponent.rank){
					strongestDefeatedOpponent = {
						id: opponent.id,
						username: opponent.username,
						rank : opponent.ranking,
						url : game.related.detail.split("games/")[1],
						outcome : (game.outcome == "Resignation" ? "a bloody" : "an intense")
					};
				}
			}

			if(!opponents[opponent.id]){
				opponents[opponent.id] = 1;
			}
			else{
				opponents[opponent.id]++;
			}

			if(opponents[opponent.id] > mostPlayed.games) mostPlayed = { id: opponent.id, username: opponent.username, rank : gotStatsApp.utilities.convertRankToDisplay(opponent.ranking), games : opponents[opponent.id]};
			if(opponent.ranking > strongestOpp.rank) strongestOpp = { id: opponent.id, username: opponent.username, rank : opponent.ranking};
			if(opponent.ranking < weakestOpp.rank) weakestOpp = { id: opponent.id, username: opponent.username, rank : opponent.ranking};
		}

		for (var k in opponents) {
			if (opponents.hasOwnProperty(k)) {
			   numberOpponents++;
			}
		}

		strongestDefeatedOpponent.rank = gotStatsApp.utilities.convertRankToDisplay(strongestDefeatedOpponent.rank);

		$scope.statistics.totalOpponents = numberOpponents;

		$scope.statistics.chartData.opponents = {
			strongest									: strongestOpp,
			weakest										: weakestOpp,
			mostPlayed								: mostPlayed,
			strongestDefeatedOpponent : strongestDefeatedOpponent,
			averageGamePerOpponent		: ($scope.statistics.analyzingGames.length / numberOpponents),
			//averageRankDifference			: (rankDifference/$scope.statistics.analyzingGames.length)
		}
	}

	var generateMiscData = function(){
		var game;
		var longestStreak = 0, currentStreak = 0,
				gamesOnMostActiveDay = 0, gamesOnCurrentDay = 0;

		var mostActiveDay, currentDay = new Date();
		currentDay.setHours(0,0,0,0);

		for(var i=0;i<$scope.statistics.analyzingGames.length; i++){
			game = $scope.statistics.analyzingGames[i];

			// Winning streak
			if( (game.players.black.id == $scope.statistics.player.id && game.white_lost)
				||(game.players.white.id == $scope.statistics.player.id && game.black_lost) ){

				currentStreak++;
				if(currentStreak > longestStreak){
					longestStreak = currentStreak;
				}
			}
			else{
				currentStreak = 0;
			}


			var gameDay = new Date(game.ended);
			gameDay.setHours(0,0,0,0);
			// Day by day
			if(gotStatsApp.utilities.compareDays(currentDay, gameDay) != 0){
				currentDay = gameDay;
				gamesOnCurrentDay = 1;
			}
			else{
				gamesOnCurrentDay++;
			}

			if(gamesOnCurrentDay > gamesOnMostActiveDay){
				mostActiveDay = currentDay;
				gamesOnMostActiveDay = gamesOnCurrentDay;
			}
		}

		var firstGameDate = new Date($scope.statistics.analyzingGames[$scope.statistics.analyzingGames.length-1].started);
		var memberSince = new Date($scope.statistics.player.registration_date);

		if(firstGameDate < memberSince) memberSince = firstGameDate;

		memberSince.setHours(0,0,0,0);
		var daysSinceRegistered = gotStatsApp.utilities.compareDays(new Date(), memberSince);
		var gamesPerDay = $scope.statistics.analyzingGames.length/parseFloat(daysSinceRegistered);

		$scope.statistics.misc = {
			memberSince : memberSince,
			gamesPerDay : gamesPerDay,
			longestStreak : longestStreak,
			mostActiveDay : mostActiveDay,
			gamesOnMostActiveDay: gamesOnMostActiveDay,
			globalRankMsg : "Calculating..."
		}

		generateRecentActivityChart();
		if($rootScope.player.isRanked){
			calculateGlobalRanking();
		}
	}

	var generateRecentActivityChart = function(){
		var game;
		var today = new Date();
		today.setHours(0,0,0,0);

		var recentDays = [];
		var isRecentgame = true;

		for(var i=0;i<$scope.statistics.analyzingGames.length; i++){
			game = $scope.statistics.analyzingGames[i];

			if(isRecentgame){
				var gameDay = new Date(game.ended);
				gameDay.setHours(0,0,0,0);

				// console.log(today + " " + gameDay + " " + gotStatsApp.utilities.compareDays(today, gameDay));
				if(gotStatsApp.utilities.compareDays(today, gameDay) > 15){
					isRecentgame = false;
					var theDay;

					if(recentDays.length > 0){
						theDay = new Date(recentDays[recentDays.length-1].date)
					}
					else{
						theDay = new Date(today);
						recentDays.push({date: theDay, stringDate: $filter('date')(theDay, "d MMM"), wins: 0, losses: 0});
					}

					var lastDay = new Date(today.getTime() - 15* 86400000);
					var daysToAdd = gotStatsApp.utilities.compareDays(theDay, lastDay);

					for(var j=1;j < daysToAdd;j++){
						var tempDate = new Date(theDay.getTime() - j*86400000);

						recentDays.push({date: tempDate, stringDate: $filter('date')(tempDate, "d MMM"), wins: 0, losses: 0});
					}
				}

				else{
					var stringDate = $filter('date')(gameDay, "d MMM");

					if(recentDays.length == 0){
						var daysToAdd = gotStatsApp.utilities.compareDays(today, gameDay);
						for(var j=0;j < daysToAdd;j++){
							var tempDate = new Date(today.getTime() - j* 86400000);

							recentDays.push({date: tempDate, stringDate: $filter('date')(tempDate, "d MMM"), wins: 0, losses: 0});
						}
						recentDays.push({date: gameDay, stringDate: stringDate, wins: 0, losses: 0});
					}
					else if(recentDays[recentDays.length-1].stringDate != stringDate){
						var daysToAdd = gotStatsApp.utilities.compareDays(recentDays[recentDays.length-1].date, gameDay);
						for(var j=1;j < daysToAdd;j++){
							var tempDate = new Date(recentDays[recentDays.length-1].date.getTime() - 86400000);

							recentDays.push({date: tempDate, stringDate: $filter('date')(tempDate, "d MMM"), wins: 0, losses: 0});
						}
						recentDays.push({date: gameDay, stringDate: stringDate, wins: 0, losses: 0});
					}
				}
			}

			if(!isRecentgame) break;

			if( (game.players.black.id == $scope.statistics.player.id && game.white_lost)
				||(game.players.white.id == $scope.statistics.player.id && game.black_lost) ){
					recentDays[recentDays.length-1].wins++;
			}
			else{
				recentDays[recentDays.length-1].losses++;
			}
		}

		var rowsObject = [];
		for(var i=recentDays.length-1; i>=0;i--){
			rowsObject.push({ c: [
				{v: recentDays[i].stringDate},
				{v: recentDays[i].losses},
				{v: recentDays[i].wins}
			]});
		}

		$scope.statistics.chartData.recentActivity.data = {
			"cols" : [
				{id: "day", label: "Day", type: "string"},
				{id: "losses", label: "Losses", type: "number"},
				{id: "wins", label: "Wins", type: "number"}
			],
			"rows": rowsObject
		};
	}

	/*
	 * INITIALIZATION
	 */

	init();

}]);
