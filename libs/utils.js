/**
 * @author Igor Savchenko
 * @description General Plugin's utilities
 */
window.$Utils = window.$Utils || (function(){
    "use strict";
    
    return {

        formatDateTimeToSf(d) {
            var dateString = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
            var timeString = 'T' + d.getHours() + ':00:00.000+0000';
            return dateString + timeString;
        },

        log(text) {
            $('#data').html($('#data').html() + '<div>' + text + '</div>');
        }        

    };
})();