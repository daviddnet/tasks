"use strict";

var binnacle = binnacle || {};

binnacle.utils = {
	htmlEscape : function(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            //.replace(/\//g, '&#x2F;');
    },
    htmlUnescape : function(value) {
        return String(value)
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')     
    },
    
    convertDate: function (inputFormat, showHour, ignoreUTC) {
        function pad(s) { return (s < 10) ? '0' + s : s; }

        function getHour(date) {
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            minutes = minutes < 10 ? '0' + minutes : minutes;
            var strTime = hours + ':' + minutes + ' ' + ampm;
            return strTime;
        }

        var newFormat = inputFormat;
        if (inputFormat && ignoreUTC) {
            newFormat =  inputFormat.substring(0,10).replace(/-/g,'/');
        }        

        var d = new Date(newFormat);
        var output = [pad(d.getDate()), pad(d.getMonth() + 1), d.getFullYear()].join('/');
        if (showHour) {
            output += " " + getHour(new Date(inputFormat));
        }

        return output;
    },
     
}

