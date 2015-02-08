(function() {

	var moment = (typeof require !== "undefined" && require !== null) && !require.amd ? require("moment") : this.moment;

  var weekStartMonday = false;
  function _getDay(date) {
    var day = date.getDay();
    if (weekStartMonday) {
      if (day == 0) return 6;
      else return day-1;
    } else {
      return day;
    }
  }

  moment.weekStartOnMonday = function(flag) {
  	if (flag !== undefined && flag !== null) {
  		weekStartMonday = (flag == true);
  	}
		return weekStartMonday;
  }

	moment.fn.firstDayOfWeek = function(date){
		var date = date || this._d || new Date(); 
    var dd = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    dd.setDate(date.getDate() - _getDay(date));
		return moment(dd);
	}

	moment.fn.firstDayOfMonth = function(date){
		var date = date || this._d || new Date(); 
    var dd = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    dd.setDate(1);
    return moment(dd);
	}

	if ((typeof module !== "undefined" && module !== null ? module.exports : void 0) != null) {
		module.exports = moment;
	}

}).call(this);