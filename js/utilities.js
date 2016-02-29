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

	compareDays : function(day1, day2){
		var comparisionDate = new Date(Date.parse(day1) - Date.parse(day2));
		console.log(day1 + " " + day2 + " " + (comparisionDate.getDate() - 1));
		return comparisionDate.getDate() - 1;
	}
}
