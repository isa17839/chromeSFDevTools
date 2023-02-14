/**
 * @author Igor Savchenko
 * @description Options page
 */
$(function(){
	"use strict";

	chrome.storage.sync.get('classesToCreateTraceFlagsFor', function(data){
		document.getElementById('classes-to-create-trace-flags-for').value = data.classesToCreateTraceFlagsFor;
	});
	
	document.getElementById('save-storage').addEventListener('click', function(){	
		chrome.storage.sync.set({ classesToCreateTraceFlagsFor: document.getElementById('classes-to-create-trace-flags-for').value});

		console.log(document.getElementById('classes-to-create-trace-flags-for').value);
	});

});