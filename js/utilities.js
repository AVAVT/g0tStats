gotStatsApp.init = function(){
}

/* Global Configs */
gotStatsApp.config = {
	ogsUrl : "http://online-go.com",
	ogsResultPageSize: 25
}

/* Utilities functions */
gotStatsApp.utilities = {
	convertRankToDisplay : function(rank){
		if(rank < 30)
			return (30 - rank) +  "k";
		else
			return (rank - 29) + "d";
	},

	convertRatingToRank : function(rating){
		var rank = Math.log(rating / 850.0) / 0.032

		rank = Math.floor(rank);

		return rank;
	},

	compareDays : function(day1, day2){
		/* Copa pasta I don't even know if there's any bug here */

		// Copy date parts of the timestamps, discarding the time parts.
		var two = new Date(day1.getFullYear(), day1.getMonth(), day1.getDate());
		var one = new Date(day2.getFullYear(), day2.getMonth(), day2.getDate());

    // Do the math.
    var millisecondsPerDay = 1000 * 60 * 60 * 24;
    var millisBetween = two.getTime() - one.getTime();
    var days = millisBetween / millisecondsPerDay;

    // Round down.
    return two > one ? Math.floor(days) : Math.ceil(days);
	},

	validateDate : function(d){
		if ( Object.prototype.toString.call(d) === "[object Date]" ) {
		  if ( isNaN( d.getTime() ) ) {
				return false;
		  }
		  else {
		    return true;
		  }
		}
		else {
		  return false;
		}
	}
}
