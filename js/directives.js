angular.module('gotStatsDirectives', [])

.directive('opponentChart', function() {
	return {
		restrict: 'A',
		link: function(scope, elem, attrs) {
			scope.$watch('statistics.chartData.' + attrs.chartData, function (newData) {
				if(!!newData){
					$("#" + $(elem).attr("id") + " .bar_chart").html(
						// Weakest opponent's avatar
						'<a target="_blank" href="'+gotStatsApp.config.ogsUrl+'/user/view/'+newData.weakest.id+'/'+newData.weakest.username+'" data-toggle="tooltip" data-placement="top" title="'+newData.weakest.username+' ('+gotStatsApp.utilities.convertRankToDisplay(newData.weakest.rank)+')"><img src="'+gotStatsApp.config.ogsUrl+'/api/v1/players/'+newData.weakest.id+'/icon?size=32"></img></a>' +

						// Player's avatar
						'<a target="_blank" href="'+gotStatsApp.config.ogsUrl+'/user/view/'+scope.statistics.player.id+'/'+scope.statistics.player.username+'" data-toggle="tooltip" data-placement="top" title="'+scope.statistics.player.username+' ('+gotStatsApp.utilities.convertRankToDisplay(gotStatsApp.utilities.convertRatingToRank(scope.statistics.player.ratings.overall.rating))+')"><img src="'+gotStatsApp.config.ogsUrl+'/api/v1/players/'+scope.statistics.player.id+'/icon?size=32"></img></a>' +

						// Strongest opponent's avatar
						'<a target="_blank" href="'+gotStatsApp.config.ogsUrl+'/user/view/'+newData.strongest.id+'/'+newData.strongest.username+'" data-toggle="tooltip" data-placement="top" title="'+newData.strongest.username+' ('+gotStatsApp.utilities.convertRankToDisplay(newData.strongest.rank)+')"><img src="'+gotStatsApp.config.ogsUrl+'/api/v1/players/'+newData.strongest.id+'/icon?size=32"></img></a>'
					);

					// Realistically no one's below 25k on OGS
					var weakestBarRate = newData.weakest.rank - 5;
					var strongestBarRate = newData.strongest.rank - 5;
					var userBarRate = gotStatsApp.utilities.convertRatingToRank(scope.statistics.player.ratings.overall.rating) - 5;

					$("#" + $(elem).attr("id") + " .bar_chart a:first-child").css("left", (weakestBarRate/33 * 100) + "%");
					$("#" + $(elem).attr("id") + " .bar_chart a:nth-child(2)").css("left", (userBarRate/33 * 100) + "%");
					$("#" + $(elem).attr("id") + " .bar_chart a:nth-child(3)").css("left", (strongestBarRate/33 * 100) + "%");

					$("#" + $(elem).attr("id") + " .bar_chart a").tooltip();

					$("#" + $(elem).attr("id") + " .bar_legend li:first-child").css("margin-left", (weakestBarRate/33 * 100) + "%");
					$("#" + $(elem).attr("id") + " .bar_legend li:nth-child(2)").css("margin-left", ((strongestBarRate-weakestBarRate)/33 * 100) + "%");
				}
			});
		}
	}
})

.directive('rankRuler', function() {
	return {
		restrict: 'A',
		templateUrl: 'view/rank-ruler.html'
	};
});
