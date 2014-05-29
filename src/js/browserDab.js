// browserDab.js 0.1.0
// https://github.com/hansifer/browserDab.js
// (c) 2014 Hans Meyer; Licensed MIT
//
// Depends:
// underscore (https://github.com/jashkenas/underscore)
// dab.js (https://github.com/hansifer/dab.js)

(function(undefined) {
	var VERSION = '0.1.0';

	var d = dabInit();

	// set global to 'window' (browser) or 'exports' (server)
	// var global = this;

	// record access names and current references
	// var access = {};
	// access.browserDabInit = global.browserDabInit;
	// access.b = global.b;

	// m10n
	// var isFunction = _.isFunction;
	// var isUndefined = _.isUndefined;
	// var isFinite = _.isFinite;
	// var isNumber = _.isNumber;
	// var isArray = _.isArray;
	// var isRegExp = _.isRegExp;
	// var isString = _.isString;
	// var isObject = _.isObject;
	// var contains = _.contains;

	// --- API ---

	// -------------------------------------------------------------------
	// @description 
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// log a snapshot of an expression's value
	// -------------------------------------------------------------------

	function snap(iVal, iMessage) {
		console.log((iMessage?iMessage + ':\n':'') + d.stringify(iVal, {indent: 3, cycle: 'show'}));
	}

	// -------------------------------------------------------------------
	// @description 
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// Currently supported in Firebug and Chrome.
	// TODO: fall back to replacing %c's with '' where styled console output is not supported. Unaware currently of any means for detecting support.
	// -------------------------------------------------------------------

	function styledConsoleLog() {
		var argArray = [];

		if (arguments.length) {
			var startTagRe = /<span\s+style=(['"])([^'"]*)\1\s*>/gi;
			var endTagRe = /<\/span>/gi;

			var reResultArray;
			argArray.push(arguments[0].replace(startTagRe, '%c').replace(endTagRe, '%c'));
			while (reResultArray = startTagRe.exec(arguments[0])) {
				argArray.push(reResultArray[2]);
				argArray.push('');
			}

			// pass through subsequent args since chrome dev tools does not (yet) support console.log styling of the following form: console.log('%cBlue!', 'color: blue;', '%cRed!', 'color: red;');
			for (var j = 1; j < arguments.length; j++) {
				argArray.push(arguments[j]);
			}
		}

		console.log.apply(console, argArray);

		// uncomment below code if/when dev console allows styling as follows: console.log('%cBlue!', 'color: blue;', '%cRed!', 'color: red;');
		// var argArray = [];
		// for (var j = 0; j < arguments.length; j++) {
		//     var startTagRe = /<span\s+style=(['"])([^'"]*)\1\s*>/gi;
		//     var endTagRe = /<\/span>/gi;

		//     var reResultArray;
		//     argArray.push(arguments[j].replace(startTagRe, '%c').replace(endTagRe, '%c'));
		//     while (reResultArray = startTagRe.exec(arguments[j])) {
		//         argArray.push(reResultArray[2]);
		//         argArray.push('');
		//     }
		// }

		// console.log.apply(console, argArray);
	}

	// --- HELPER ---

	// initializes and returns a browserDab context

	function init() {
		var r = {};

		r.version = VERSION;

		r.styledConsoleLog = styledConsoleLog;
		r.snap = snap;

		return r;
	}

	// if (typeof define === 'function' && define.amd) {
	// 	define('browserDabInit', function() {
	// 		return browserDabInit;
	// 	});
	// } else if (typeof module === 'object' && module.exports) {
	// 	module.exports = browserDabInit;
	// } else {
	// for (var i in access) {
	// 	global[i] = browserDabInit;
	// }
	// }

	browserDabInit = init;

}).call(this);
