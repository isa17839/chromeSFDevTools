/**
 * @author Igor Savchenko
 * @description Salesforce Api calls
 */
window.$sfApi = window.$sfApi || (function(){
    "use strict";
    
    var currentUrl;
    var baseUrl;
    var sid;

	var restUrlToolingTraceFlag = 'tooling/sobjects/TraceFlag';
	var restUrlSoql = 'query';
	var restUrlQuery = 'tooling/query';
    var restUrlToolingCompositeTraceFlag = 'tooling/composite/sobjects';
    var restUrlDebugLevel = 'tooling/sobjects/DebugLevel';

    function sendRequest(restUrl, method, options) {
        console.log('request to: ' + baseUrl + '/services/data/v52.0/' + restUrl);
        var deferred = $.Deferred();

        if (options == undefined) {
            options = {};
        }

        var defaultHeaders = {
            'Authorization': 'Bearer ' + sid, 
            'Content-Type': 'application/json'
        };
        var successCallback = function(result) {
            if (options.callback) {
                options.callback(result)
            }
            console.log('result', result); 
            deferred.resolve(result);
        }
        var errorCallback = function(XMLHttpRequest, textStatus, errorThrown) {
            $Utils.log('Request Error: ' + errorThrown);
            console.log('REQUEST ERROR (request, status, error)', XMLHttpRequest, textStatus, errorThrown);
            if (XMLHttpRequest.responseJSON && XMLHttpRequest.responseJSON[0] && XMLHttpRequest.responseJSON[0].message) {
                $Utils.log('Error message: ' + XMLHttpRequest.responseJSON[0].message + '<div>----------------</div>');
            }
            deferred.reject(errorThrown);
        }

        $.ajax({
            url: baseUrl + '/services/data/v52.0/' + restUrl,
            headers: options.headers ? options.headers : defaultHeaders,
            method: method,
            dataType: 'json',
            data: options.data ? options.data : {},
            success: successCallback,
            error: errorCallback
        });

        return deferred.promise();
    }

    return {
        
        auth() {
            // set baseUrl and current url
            chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
                currentUrl = tabs[0].url;
                baseUrl = currentUrl.split('/')[0] + '//' + currentUrl.split('/')[2];
            });

            // get SID
            chrome.cookies.getAll({'name': 'sid'}, function (cookies){
                if (!cookies || !cookies.length || !cookies[0].value) return;
                
                cookies.forEach(function(cookie){
                    if (currentUrl.includes(cookie.domain)) {
                        sendRequest(restUrlToolingTraceFlag, 'GET', {
                            headers: {'Authorization': 'Bearer ' + cookie.value}, 
                            callback: function(){
                                sid = cookie.value;
                                chrome.storage.sync.set({sid: sid}, function(){
                                    $('#sid').html(sid);
                                });
                            }
                        });
                    }
                });
            });
        },

        getDebugLevels() {
            return sendRequest(restUrlQuery, 'GET', {data: {q: 'SELECT Id, MasterLabel FROM DebugLevel'}});
        },

        getApexClasses(whereClause) {
            var query = 'SELECT Id, Name, NamespacePrefix FROM ApexClass WHERE ' + whereClause;
			return sendRequest(restUrlSoql, 'GET', {data: {q: query}});
        },

        getTraceFlags(apexClassesToTrack) {
            var apexClassesStrings = apexClassesToTrack.map(function(apexClass){
                return "'" + apexClass + "'";
            });
            
            return sendRequest(restUrlQuery, 'GET', {data: {q: 'SELECT Id, TracedEntityId FROM TraceFlag WHERE TracedEntityId IN (' + apexClassesStrings.join(',') + ')'}});
        },

        deleteTraceFlags(ids) {
            return Promise.all(
                ids.map(function(id){
                    return sendRequest(restUrlToolingTraceFlag + '/' + id, 'DELETE');
                })
            );
        },

        createTraceFlags(debugLevelId, traceEntityIds) {
            var today = new Date();
            today.setHours(today.getHours() - 3);

            var tomorrow = new Date();
            tomorrow.setDate(new Date().getDate() + 1);
            tomorrow.setHours(tomorrow.getHours() - 3);

            return Promise.all(
                traceEntityIds.map(function(traceEntityId){
                    return sendRequest(
                        restUrlToolingTraceFlag, 
                        'POST', 
                        {
                            data: JSON.stringify({
                                DebugLevelId: debugLevelId,
                                StartDate: $Utils.formatDateTimeToSf(today),
                                ExpirationDate: $Utils.formatDateTimeToSf(tomorrow),
                                TracedEntityId: traceEntityId,
                                LogType: 'CLASS_TRACING'
                            }),
                            callback: function(result){
                                $Utils.log('Created trace flag: ' + result.id);
                        }
                    });
                })                
            );
        },

        createDebugLevel(name, options) {
            if (options == undefined) {
                options = {};
            }
    
            return sendRequest(
                restUrlDebugLevel, 
                'POST', 
                {
                    data: JSON.stringify({
                        DeveloperName: name,
                        MasterLabel: name,
                        ApexCode: options.apexCode ? options.apexCode : 'NONE',
                        ApexProfiling: 'NONE',
                        Callout: 'NONE',
                        Database: 'NONE',
                        System: options.system ? options.system : 'NONE',
                        Validation: 'NONE',
                        Visualforce: 'NONE',
                        Workflow: 'NONE',
                        Wave: 'NONE',
                        Nba: 'NONE',
                        Language: 'en_US'
                    }),
                    callback: function(result){
                        $Utils.log('Created debug level ' + name + ': ' + result.id);
                    }
                }
            );
        }

    };
})();