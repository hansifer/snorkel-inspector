(function() {

	// customizations

	var iframe_id = 'snorkel_inspector',
		iframe_expand_height = '136px',
		iframe_animation_speed = 0.1,
		iframe_css = 'visibility: visible !important; display: block !important; position: fixed; width: 100%; top: 0; right: 0; z-index: 2147483647; background-color: hsl(0, 0%, 91%); -webkit-transition: height ' + iframe_animation_speed + 's ease-in, opacity ' + iframe_animation_speed + 's ease-in; transition: height ' + iframe_animation_speed + 's ease-in, opacity ' + iframe_animation_speed + 's ease-in; border-bottom: 2px solid hsl(0, 0%, 68%); box-shadow: hsl(0, 0%, 67%) -1px -4px 10px 5px; overflow-y: hidden; height: 0px; opacity: 0;',
		iframe_baseUrl = '//hansifer.github.io/snorkel-inspector/src/'; // the base url of resources referenced by iframe

	iframe_baseUrl = normalizeUrl(iframe_baseUrl);

	var content = '<!DOCTYPE html><!--[if lt IE 7]> <html class="no-js lt-ie9 lt-ie8 lt-ie7"> <![endif]--><!--[if IE 7]> <html class="no-js lt-ie9 lt-ie8"> <![endif]--><!--[if IE 8]> <html class="no-js lt-ie9"> <![endif]--><!--[if gt IE 8]><!--> <html class="no-js"> <!--<![endif]--> <head> <meta charset="utf-8"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <title>snorkel inspector</title> <meta name="viewport" content="width=device-width, initial-scale=1">  <link rel="stylesheet" href="' + iframe_baseUrl + 'css/normalize.css"> <link rel="stylesheet" href="' + iframe_baseUrl + 'css/main.css"> <link rel="stylesheet" href="' + iframe_baseUrl + 'css_overlay/bootstrap.mod.css"> <link rel="stylesheet" href="' + iframe_baseUrl + 'css_overlay/snorkelInspector.css"> <link rel="stylesheet" href="' + normalizeUrl('http://netdna.bootstrapcdn.com/font-awesome/4.1.0/css/font-awesome.min.css') + '"> <script src="' + iframe_baseUrl + 'js/modernizr-2.6.2.min.js"></script> <style id="syntax"></style> </head> <body> <!--[if lt IE 9]> <p class="browsehappy">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> to improve your experience.</p> <![endif]--> <header> <div class="page-header"> <span> <a id="logo" href="http://hansifer.github.io/snorkel.js/" target="_blank"><span id="logo-image"></span><span id="logo-text">snorkel.Js</span></a> <span class="header-origin">&nbsp;&nbsp;<span id="contents-for">contents&nbsp;for&nbsp;</span><span id="origin"></span></span> </span> <span class="control-search"> <span class="dropdown"> <a data-toggle="dropdown" href="#"><b class="caret"></b></a> <ul class="dropdown-menu" role="menu"> <li id="menuitem-filter-by-key" class="active" role="presentation"><a role="menuitem" tabindex="-1">filter by key</a></li> <li id="menuitem-highlight-by-key" role="presentation"><a role="menuitem" tabindex="-1">highlight by key</a></li> </ul> </span> <input id="input-search" type="text" autofocus="autofocus" spellcheck="false" /> </span> <span id="close-overlay" role="button"> <i class="fa fa-times"></i> </span> </div> <div class="page-subheader"> <span id="dropdown-label-namespace" style="margin-right:5px;">Namespace:</span> <span id="select-namespace" class="dropdown"> <a data-toggle="dropdown" href="#"> <span> loading... </span> <b class="caret"></b> </a> <ul class="dropdown-menu" role="menu" aria-labelledby="dropdown-label-namespace"></ul> </span> <span id="remove-namespace" style="display:none;" class="fa fa-times"></span> <span id="summary"></span> </div> <div class="controls-crud"> <span id="wrapper-input-key"><span>*</span><input type="text" id="input-key" placeholder="key" spellcheck="false" /></span> <input type="text" id="input-val" placeholder="value" spellcheck="false" /> <button type="button" id="btn-add" class="btn btn-default btn-xs">Add</button> <button type="button" id="btn-clear" class="btn btn-default btn-xs">Clear</button> <div class="dropdown" style="position:static;"> <span id="btn-options" role="button" data-toggle="dropdown"><span class="fa fa-cog"></span></span> <ul class="dropdown-menu" role="menu" aria-labelledby="btn-options"> <li id="menuitem-options-indent" role="presentation"><a role="menuitem" tabindex="-1" href="#">Pretty print objects and arrays<!-- Indent composites --></a></li> </ul> </div> </div> </header> <div id="snorkel-data-box"> <div class="no-data">loading...</div> </div> <!-- something to tab into before address bar --> <div tabindex="0"></div> <div id="modal-namespace" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="modal-namespace-title" aria-hidden="true"> <div class="modal-dialog modal-sm"> <div class="modal-content"> <div class="modal-header"> <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button> <h4 id="modal-namespace-title" class="modal-title">New namespace</h4> </div> <div class="modal-body"> <input type="text" id="input-namespace-new" spellcheck="false" /> </div> <div class="modal-footer"> <button type="button" class="btn btn-default btn-sm" data-dismiss="modal">Cancel</button> <button type="button" id="btn-accept-namespace" class="btn btn-primary btn-sm">OK</button> </div> </div> </div> </div> <div id="modal-confirm" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="modal-confirm-title" aria-hidden="true"> <div class="modal-dialog modal-sm"> <div class="modal-content"> <div class="modal-header"> <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button> <h4 id="modal-confirm-title" class="modal-title">Sure about that?</h4> </div> <div class="modal-body"></div> <div class="modal-footer"> <button type="button" class="btn btn-default btn-sm" data-dismiss="modal">Nope</button> <button type="button" id="btn-accept-confirm" class="btn btn-primary btn-sm">Yep</button> </div> </div> </div> </div> <div id="modal-error" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="modal-error-title" aria-hidden="true"> <div class="modal-dialog modal-sm"> <div class="modal-content"> <div class="modal-header"> <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button> <h4 id="modal-error-title" class="modal-title">There&#39;s a problem</h4> </div> <div class="modal-body"></div> <div class="modal-footer"> <button type="button" id="btn-accept-error" class="btn btn-primary btn-sm" data-dismiss="modal">Alrighty</button> </div> </div> </div> </div> <div id="modal-snorkel-update-error" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="modal-snorkel-update-error-title" aria-hidden="true"> <div class="modal-dialog modal-sm"> <div class="modal-content"> <div class="modal-header"> <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button> <h4 id="modal-snorkel-update-error-title" class="modal-title">There&#39;s a problem</h4> </div> <div class="modal-body"></div> <div class="modal-footer"> <button type="button" class="btn btn-default btn-sm" data-dismiss="modal">Discard</button> <button type="button" id="btn-edit-snorkel-update-error" class="btn btn-primary btn-sm" data-dismiss="modal">Edit</button> </div> </div> </div> </div> <div id="modal-key-exists" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="modal-key-exists-title" aria-hidden="true"> <div class="modal-dialog modal-sm"> <div class="modal-content"> <div class="modal-header"> <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button> <h4 id="modal-key-exists-title" class="modal-title">Ummm...</h4> </div> <div class="modal-body">key<span class="label-heavy"></span>already exists </div> <div class="modal-footer"> <button type="button" class="btn btn-default btn-sm" data-dismiss="modal">Cancel</button> <button type="button" id="btn-suggest-key-exists" class="btn btn-primary btn-sm" data-dismiss="modal">Suggest</button> <button type="button" id="btn-overwrite-key-exists" class="btn btn-primary btn-sm" data-dismiss="modal">Overwrite</button> </div> </div> </div> </div> <script src="' + iframe_baseUrl + 'js/polyfill_addEventListener.js"></script> <script src="' + iframe_baseUrl + 'js/jquery.custom.js"></script> <script src="' + iframe_baseUrl + 'js/jquery.scrollIntoView.mod.js"></script> <script src="' + iframe_baseUrl + 'js/plugins.js"></script> <script src="' + iframe_baseUrl + 'js/bootstrap.custom.js"></script> <script src="' + iframe_baseUrl + 'js/underscore.js"></script> <script src="' + iframe_baseUrl + 'js/dab.js"></script> <script src="' + iframe_baseUrl + 'js/domDab.js"></script> <script src="' + iframe_baseUrl + 'js/uuid.js"></script> <script src="' + iframe_baseUrl + 'js/browserDab.js"></script> <script src="' + iframe_baseUrl + 'js/originEvents.dep.js"></script> <script src="' + iframe_baseUrl + 'js/snorkel.dep.js"></script> <script src="' + iframe_baseUrl + 'js/snorkelInspector.js"></script> </body></html>';

	var iframe = top.document.getElementById(iframe_id),
		initialHeightSet = false;

	if (iframe) { // pane is expanded
		collapseIframe();
	} else { // pane is collapsed
		// console.log('creating snorkel inspector iframe');

		iframe = document.createElement('iframe');
		iframe.setAttribute('id', iframe_id);
		iframe.setAttribute('frameBorder', '0');
		iframe.setAttribute('allowTransparency', 'true');
		iframe.cssText = iframe.style.cssText = iframe_css;

		largestFrame().body.appendChild(iframe);

		fireOnLoad(iframe, function(readyState) {
			var closeOverlay = iframe.contentWindow.document.getElementById('close-overlay');

			if (closeOverlay) {
				if (closeOverlay.addEventListener) {
					closeOverlay.addEventListener('click', collapseIframe, false);
				} else if (closeOverlay.attachEvent) {
					closeOverlay.attachEvent('onclick', function() {
						collapseIframe.call(closeOverlay);
					});
				}
			}

			iframe.contentWindow.setIframeHeight = setIframeHeight;
			iframe.contentWindow.resetIframeHeight = resetIframeHeight;

			// add resetIframeHeight() coverage in case of isolated world (eg, chrome extension)

			iframe.contentWindow.addEventListener('message', function(event) {
				if (event.source !== iframe.contentWindow) {
					return;
				}

				if (event.data.type && (event.data.type === 'resetIframeHeight')) {
					// console.log('reseting iframe height');
					resetIframeHeight(event.data.dataBoxHeight);
				}
			}, false);

			var interval = setInterval(function() {
				// console.log(readyState);

				if (initialHeightSet && readyState === 'complete') {
					refreshIframeHeight();
					clearInterval(interval);
					interval = 0;
				}
			}, 17);

			setTimeout(function() {
				clearInterval(interval);
				interval = 0;
			}, 10000);
		});

		// have to pop every time we append since removeChild on iFrame clears its contents
		popIFrame(iframe, content); // TODO: allow pop from url (script and/or html)

		setTimeout(function() {
			setIframeHeight(iframe_expand_height);
			initialHeightSet = true;
		}, 17);
	}

	function normalizeUrl(iUrl) {
		if (window.location.protocol === 'file:') {
			if (/^\/\//.test(iUrl)) {
				return 'http:' + iUrl;
			} else {
				return iUrl;
			}
		}

		return iUrl.trim().replace(/^\w+?\:\/\//, '//');
	}

	function refreshIframeHeight() {
		if (window.refreshIframeHeight) {
			window.refreshIframeHeight();
		} else if (window.postMessage) {
			// console.log('posting refreshIframeHeight');
			iframe.contentWindow.postMessage({
				type: 'refreshIframeHeight'
			}, '*');
		}
	}

	function resetIframeHeight(iSnorkelDataBoxHeight) {
		setIframeHeight(iSnorkelDataBoxHeight + 113 + 'px');
	}

	function fireOnLoad(iIframe, iFct) {
		iIframe.onload = iIframe.onreadystatechange = function() {
			var d = iIframe.contentDocument || iIframe.contentWindow.document;

			// console.log(d.readyState);

			if (!d.readyState || /loaded|complete/.test(d.readyState)) {
				iIframe.onload = iIframe.onreadystatechange = null;

				iFct(d.readyState);
			}
		};
	}

	// hide and remove iframe from dom

	function collapseIframe() {
		setIframeHeight(0);

		// can't count on transitionend event to be supported, so defer iframe remove by a reasonable delay.
		setTimeout(function() {
			if (iframe.parentNode) {
				iframe.parentNode.removeChild(iframe);
				// console.log('removed iframe');
			}
		}, iframe_animation_speed * 1000 + 100);
	}

	function setIframeHeight(iHeight) {
		iframe.style.height = (typeof iHeight === 'number' ? iHeight + 'px' : iHeight);

		if (parseInt(iHeight, 10) > 0) {
			iframe.style.opacity = '1';
		} else {
			iframe.style.opacity = '0';
		}
	}

	function popIFrame(iIframe, iContent) {
		var doc = iIframe.document;

		if (iIframe.contentDocument) {
			doc = iIframe.contentDocument;
		} else if (iIframe.contentWindow) {
			doc = iIframe.contentWindow.document;
		}

		doc.open();
		doc.writeln(iContent);
		doc.close();
	}

	function largestFrame() {
		var frames;

		if (top.document.getElementsByTagName("frameset").length && (frames = top.document.getElementsByTagName("frame")).length) {
			var r = frames[0];

			for (var i = 0; i < frames.length; i++) {
				try {
					if (frames[i].height * frames[i].width > r.height * r.width) {
						r = frames[i];
					}
				} catch (ex) {}
			}

			return r.contentDocument || r;
		}

		return top.document;
	}

})();
