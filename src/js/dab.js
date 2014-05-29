// dab.js 0.1.0
// https://github.com/hansifer/dab.js
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
	// access.dabInit = global.dabInit;
	// access.d = global.d;
	// access.u = global.u;

	// m10n
	var isFunction = _.isFunction;
	var isUndefined = _.isUndefined;
	var isFinite = _.isFinite;
	var isNumber = _.isNumber;
	var isArray = _.isArray;
	// var isRegExp = _.isRegExp;
	var isString = _.isString;
	var isObject = _.isObject;
	var contains = _.contains;

	// --- API ---

	// -------------------------------------------------------------------
	// @description 
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// currently only supported in browser
	// -------------------------------------------------------------------

	function os() {
		// TODO: add fallback for source if navigator doesnt exist (node's os.process()? os.type()? process.platform?)
		var source = navigator.appVersion;

		if (source.indexOf('Win') > -1) {
			return 'Windows';
		}

		if (source.indexOf('Mac') > -1) {
			return 'MacOS';
		}

		if (source.indexOf('X11') > -1) {
			return 'UNIX';
		}

		if (source.indexOf('Linux') > -1) {
			return 'Linux';
		}

		return '(unknown)';
	}

	// -------------------------------------------------------------------
	// @description 
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// move an element to a different position within an array
	// -------------------------------------------------------------------

	function move(iAny, iPosition, iArr) {
		if (isUndefined(iPosition)) {
			iPosition = -1; // move to end
		} else if (!(isNumber(iPosition) && isFinite(iPosition))) {
			throw stringify(iPosition) + ' is not a number';
		}

		if (isUndefined(iArr)) {
			iArr = [];
		} else if (!isArray(iArr)) {
			throw stringify(iArr) + ' is not an array';
		}

		if (isUndefined(iAny)) {
			return iArr;
		}

		var index = iArr.indexOf(iAny);

		if (index !== -1) { // occurrence found
			if (index === iPosition) {
				return iArr;
			}

			iArr.splice(index, 1);
		}

		// translate negative position to a positive one
		if (iPosition < 0) {
			iPosition = Math.max(iArr.length + 1 + iPosition, 0);
		}

		iArr.splice(iPosition, 0, iAny); // splice appends to array if iPosition exceeds or equals array.length

		return iArr;
	}

	// -------------------------------------------------------------------
	// @description 
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// 2014-04-30: now returns array instead of [true if item was pushed, undefined if not]
	// -------------------------------------------------------------------

	function pushUnique(iArr, iAny) {
		if (!contains(iArr, iAny)) {
			iArr.push(iAny);
			// return true;
		}

		return iArr;
	}

	// -------------------------------------------------------------------
	// @description 
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// -------------------------------------------------------------------

	function mapWithout(iObj, iVal, iIterator, iReceiver) {
		var r = [];

		_.each(iObj, function(v, i) {
			v = iIterator.call(iReceiver, v, i);

			if (iVal !== v) {
				r.push(v);
			}
		});

		return r;
	}

	// -------------------------------------------------------------------
	// @description 
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// accepts char codes or chars as inputs
	// -------------------------------------------------------------------

	function StringGenerator(iLower, iUpper) {
		if (!arguments.length) {
			iLower = 97;
			iUpper = iLower + 25;
		} else {
			if (isString(iLower)) {
				iLower = iLower.charCodeAt();
			}

			if (arguments.length < 2) {
				iUpper = iLower + 1;
			} else if (isString(iUpper)) {
				iUpper = iUpper.charCodeAt();
			}
		}

		var s = '';

		this.next = function() {
			return s = incrementString(s, iLower, iUpper);
		};
	}

	// -------------------------------------------------------------------
	// @description 
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// -------------------------------------------------------------------

	function incrementString(iStr, iLowerCharCode, iUpperCharCode) {
		if (!iStr) {
			return String.fromCharCode(iLowerCharCode);
		}

		var code = iStr.charCodeAt(iStr.length - 1);

		if (iUpperCharCode < iLowerCharCode && code <= iUpperCharCode || iUpperCharCode >= iLowerCharCode && code >= iUpperCharCode) {
			return incrementString(iStr.substring(0, iStr.length - 1), iLowerCharCode, iUpperCharCode) + String.fromCharCode(iLowerCharCode);
		} else {
			return iStr.substring(0, iStr.length - 1) + String.fromCharCode(code + (iUpperCharCode < iLowerCharCode ? -1 : 1));
		}
	}

	// -------------------------------------------------------------------
	// @description 
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// iPadStr is considered as a single char when targeting iLength for the length of the output (eg, to support html char entities).
	// You can use this method to generate a repeating string by passing iStr of ''
	// -------------------------------------------------------------------

	function lpad(iStr, iLength, iPadStr) {
		iStr = iStr + '';

		if (isUndefined(iPadStr)) {
			iPadStr = ' ';
		}

		if (isNumber(iLength) && isFinite(iLength) && iLength > iStr.length) {
			return (new Array(iLength - iStr.length + 1)).join(iPadStr) + iStr;
		}

		return iStr;
	}

	// -------------------------------------------------------------------
	// @description 
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// iPadStr is considered as a single char when targeting iLength for the length of the output (eg, to support html char entities).
	// You can use this method to generate a repeating string by passing iStr of ''
	// -------------------------------------------------------------------

	function rpad(iStr, iLength, iPadStr) {
		iStr = iStr + '';

		if (isUndefined(iPadStr)) {
			iPadStr = ' ';
		}

		if (isNumber(iLength) && isFinite(iLength) && iLength > iStr.length) {
			return iStr + (new Array(iLength - iStr.length + 1)).join(iPadStr);
		}

		return iStr;
	}

	// -------------------------------------------------------------------
	// @description 
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// -------------------------------------------------------------------

	function truncate(iStr, iLength) {
		iStr = iStr + '';
		iLength = Math.max(iLength, 4);

		if (isNumber(iLength) && iStr.length > iLength && iLength > 3) { // no need to check for finite
			iStr = iStr.substring(0, iLength - 3) + '...';
		}

		return iStr;
	}

	// -------------------------------------------------------------------
	// @description 
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// for chaining, since it's not included in underscore.string
	// -------------------------------------------------------------------

	function lcase(iStr) {
		return iStr.toLowerCase();
	}

	// -------------------------------------------------------------------
	// @description 
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// for chaining, since it's not included in underscore.string
	// -------------------------------------------------------------------

	function ucase(iStr) {
		return iStr.toUpperCase();
	}

	// -------------------------------------------------------------------
	// @description 
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// -------------------------------------------------------------------

	function csvField(iStr) {
		return ('"' + iStr.replace(/\"/g, '""') + '"');
	}

	// -------------------------------------------------------------------
	// @description regex-escape regex special chars.
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// source: http://stackoverflow.com/a/6969486/384062
	// -------------------------------------------------------------------

	function escapeRegExp(iStr) {
		if (isUndefined(iStr)) {
			iStr = '';
		}

		return iStr.replace(/[-[\]{}()*+?.\\^$|\/]/g, '\\$&');
		//return iStr.replace(/[-[\]{}()*+?.\\^$|,#\s]/g, '\\$&');
	}

	// -------------------------------------------------------------------
	// @description 
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// -------------------------------------------------------------------

	function escapeJSON(iVal) {
		var r = iVal.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');

		return r.replace(new RegExp('[' + unicodeControlChars().join('') + ']', 'g'), function(m) {
			return '\\u' + lpad(m.charCodeAt().toString(16), 4, '0');
		});
	}

	// -------------------------------------------------------------------
	// @description 
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// -------------------------------------------------------------------

	function unicodeControlChars() {
		var arr = [];

		for (var i = 0; i < 32; i++) {
			arr.push('\\u' + lpad(i.toString(16), 4, '0'));
		}

		return arr;
	}

	// -------------------------------------------------------------------
	// @description 
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// 2014-05-01: alternative implementation of domDab.js/htmlEncode() that doesn't require DOM. Also may be more reliable and safe (mainly b/c domDab.js/htmlEncode() may not encode quote marks and may not preserve whitespace (tbd)).
	// -------------------------------------------------------------------

	function escapeHTML(iTxt, iNewline, iSpace) {
		var r = String(iTxt)
			.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');

		if (iNewline) {
			r = r.replace(/\n/g, '<br>');
		}

		if (iSpace) {
			r = r.replace(/ /g, '&nbsp;');
		}

		return r;
	}

	// -------------------------------------------------------------------
	// @description 
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// "composite" is arbitrarily-defined in dab
	// -------------------------------------------------------------------

	function isComposite(iAny) {
		return isObject(iAny) && !_.isRegExp(iAny) && !_.isDate(iAny) && !isFunction(iAny);
	}

	// -------------------------------------------------------------------
	// @description 
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// -------------------------------------------------------------------

	function isCompositeObject(iAny) {
		return !isArray(iAny) && isComposite(iAny);
	}

	// -------------------------------------------------------------------
	// @description 
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// -------------------------------------------------------------------

	function type(iAny) {
		var r = Object.prototype.toString.call(iAny);
		return r.slice(r.indexOf(' ') + 1, -1).toLowerCase();
	}

	// -------------------------------------------------------------------
	// @description 
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// -------------------------------------------------------------------

	var typeColor = {
		'string': 'hsl(1, 100%, 44%)',
		'boolean': 'hsl(120, 57%, 42%)',
		'number': 'hsl(281, 100%, 42%)',
		'null': 'hsl(0, 0%, 70%)',
		'undefined': 'hsl(0, 0%, 70%)',
		'array': 'hsl(115, 48%, 30%)',
		'object': 'hsl(115, 48%, 30%)',
		'date': 'hsl(43, 98%, 48%)',
		'regexp': 'hsl(194, 100%, 49%)',
		'function': 'hsl(300, 68%, 61%)'
	};

	// -------------------------------------------------------------------
	// @description 
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// options: indent, depth, quoteKeys, cycle ("ignore" [default], "show", "throw")
	// TODO: option to show refs to already-rendered arrays/objects (call out instead of expanding inline; eg, "Ref[0,4]")
	// TODO?: option to display item index on array elements
	// HMM 2014-04-22: text of visited.text is only useful when there's no indention.
	// -------------------------------------------------------------------

	function stringify(iAny, iItemTransform, iOptions, nNestLevel, nVisited, nOffset, nKey, nIsProperty) {
		// accommodate alternate sigs
		if (isObject(iItemTransform) && !isFunction(iItemTransform)) {
			iOptions = iItemTransform;
			iItemTransform = defaultItemTransform;
		} else {
			iItemTransform = iItemTransform || defaultItemTransform;
		}

		// try {
		if (isComposite(iAny)) {
			var pad, offset, content, processProperty, opener, closer, itemFct, visited, indent = (iOptions && iOptions.indent);

			if (!isNumber(indent) || !isFinite(indent)) {
				indent = (indent ? 3 : 0);
			}

			nNestLevel = nNestLevel || 0;

			if (!nVisited) {
				nVisited = [];
			}

			if (visited = _.find(nVisited, function(el) {
				return el.composite === iAny;
			})) {
				if (!visited.text) {
					if (iOptions) {
						if (iOptions.cycle === 'show') {
							return 'Circular' + (isArray(iAny) ? 'Array' : 'Object') + 'Reference[' + visited.level + ', ' + (visited.key || 0) + ']';
						} else if (iOptions.cycle === 'throw') {
							throw 'Circular' + (isArray(iAny) ? 'Array' : 'Object') + 'Reference[' + visited.level + ', ' + (visited.key || 0) + ']';
						}
					}

					return '';
				}
			} else {
				nVisited.push(visited = {
					composite: iAny,
					level: nNestLevel,
					key: nKey
				});
			}

			pad = '';
			offset = nOffset || 0;

			if (indent) {
				if (nIsProperty) {
					offset++;
				}

				pad = stringifyPad(indent, nNestLevel, offset + 1);
			}

			if (iOptions && isNumber(iOptions.depth) && nNestLevel >= iOptions.depth) {
				return (isArray(iAny) ? 'Array[' + iAny.length + ']' : 'Object');
			}

			if (isArray(iAny)) {
				opener = '[';
				closer = ']';
				itemFct = function(str, pad) {
					return (str ? pad + str : '');
				};
			} else if (isComposite(iAny)) {
				processProperty = true;
				opener = '{';
				closer = '}';
				if (iOptions && iOptions.quoteKeys) {
					itemFct = function(str, pad, i) {
						return (str ? pad + '"' + i + '": ' + str : '');
					};
				} else {
					itemFct = function(str, pad, i) {
						return (str ? pad + i + ': ' + str : '');
					};
				}
			}

			content = mapWithout(iAny, '', function(v, i) {
				return itemFct(stringify(v, iItemTransform, iOptions, nNestLevel + 1, nVisited, offset, i, processProperty), pad, i);
			}).join(', ');

			// handle bracket positions

			if (indent && content) {
				pad = stringifyPad(indent, nNestLevel, offset);
				visited.text = (nIsProperty ? pad : '') + opener + content + pad + closer;
			} else {
				visited.text = opener + content + closer;
			}

			return visited.text;
		}

		return (iItemTransform(iAny) || '') + ''; // returning falsy from itemTransform yields empty string. all other values are turned into strings.
		// } catch (ex) {
		// 	console.error(ex);
		// }

		// return '<' + type(iAny) + '>';
	}

	// -------------------------------------------------------------------
	// @description 
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// -------------------------------------------------------------------

	function objectify(iAny) {
		var r = {};

		if (isArray(iAny)) {
			_.each(iAny, function(v, i) {
				r[i] = v;
			});
		} else {
			r[0] = iAny;
		}

		return r;
	}

	// --- HELPER ---

	// -------------------------------------------------------------------
	// @description 
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// "non-composite" is anything that's not either an array or a "composite object"
	// -------------------------------------------------------------------

	function defaultItemTransform(iNonComposite) {
		if (isString(iNonComposite)) {
			return '"' + iNonComposite + '"';
		}

		if (isFunction(iNonComposite)) {
			var arr = /(function\s*\w*\()([^\)]*)\)/.exec(iNonComposite.toString());
			return arr[1] + arr[2].replace(/\s/g, '').replace(/,/g, ', ') + '){ ... }';
		}

		if (_.isDate(iNonComposite)) {
			return iNonComposite.toISOString();
		}

		return iNonComposite + '';
	}

	// -------------------------------------------------------------------
	// @description 
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// -------------------------------------------------------------------

	function stringifyPad(indent, nestLevel, offset) {
		return '\n' + lpad('', indent * (nestLevel + (offset || 0)));
	}

	// -------------------------------------------------------------------
	// @description 
	// @param {<type>} <formalParm> <desc>
	// @return {<type>} <desc>
	// @audit
	// initializes and returns a dab context
	// -------------------------------------------------------------------

	function init() {
		var r = {};

		r.version = VERSION;

		r.os = os;

		r.move = move;
		r.pushUnique = pushUnique;
		r.mapWithout = mapWithout;

		r.StringGenerator = StringGenerator;
		r.incrementString = incrementString;
		r.lpad = lpad;
		r.rpad = rpad;
		r.truncate = truncate;
		r.lcase = lcase;
		r.ucase = ucase;
		r.csvField = csvField;

		r.escapeRegExp = escapeRegExp;
		r.escapeJSON = escapeJSON;
		r.unicodeControlChars = unicodeControlChars;
		r.escapeHTML = escapeHTML;

		r.isComposite = isComposite;
		r.isCompositeObject = isCompositeObject;
		r.type = type;
		r.typeColor = typeColor;

		r.stringify = stringify;
		r.objectify = objectify;

		return r;
	}

	// if (typeof define === 'function' && define.amd) {
	// 	define('dabInit', function() {
	// 		return dabInit;
	// 	});
	// } else if (typeof module === 'object' && module.exports) {
	// 	module.exports = dabInit;
	// } else {
	// for (var i in access) {
	// 	global[i] = dabInit;
	// }
	// }

	dabInit = init;

}).call(this);
