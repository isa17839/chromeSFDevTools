/**
 * @author Igor Savchenko
 * @description Popup's controller
 */
$(function(){
	"use strict";

	var apexClassesToCreateTraceFlags = [];
	chrome.storage.sync.get('classesToCreateTraceFlagsFor', function(data){
		apexClassesToCreateTraceFlags = data.classesToCreateTraceFlagsFor.split(',');
	});

	var apexClassesToTrack = [];
	var devDebugLevels;

	$sfApi.auth();

	document.getElementById('create-trace-flags').addEventListener('click', function(){	
		jQuery.when().then(function(){
			return $sfApi.getApexClasses(getApexClassesWhereClause());
		}).then(function(apexClassesResult){
			apexClassesToTrack = apexClassesResult.records.map(obj => obj.Id);
			return $sfApi.getTraceFlags(apexClassesToTrack);
		}).then(function(traceFlagsResponse){
			var traceFlagsIds = traceFlagsResponse.records.map(obj => obj.Id);
			return $sfApi.deleteTraceFlags(traceFlagsIds);
		}).then(function(){
			return $sfApi.getDebugLevels();
		}).then(function(debugLevelsResult){
			var noneDebugLevels = debugLevelsResult.records.filter(debugLevel => {
				return debugLevel.MasterLabel == 'none';
			});
			devDebugLevels = debugLevelsResult.records.filter(debugLevel => {
				return debugLevel.MasterLabel == 'dev';
			});
			return noneDebugLevels.length ? {id: noneDebugLevels[0].Id} : $sfApi.createDebugLevel('none');
		}).then(function(noneDebugLevel){
			return $sfApi.createTraceFlags(noneDebugLevel.id, apexClassesToTrack);
		}).then(function(createdTraceFlagsResponse){
			return devDebugLevels.length ? devDebugLevels[0] : $sfApi.createDebugLevel('dev', {apexCode: 'FINEST', system: 'DEBUG'});
		}).then(function(devDebugLevel){
			console.log('devDebugLevel: ' + devDebugLevel.id);
		});
	});

	function getApexClassesWhereClause() {
		var whereClausePieces = [];
		apexClassesToCreateTraceFlags.forEach(function(apexClass){
			whereClausePieces.push("(Name = '" + apexClass.split('.')[1] + "' AND NamespacePrefix = '" + apexClass.split('.')[0] + "')");
		});
		return whereClausePieces.join(' OR ');
	}

});