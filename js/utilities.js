gotStatsApp.init = function(){

}

/* Global Configs */
gotStatsApp.config = {
	ogsUrl : "http://online-go.com"
}

/* Utilities functions */
gotStatsApp.utilities = {
	convertRankToDisplay : function(rank){
		if(rank < 30)
			return (30 - rank) +  "k";
		else
			return (rank - 29) + "d";
	}
}
