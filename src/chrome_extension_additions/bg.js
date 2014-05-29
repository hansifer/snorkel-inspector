chrome.browserAction.onClicked.addListener(function() {
	chrome.tabs.executeScript({
		file: 'ui_overlay.js'
	});
});
