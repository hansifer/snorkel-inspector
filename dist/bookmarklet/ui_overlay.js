// snorkel-inspector 1.0.0
// https://github.com/hansifer/snorkel-inspector
// (c) 2014 Hans Meyer; Licensed MIT

!function(){function a(a){return"file:"===window.location.protocol?/^\/\//.test(a)?"http:"+a:a:a.trim().replace(/^\w+?\:\/\//,"//")}function b(){window.refreshIframeHeight?window.refreshIframeHeight():window.postMessage&&o.contentWindow.postMessage({type:"refreshIframeHeight"},"*")}function c(a){f(a+113+"px")}function d(a,b){a.onload=a.onreadystatechange=function(){var c=a.contentDocument||a.contentWindow.document;(!c.readyState||/loaded|complete/.test(c.readyState))&&(a.onload=a.onreadystatechange=null,b(c.readyState))}}function e(){f(0),setTimeout(function(){o.parentNode&&o.parentNode.removeChild(o)},1e3*k+100)}function f(a){o.style.height="number"==typeof a?a+"px":a,o.style.opacity=parseInt(a,10)>0?"1":"0"}function g(a,b){var c=a.document;a.contentDocument?c=a.contentDocument:a.contentWindow&&(c=a.contentWindow.document),c.open(),c.writeln(b),c.close()}function h(){var a;if(top.document.getElementsByTagName("frameset").length&&(a=top.document.getElementsByTagName("frame")).length){for(var b=a[0],c=0;c<a.length;c++)try{a[c].height*a[c].width>b.height*b.width&&(b=a[c])}catch(d){}return b.contentDocument||b}return top.document}var i="snorkel_inspector",j="136px",k=.1,l="visibility: visible !important; display: block !important; position: fixed; width: 100%; top: 0; right: 0; z-index: 2147483647; background-color: hsl(0, 0%, 91%); -webkit-transition: height "+k+"s ease-in, opacity "+k+"s ease-in; transition: height "+k+"s ease-in, opacity "+k+"s ease-in; border-bottom: 2px solid hsl(0, 0%, 68%); box-shadow: hsl(0, 0%, 67%) -1px -4px 10px 5px; overflow-y: hidden; height: 0px; opacity: 0;",m="//hansifer.github.io/snorkel-inspector/dist/bookmarklet/";m=a(m);var n='<!DOCTYPE html><!--[if lt IE 7]> <html class="no-js lt-ie9 lt-ie8 lt-ie7"> <![endif]--><!--[if IE 7]> <html class="no-js lt-ie9 lt-ie8"> <![endif]--><!--[if IE 8]> <html class="no-js lt-ie9"> <![endif]--><!--[if gt IE 8]><!--> <html class="no-js"> <!--<![endif]--> <head> <meta charset="utf-8"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <title>snorkel inspector</title> <meta name="viewport" content="width=device-width, initial-scale=1">  <link rel="stylesheet" href="'+m+'css/combo.css"><link rel="stylesheet" href="'+a("http://netdna.bootstrapcdn.com/font-awesome/4.1.0/css/font-awesome.min.css")+'"> <script src="'+m+'js/modernizr-2.6.2.min.js"></script> <style id="syntax"></style> </head> <body> <!--[if lt IE 9]> <p class="browsehappy">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> to improve your experience.</p> <![endif]--> <header> <div class="page-header"> <span> <a id="logo" href="http://hansifer.github.io/snorkel.js/" target="_blank"><span id="logo-image"></span><span id="logo-text">snorkel.Js</span></a> <span class="header-origin">&nbsp;&nbsp;<span id="contents-for">contents&nbsp;for&nbsp;</span><span id="origin"></span></span> </span> <span class="control-search"> <span class="dropdown"> <a data-toggle="dropdown" href="#"><b class="caret"></b></a> <ul class="dropdown-menu" role="menu"> <li id="menuitem-filter-by-key" class="active" role="presentation"><a role="menuitem" tabindex="-1">filter by key</a></li> <li id="menuitem-highlight-by-key" role="presentation"><a role="menuitem" tabindex="-1">highlight by key</a></li> </ul> </span> <input id="input-search" type="text" autofocus="autofocus" spellcheck="false" /> </span> <span id="close-overlay" role="button"> <i class="fa fa-times"></i> </span> </div> <div class="page-subheader"> <span id="dropdown-label-namespace" style="margin-right:5px;">Namespace:</span> <span id="select-namespace" class="dropdown"> <a data-toggle="dropdown" href="#"> <span> loading... </span> <b class="caret"></b> </a> <ul class="dropdown-menu" role="menu" aria-labelledby="dropdown-label-namespace"></ul> </span> <span id="remove-namespace" style="display:none;" class="fa fa-times"></span> <span id="summary"></span> </div> <div class="controls-crud"> <span id="wrapper-input-key"><span>*</span><input type="text" id="input-key" placeholder="key" spellcheck="false" /></span> <input type="text" id="input-val" placeholder="value" spellcheck="false" /> <button type="button" id="btn-add" class="btn btn-default btn-xs">Add</button> <button type="button" id="btn-clear" class="btn btn-default btn-xs">Clear</button> <div class="dropdown" style="position:static;"> <span id="btn-options" role="button" data-toggle="dropdown"><span class="fa fa-cog"></span></span> <ul class="dropdown-menu" role="menu" aria-labelledby="btn-options"> <li id="menuitem-options-indent" role="presentation"><a role="menuitem" tabindex="-1" href="#">Pretty print objects and arrays<!-- Indent composites --></a></li> </ul> </div> </div> </header> <div id="snorkel-data-box"> <div class="no-data">loading...</div> </div> <!-- something to tab into before address bar --> <div tabindex="0"></div> <div id="modal-namespace" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="modal-namespace-title" aria-hidden="true"> <div class="modal-dialog modal-sm"> <div class="modal-content"> <div class="modal-header"> <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button> <h4 id="modal-namespace-title" class="modal-title">New namespace</h4> </div> <div class="modal-body"> <input type="text" id="input-namespace-new" spellcheck="false" /> </div> <div class="modal-footer"> <button type="button" class="btn btn-default btn-sm" data-dismiss="modal">Cancel</button> <button type="button" id="btn-accept-namespace" class="btn btn-primary btn-sm">OK</button> </div> </div> </div> </div> <div id="modal-confirm" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="modal-confirm-title" aria-hidden="true"> <div class="modal-dialog modal-sm"> <div class="modal-content"> <div class="modal-header"> <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button> <h4 id="modal-confirm-title" class="modal-title">Sure about that?</h4> </div> <div class="modal-body"></div> <div class="modal-footer"> <button type="button" class="btn btn-default btn-sm" data-dismiss="modal">Nope</button> <button type="button" id="btn-accept-confirm" class="btn btn-primary btn-sm">Yep</button> </div> </div> </div> </div> <div id="modal-error" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="modal-error-title" aria-hidden="true"> <div class="modal-dialog modal-sm"> <div class="modal-content"> <div class="modal-header"> <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button> <h4 id="modal-error-title" class="modal-title">There&#39;s a problem</h4> </div> <div class="modal-body"></div> <div class="modal-footer"> <button type="button" id="btn-accept-error" class="btn btn-primary btn-sm" data-dismiss="modal">Alrighty</button> </div> </div> </div> </div> <div id="modal-snorkel-update-error" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="modal-snorkel-update-error-title" aria-hidden="true"> <div class="modal-dialog modal-sm"> <div class="modal-content"> <div class="modal-header"> <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button> <h4 id="modal-snorkel-update-error-title" class="modal-title">There&#39;s a problem</h4> </div> <div class="modal-body"></div> <div class="modal-footer"> <button type="button" class="btn btn-default btn-sm" data-dismiss="modal">Discard</button> <button type="button" id="btn-edit-snorkel-update-error" class="btn btn-primary btn-sm" data-dismiss="modal">Edit</button> </div> </div> </div> </div> <div id="modal-key-exists" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="modal-key-exists-title" aria-hidden="true"> <div class="modal-dialog modal-sm"> <div class="modal-content"> <div class="modal-header"> <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button> <h4 id="modal-key-exists-title" class="modal-title">Ummm...</h4> </div> <div class="modal-body">key<span class="label-heavy"></span>already exists </div> <div class="modal-footer"> <button type="button" class="btn btn-default btn-sm" data-dismiss="modal">Cancel</button> <button type="button" id="btn-suggest-key-exists" class="btn btn-primary btn-sm" data-dismiss="modal">Suggest</button> <button type="button" id="btn-overwrite-key-exists" class="btn btn-primary btn-sm" data-dismiss="modal">Overwrite</button> </div> </div> </div> </div> <script src="'+m+'js/combo.js"></script></body></html>',o=top.document.getElementById(i),p=!1;o?e():(o=document.createElement("iframe"),o.setAttribute("id",i),o.setAttribute("frameBorder","0"),o.setAttribute("allowTransparency","true"),o.cssText=o.style.cssText=l,h().body.appendChild(o),d(o,function(a){var d=o.contentWindow.document.getElementById("close-overlay");d&&(d.addEventListener?d.addEventListener("click",e,!1):d.attachEvent&&d.attachEvent("onclick",function(){e.call(d)})),o.contentWindow.setIframeHeight=f,o.contentWindow.resetIframeHeight=c,o.contentWindow.addEventListener("message",function(a){a.source===o.contentWindow&&a.data.type&&"resetIframeHeight"===a.data.type&&c(a.data.dataBoxHeight)},!1);var g=setInterval(function(){p&&"complete"===a&&(b(),clearInterval(g),g=0)},17);setTimeout(function(){clearInterval(g),g=0},1e4)}),g(o,n),setTimeout(function(){f(j),p=!0},17))}();