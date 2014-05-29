// domDab.js 0.1.0
// https://github.com/hansifer/dom-dab.js
// (c) 2014 Hans Meyer; Licensed MIT
//
// Depends:
// underscore (https://github.com/jashkenas/underscore)

(function(undefined) {
	var VERSION = '0.1.0';

	// set global to 'window' (browser) or 'exports' (server)
	// var global = this;

	// record access names and current references
	// var access = {};
	// access.domDabInit = global.domDabInit;
	// access.d = global.d;

	// m10n
	// var isFunction = _.isFunction;
	var isUndefined = _.isUndefined;
	// var isFinite = _.isFinite;
	// var isNumber = _.isNumber;
	// var isArray = _.isArray;
	// var isRegExp = _.isRegExp;
	var isString = _.isString;
	// var isObject = _.isObject;
	// var contains = _.contains;

	// --- API - jQuery ---

	// -------------------------------------------------------------------
	// @description <desc>
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// REQUIRES JQUERY
	// -------------------------------------------------------------------

	function suppressParentScroll(e) {
		var el = e.currentTarget;
		if (el.scrollHeight > el.clientHeight && ((el.scrollTop <= 0 && e.originalEvent.wheelDeltaY > 0) ||
			(el.scrollHeight <= (el.scrollTop + el.clientHeight) && e.originalEvent.wheelDeltaY < 0))) {
			e.preventDefault();
		}		
	}

	// --- API - vanillaJS ---
	
	// -------------------------------------------------------------------
	// @description <desc>
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// -------------------------------------------------------------------

	function isContentClipped(iEl) {
		return iEl.scrollHeight > iEl.clientHeight;
	}

	// -------------------------------------------------------------------
	// @description <desc>
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit 
	// Note: reusing inTag as return element.
	// -------------------------------------------------------------------

	function createElement(iTag, iId, iStyleOrClassName, iInnerHTML, iWindow) {
		if (isString(iTag)) {
			iTag = (iWindow || window).document.createElement(iTag);

			if (iId) {
				iTag.id = iId;
			}

			if (isString(iStyleOrClassName)) {
				if (iStyleOrClassName.indexOf(':') > -1) {
					iTag.setAttribute('style', iStyleOrClassName);
				} else if (iStyleOrClassName.trim().length > 0) {
					iTag.className = iStyleOrClassName;
				}
			}

			if (!isUndefined(iInnerHTML)) {
				iTag.innerHTML = iInnerHTML;
			}

			return iTag;
		}
	}

	// -------------------------------------------------------------------
	// @description <desc>
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// TODO: Test: htmlEncode/htmlDecode may not encode quote marks and in IE may strip whitespace
	// -------------------------------------------------------------------

	function htmlEncode(iText) {
		return document.createElement('div').appendChild(
			document.createTextNode(iText)).parentNode.innerHTML.replace(/ /g, '&nbsp;');
	}

	// -------------------------------------------------------------------
	// @description <desc>
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// TODO: Test: htmlEncode/htmlDecode may not encode quote marks and in IE may strip whitespace
	// -------------------------------------------------------------------

	function htmlDecode(iText) {
		return createElement('div', undefined, undefined, iText).textContent;
	}

	// -------------------------------------------------------------------
	// @description <desc>
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit 
	// -------------------------------------------------------------------

	function childIndexOf(iEl) {
		if (iEl && iEl.parent) {
			var children = iEl.parent.children;
			for (var i = 0; i < children.length; i++) {
				if (iEl === children[i]) {
					return i;
				}
			}
		}

		return -1;
	}

	function origin() {
		// if (isUndefined(window.location.origin)) {
		if (!window.location.origin || window.location.origin === 'null') {
			return window.location.protocol + '//' + window.location.host;
		}

		return window.location.origin;
	}

	// --- RANGE FUNCTIONS ---

	function createRange() {
		return (document.createRange || document.body.createTextRange).call(document);
	}

	function selectNodeContents(iRange, iEl) {
		(iRange.selectNodeContents || iRange.moveToElementText).call(iRange, iEl);

		return iRange;
	}

	function selectRange(iRange) {
		if (window.getSelection) {
			var sel = window.getSelection();
			sel.removeAllRanges();
			sel.addRange(iRange);
		} else {
			iRange.select();
		}

		return iRange;
	}

	// -------------------------------------------------------------------
	// @description <desc>
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit 
	// -------------------------------------------------------------------

	function selectElementContents(iEl) {
		// document.execCommand('selectAll', false, null);

		iEl.focus();
		selectRange(selectNodeContents(createRange(), iEl));
	}

	// -------------------------------------------------------------------
	// @description <desc>
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit 
	// -------------------------------------------------------------------

	function moveCursorToEnd(iEl) {
		iEl.focus();

		var range = selectNodeContents(createRange(), iEl);
		range.collapse(false);

		selectRange(range);
	}

	// --- HELPER ---

	// initializes and returns a domDab context

	function init() {
		var r = {};

		r.version = VERSION;

		r.suppressParentScroll = suppressParentScroll;
		
		r.isContentClipped = isContentClipped;
		r.createElement = r.ce = createElement;
		r.htmlEncode = htmlEncode;
		r.htmlDecode = htmlDecode;
		r.childIndexOf = childIndexOf;
		r.origin = origin;

		// --- RANGE FUNCTIONS ---

		r.createRange = createRange;
		r.selectNodeContents = selectNodeContents;
		r.selectRange = selectRange;
		r.selectElementContents = selectElementContents;
		r.moveCursorToEnd = moveCursorToEnd;

		return r;
	}

	// if (typeof define === 'function' && define.amd) {
	// 	define('domDabInit', function() {
	// 		return domDabInit;
	// 	});
	// } else if (typeof module === 'object' && module.exports) {
	// 	module.exports = domDabInit;
	// } else {
	// for (var i in access) {
	// 	global[i] = domDabInit;
	// }
	// }

	domDabInit = init;

}).call(this);
