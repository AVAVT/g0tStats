var gotStatsControlers = angular.module('gotStatsControlers', ["googlechart"]);

gotStatsControlers.controller('SidebarController',  ['$scope','$location',function($scope, $location) {
	$scope.scrollTo = function(hash){
    $('html,body').animate({scrollTop: $("#"+hash).offset().top},'fast');
		console.log('fuck you motherfucker');
	}

	$scope.getUserStatistic = function(){

		if(!$scope.searchForm.$invalid){
			$location.path("/user/" + $scope.searchId);

			$scope.searchId = "";
			$scope.searchForm.$setPristine();
		}
	}
}]);

gotStatsControlers.controller('UserStatisticsController',  ['$scope', '$rootScope', '$routeParams', '$http', function($scope, $rootScope, $routeParams, $http) {
	$('html,body').animate({scrollTop: 0},'fast');

	var that = this;
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
				pieSliceTextStyle : {color: "#3366cc"},
				legend : { position: "bottom", textStyle: {color: "#f8f8ff", fontName: "Helvetica Neue", fontSize: 14}},
				chartArea : {top: 10}
			}
		},
		colorChart : {
			type : "PieChart",
			options: {
				backgroundColor : "transparent",
				legend : { position: "bottom", textStyle: {color: "#f8f8ff", fontName: "Helvetica Neue", fontSize: 14}},
				chartArea : {top: 10}
			}
		},
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
			totalRankedGames : jQuery.extend(true, {}, chartConfigs.blackWhiteChart),
			totalRankedWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),
			blackRankedWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),
			whiteRankedWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),
			totalUnrankedGames : jQuery.extend(true, {}, chartConfigs.blackWhiteChart),
			totalUnrankedWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),
			blackUnrankedWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),
			whiteUnrankedWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),
			allBoardSizes : jQuery.extend(true, {}, chartConfigs.colorChart),
			nineteenWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),
			thirteenWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),
			nineWinRate : jQuery.extend(true, {}, chartConfigs.colorChart),
			otherSizesWinRate : jQuery.extend(true, {}, chartConfigs.colorChart)
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
	});

	var getAllGames = function(callBack, url){
		if(url === undefined) url = "https://online-go.com/api/v1/players/" +$routeParams.userId+ "/games/?ended__isnull=false&annulled=false&ordering=-ended";

		$http.get(url).then(
			function(successData){
				if($scope.destroyed) return;

				$scope.connectionError = false;
				$scope.retryNumber = 0;
				$scope.loadingPage++;
				$scope.statistics.allGames = $scope.statistics.allGames.concat(successData.data.results);
				$scope.totalPages = Math.ceil(successData.data.count/25);

				if(successData.data.next != null)
					getAllGames(callBack, successData.data.next.replace("http://", "https://"));
				else
					callBack();
			},
			function(errorData){
				if($scope.destroyed) return;

				// If you can't get what this part mean, it means I don't know shit about Angularjs
				$scope.connectionError = true;
				$scope.connectionErrorCode = errorData.status;
				$scope.retryNumber+=1;

				if($scope.retryNumber < 5){
						setTimeout(function(){getAllGames(callBack, url);}, $scope.retryNumber*$scope.retryNumber*1000);
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
						if(successData.data.results[i].id == $rootScope.player.id){
							$scope.statistics.misc.globalRankMsg = "#" + globalSiteRankingData.rank + " amongs all " + $scope.statistics.misc.totalPlayers + " ranked players."
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
		generateAllGamesData();
		generateRankedGamesData();
		generateUnrankedGamesData();
		generateBoardSizesData();
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

		// console.log($scope.statistics);
	}

	/*
	 *	ALL GAMES STATISTICS
	 */
	var generateAllGamesData = function(){
		var blackGames = 0, whiteGames = 0,
				blackLosses = 0, whiteLosses = 0;
		var game;

		for(var i=0;i<$scope.statistics.allGames.length; i++){
			game = $scope.statistics.allGames[i];
			if(game.players.black.id == $rootScope.player.id){
				blackGames++;
				if(game.black_lost) blackLosses++;
			}
			else{
				whiteGames++;
				if(game.white_lost) whiteLosses++;
			}
		}

		$scope.statistics.totalGames = $scope.statistics.allGames.length;

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
					{id: "c", label: "Result", type: "string"},
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
					{id: "c", label: "Result", type: "string"},
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
					{id: "c", label: "Result", type: "string"},
					{id: "g", label: "Games", type: "number"},
				],
				"rows": [
					{c: [ {v: "Losses"}, {v: whiteLosses} ]},
					{c: [ {v: "Wins"}, {v: (whiteGames - whiteLosses)} ]},
				]
			};
		}
	}

	/*
	 *	RANKED GAMES STATISTICS
	 */
	var generateRankedGamesData = function(){
		var rankedBlack = 0, rankedWhite = 0,
				rankedBlackLosses = 0, rankedWhiteLosses = 0;
		var game;

		for(var i=0;i<$scope.statistics.allGames.length; i++){
			game = $scope.statistics.allGames[i];
			if(game.ranked){
				if(game.players.black.id == $rootScope.player.id){
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

		for(var i=0;i<$scope.statistics.allGames.length; i++){
			game = $scope.statistics.allGames[i];
			if(!game.ranked){
				if(game.players.black.id == $rootScope.player.id){
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
	 *	BOARD SIZES STATISTICS
	 */
	 var generateBoardSizesData = function(){
 		var nineteenGames = 0, thirteenGames = 0, nineGames = 0, otherGames = 0,
 				nineteenLosses = 0, thirteenLosses = 0, nineLosses = 0, otherLosses = 0;
 		var game;

 		for(var i=0;i<$scope.statistics.allGames.length; i++){
 			game = $scope.statistics.allGames[i];
			if(game.width == 19 && game.height == 19){
				nineteenGames++;
				if( (game.players.black.id == $rootScope.player.id && game.black_lost)
						|| (game.players.white.id == $rootScope.player.id && game.white_lost)){
					nineteenLosses++;
				}
			}
 			else if(game.width == 13 && game.height == 13){
				thirteenGames++;
				if( (game.players.black.id == $rootScope.player.id && game.black_lost)
						|| (game.players.white.id == $rootScope.player.id && game.white_lost)){
					thirteenLosses++;
				}
			}
			else if(game.width == 9 && game.height == 9){
				nineGames++;
				if( (game.players.black.id == $rootScope.player.id && game.black_lost)
						|| (game.players.white.id == $rootScope.player.id && game.white_lost)){
					nineLosses++;
				}
			}
			else{
				otherGames++;
				if( (game.players.black.id == $rootScope.player.id && game.black_lost)
						|| (game.players.white.id == $rootScope.player.id && game.white_lost)){
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
	 *	OPPONENTS STATISTICS
	 */
	var generateOpponentsData = function(){
		var game, opponent;
		var opponents = [], numberOpponents = 0;
		var weakestOpp = {rank: 70}, strongestOpp = { rank : 0}, mostPlayed = { games : 0}, strongestDefeatedOpponent = { rank : 0};

		for(var i=0;i<$scope.statistics.allGames.length; i++){
			game = $scope.statistics.allGames[i];

			if(game.players.black.id == $rootScope.player.id){
				opponent = game.players.white;

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
			strongest				: strongestOpp,
			weakest					: weakestOpp,
			mostPlayed			: mostPlayed,
			strongestDefeatedOpponent : strongestDefeatedOpponent,
			averageGamePerOpponent	: ($scope.statistics.allGames.length / numberOpponents)
		}
	}

	var generateMiscData = function(){
		var longestStreak = 0, currentStreak = 0,
				gamesOnMostActiveDay = 0, gamesOnCurrentDay = 0;
		var mostActiveDay, currentDay = new Date();
		var game;

		currentDay.setHours(0,0,0,0);

		for(var i=0;i<$scope.statistics.allGames.length; i++){
			game = $scope.statistics.allGames[i];

			// Winning streak
			if( (game.players.black.id == $rootScope.player.id && game.white_lost)
				||(game.players.white.id == $rootScope.player.id && game.black_lost) ){
				currentStreak++;
				if(currentStreak > longestStreak){
					longestStreak = currentStreak;
				}
			}
			else{
				currentStreak = 0;
			}

			// Day by day
			var day = new Date(game.ended);
			day.setHours(0,0,0,0);
			var hackDate = new Date(Date.parse(currentDay) - Date.parse(day));

			if(hackDate.getDate() - 1 != 0){
				// console.log("different day "+day+" "+ currentDay);
				currentDay = day;
				gamesOnCurrentDay = 1;
			}
			else{
				gamesOnCurrentDay++;
				// console.log("same day "+day+" "+ currentDay + "_" + gamesOnCurrentDay);
			}

			if(gamesOnCurrentDay > gamesOnMostActiveDay){
				mostActiveDay = currentDay;
				gamesOnMostActiveDay = gamesOnCurrentDay;
			}
		}

		$scope.statistics.misc = {
			longestStreak : longestStreak,
			mostActiveDay : mostActiveDay,
			gamesOnMostActiveDay: gamesOnMostActiveDay,
			globalRankMsg : "Calculating..."
		}

		if($rootScope.player.isRanked){
			calculateGlobalRanking();
		}
	}

	/*
	 * INITIALIZATION
	 */

	$http.get("https://online-go.com/api/v1/players/" + $routeParams.userId).success(function(data){
		$scope.statistics.player = data;
		$rootScope.player = {username : data.username, rank : gotStatsApp.utilities.convertRankToDisplay(data.ranking), id: data.id, isRanked : (data.provisional_games_left < 1)};
	});

	getAllGames(onGameFetchingComplete);

}]);
