// snorkel.js 1.0.0
// https://github.com/hansifer/snorkel.js
// (c) 2013-2014 Hans Meyer; Licensed MIT
//
// Depends:
// underscore (https://github.com/jashkenas/underscore)
// dab.js (https://github.com/hansifer/dab.js)
// browserDab.js (https://github.com/hansifer/browser-dab.js)
// originEvents (https://github.com/hansifer/originEvents.js)

(function(undefined) {
	var VERSION = '1.0.0';

	// set global to 'window' (browser) or 'exports' (server)
	var global = this;

	// dab, browserDab
	var d, bd;

	var localStorage = global.localStorage;

	// record access names and current references
	// var access = {};
	// access.snorkelInit = global.snorkelInit;
	// access.snorkel = global.snorkel;
	// access.J = global.J;

	// events
	var listeners = [];
	var remoteEventListenerCount = 0;
	var originEvents;

	// decoding
	// var reEncodedValue = /^\\\/([^(]+)(?:\(([\s\S]*)\))?\\\/$/;
	// var reEncodedRegExp = /(.*?)(?:\)\((g?i?m?))?$/;

	// m10n
	var isFunction = _.isFunction;
	var isUndefined = _.isUndefined;
	var isFinite = _.isFinite;
	var isNumber = _.isNumber;
	var isArray = _.isArray;
	var isRegExp = _.isRegExp;
	var isString = _.isString;
	var isObject = _.isObject;
	var contains = _.contains;

	var _defaultTransforms = {};

	// --- VALIDATION ---

	// valid key is string or finite number. Key arrays or key selectors are not themselves valid keys.

	function validKey(iKey) {
		return isString(iKey) /*&& iKey.length > 0*/ || isFinite(iKey) && isNumber(iKey); // need check for number because isFinite() returns true for things like [], Date(), and ''
	}

	function checkKey(iKey) {
		if (!validKey(iKey)) {
			throwInvalidValue('key', iKey);
		}
	}

	function checkTransformArg(iTransform) {
		if (!isUndefined(iTransform) && !isFunction(iTransform)) {
			throwInvalidValue('transform argument', iTransform);
		}
	}

	function interpretEncodingVer(iVer) {
		var n = parseInt(iVer, 10);

		if (!isNumber(n) || !isFinite(n) || n > 99 || n < 0) {
			throwInvalidValue('encoding version', iVer);
		}

		return d.lpad(n, 2, '0');
	}

	function validNamespace(iNamespace) {
		return isString(iNamespace) && /^[\w-]+(\.[\w-]+)*$/.test(iNamespace);
	}

	// --- BUILT-IN TRANSFORMS ---

	function trans_get_object(keys, values /*, nils*/ ) {
		var r = {};

		_.each(keys, function(k, i) {
			r[k] = values[i];
		});

		return r;
	}

	function trans_get_array(keys, values /*, nils*/ ) {
		return values;
	}

	function trans_get_report(keys, values, nils) {
		return transGetStringHelper(keys, values, nils, undefined, function(t) {
			if (t === 'undefined' || t === 'null') {
				return '';
			} else {
				return ' [' + t + ']';
			}
		});
	}

	function trans_get_html(keys, values, nils) {
		// return '<div style="font-family:courier;">' + '<div>' + transGetStringHelper(keys, values, nils, itemTrans_html, function(t) {
		// 	if (t === 'undefined' || t === 'null') {
		// 		return '';
		// 	} else {
		// 		return ' <span style="color:hsl(0, 0%, 70%);">[' + t + ']</span>';
		// 	}
		// }, '</div><div>', '&nbsp;') + '</div>' + '</div>';

		return '<div>' + transGetStringHelper(keys, values, nils, itemTrans_html, undefined, '</div><div>', '&nbsp;') + '</div>';
	}

	function trans_get_console(keys, values, nils) {
		bd.styledConsoleLog(transGetStringHelper(keys, values, nils, itemTrans_console, undefined
		/*function(t) {
			if (t === 'undefined' || t === 'null') {
				return '';
			} else {
				return ' <span style="color:hsl(0, 0%, 70%);">[' + t + ']</span>';
			}
		}*/
		));
	}

	function trans_get_table(keys, values, nils) {
		var r = [];

		_.each(values, function(v, i) {
			r.push({
				key: keys[i],
				value: v,
				type: (nils[i] ? undefined : d.type(v)),
				exists: !nils[i]
			});
		});

		return r;
	}

	function itemTrans_console(item) {
		return colorize(d.stringify(item), d.typeColor[d.type(item)]);
	}

	function itemTrans_html(item) {
		var txt = d.escapeHTML(d.stringify(item));

		if (d.type(item) === 'string') {
			txt = txt.replace(/ /g, '<span style="background-color:hsl(0,0%,90%);text-align:center;display:inline-block;">&#183;</span>');
		} else {
			txt = txt.replace(/ /g, '&nbsp;');
		}

		return colorize(txt, d.typeColor[d.type(item)]);
	}

	function colorize(iTxt, iColor) {
		return '<span style="color:' + (iColor || 'black') + ';">' + iTxt + '</span>';
	}

	function transGetStringHelper(iKeys, iVals, iNils, itemTransform, iTypeTransform, iSeparator, iPadStr) {
		var r = [];

		if (arguments.length < 6) {
			iSeparator = '\n';
		}

		var maxKeyLength = _.reduce(iKeys, function(memo, k) {
			return Math.max(memo, k.length);
		}, 0);

		_.each(iVals, function(v, i) {
			r.push(d.lpad(iKeys[i], maxKeyLength, iPadStr) + ': ' + d.stringify(v, itemTransform) + (isFunction(iTypeTransform) ? iTypeTransform(d.type(v)) : '') + (iNils[i] ? ' (default)' : ''));
		});

		return r.join(iSeparator);
	}

	function trans_set_array(key, value, i) {
		// alternative behavior: don't set key (instead of setting it to undefined) if corresponding value is not available (ie, value array is shorter than key array). This would require allowing [set transform functions] to suppress an individual set, which is not currently supported.
		return (isArray(value) ? (i < value.length ? value[i] : undefined) : value);
	}

	// --- ENCODE/DECODE ---

	function encodeValue(iVal, iVer) {
		var key;

		if (arguments.length > 1) {
			key = interpretEncodingVer(iVer);
		} else {
			key = this.encodingVersion();
		}

		return this._encoders[key].encode(iVal);
	}

	function SnorkelEncoder_v00() {
		this.encode = function(iVal) {
			// return JSON.stringify(preEncodeValue(iVal));
			if (isFunction(iVal)) {
				throw 'v0 encoding does not permit function values';
			}

			return d.stringify(iVal, replacer, {
				quoteKeys: true
			});
		};

		this.decode = function(iVal) {
			try {
				return JSON.parse(iVal, reviver);
			} catch (ex) {
				throwInvalidValue('v0 storage value ' + iVal);
			}
		};

		// functions get filtered out

		function replacer(iVal) {
			if (!isFunction(iVal)) {
				return '"' + replacer_value(iVal) + '"';
			}
		}

		function replacer_value(iVal) {
			if (isString(iVal)) {
				return "'" + d.escapeJSON(iVal) + "'";
			} else if (_.isDate(iVal)) {
				return '@' + iVal.toISOString();
			} else if (isRegExp(iVal)) {
				return d.escapeJSON(iVal + '');
			} else {
				return iVal;
			}
		}

		function reviver(iKey, iVal) {
			if (isObject(iVal)) {
				return iVal;
			}

			switch (iVal.substring(0, 1)) {
				case "'":
					return iVal.slice(1, -1);
				case '/':
					var r = /^\/([\s\S]+)?\/([gim]{0,3})$/.exec(iVal);
					return new RegExp(r[1], r[2]);
				case '@':
					return new Date(iVal.substring(1));
			}

			switch (iVal) {
				case 'true':
					return true;
				case 'false':
					return false;
				case 'null':
					return null;
				case 'undefined':
					return undefined;
				case 'NaN':
					return 0 / 0;
				case 'Infinity':
					return 1 / 0;
				case '-Infinity':
					return -1 / 0;
			}

			return parseFloat(iVal);
		}
	}

	function decodeValue(iVal, iVer) {
		if (isUndefined(iVer)) { // assume we need to parse the version
			iVer = iVal.substring(0, 2);
			iVal = iVal.substring(2);
		}

		return this._encoders[arguments.length > 1 ? interpretEncodingVer(iVer) : this.encodingVersion()].decode(iVal);



		// // process snorkel value equivalents - these values are not set by snorkel but may be present via direct localStorage.setItem() calls
		// if (iVal === '') {
		// 	return null;
		// } else if (iVal === 'undefined') {
		// 	return;
		// }

		// // try {
		// // 	iVal = JSON.parse(iVal);
		// // } catch (ex) {}

		// // return postDecodeValue(iVal);

		// return postDecodeValue(JSON.parse(iVal));
	}

	// not cloning here (as in preEncodeValue()) because iVal target is not otherwise referenced.

	// function postDecodeValue(iVal, iVisited) {
	// 	var encodedParsed;

	// 	if (isString(iVal)) {
	// 		if (encodedParsed = reEncodedValue.exec(iVal)) {
	// 			switch (encodedParsed[1]) {
	// 				case 'Date':
	// 					return new Date(encodedParsed[2]);
	// 				case 'Function':
	// 					if (!/^\s*function[^(]*\(/.test(encodedParsed[2])) {
	// 						throwInvalidValue('function type', encodedParsed[2]);
	// 					}

	// 					// return eval('(' + encodedParsed[2] + ')');
	// 					return new Function('return ' + encodedParsed[2])(); // use this [instead of eval] to avoid closure (the local scope won't apply to the function body). Also, eval hampers uglify mangling. // using "new" prefix to satisfy jshint
	// 				case 'RegExp':
	// 					if (encodedParsed = reEncodedRegExp.exec(encodedParsed[2])) {
	// 						return new RegExp(encodedParsed[1], encodedParsed[2]);
	// 					}

	// 					throwInvalidValue('RegExp type', encodedParsed[2]);
	// 					break;
	// 				case 'undefined':
	// 					return void 0;
	// 				case 'NaN':
	// 					return 0 / 0;
	// 				case 'Infinity':
	// 					return 1 / 0;
	// 				case '-Infinity':
	// 					return -1 / 0;
	// 				default:
	// 					throw 'unrecognized encoded type ' + encodedParsed[1];
	// 			}
	// 		}

	// 		return iVal;
	// 	} else if (isObject(iVal)) {
	// 		if (!iVisited) {
	// 			iVisited = [];
	// 		} else if (contains(iVisited, iVal)) {
	// 			return iVal;
	// 		}

	// 		iVisited.push(iVal);

	// 		for (var i in iVal) {
	// 			iVal[i] = postDecodeValue(iVal[i], iVisited);
	// 		}
	// 	}

	// 	return iVal;
	// }

	// --- GET/SET ---

	// references receiver

	function getStoredValue(iKey) {
		var val = localStorageGet.call(this, iKey);
		return decodeValue.call(this, val.substring(2), val.substring(0, 2));
	}

	// references receiver

	function setStoredValue(iKey, iVal, iEncodedValue) {
		var oldValue;

		if (isUndefined(iEncodedValue)) {
			iEncodedValue = encodeValue.call(this, iVal);
		}

		if (localEmit.call(this) && listeners.length || remoteEmit.call(this)) {
			if (exists.call(this, iKey)) {
				oldValue = get.call(this, iKey);
				localStorageSet.call(this, iKey, this._encodingVersion + iEncodedValue);
				emit.call(this, 'updated', iKey, iVal, oldValue);
			} else {
				localStorageSet.call(this, iKey, this._encodingVersion + iEncodedValue);
				emit.call(this, 'added', iKey, iVal);
			}
		} else {
			localStorageSet.call(this, iKey, this._encodingVersion + iEncodedValue);
		}

		return iVal;
	}

	// references receiver

	function localStorageGet(iKey) {
		return localStorage.getItem(getNamespacedKey.call(this, iKey));
	}

	// references receiver

	function localStorageSet(iKey, iVal) {
		localStorage.setItem(getNamespacedKey.call(this, iKey), iVal);
	}

	// references receiver

	function localStorageRemove(iKey) {
		localStorage.removeItem(getNamespacedKey.call(this, iKey));
	}

	// references receiver

	function getKeyPrefix() {
		return '[snorkel' + (this._namespace ? '.' + this._namespace : '') + ']';
	}

	// references receiver

	function getNamespacedKey(iKey) {
		return getKeyPrefix.call(this) + iKey;
	}

	// --- EVENTS ---

	// references receiver

	function emit(iEventType, iKey, iVal, iOldValue) {
		if (validKey(iKey)) {
			if (remoteEmit.call(this)) {
				originEvents.trigger('snorkel', {
					type: iEventType,
					key: iKey,
					namespace: this._namespace,
					value: iVal,
					oldValue: iOldValue
				});
			}

			if (localEmit.call(this)) {
				emitLocally.call(this, iEventType, iKey, iVal, iOldValue);
			}
		}
	}

	// if iNamespace is not undefined, it's a remote event

	function emitLocally(iEventType, iKey, iVal, iOldValue, iNamespace) {
		var i, j, isRemoteEvent = !isUndefined(iNamespace);

		iKey = iKey.toString();

		//console.log('emission check:', iKey, iVal);
		for (i = 0; i < listeners.length; i++) {
			// console.log(listeners[i].h.name);
			for (j = 0; j < listeners[i].k.length; j++) {
				if ((isUndefined(iNamespace) || this._namespace === iNamespace) && listeners[i].k[j].test(iKey) && (iEventType !== 'updated' || listeners[i].a === true || !_.isEqual(iVal, iOldValue)) && (listeners[i].s === 'all' || ((listeners[i].s === 'remote' && isRemoteEvent) || (listeners[i].s === 'local' && !isRemoteEvent)))) {
					// console.log('match test SUCCESS:', listeners[i].k[j].source, iKey);
					break; // only one call per handler even if multiple keySelectors qualify
					// } else {
					// console.log('match test FAIL:', listeners[i].k[j].source, iKey);
				}
			}

			if (j === 0 || j < listeners[i].k.length) {
				listeners[i].h(iEventType, iKey, iVal, iOldValue, isRemoteEvent);
			}
		}
	}

	function normalizeKeySelector(iKeySelector) {
		if (validKey(iKeySelector)) {
			return new RegExp('^' + d.escapeRegExp(iKeySelector) + '$');
		} else if (!isRegExp(iKeySelector)) {
			throwInvalidValue('key selector', iKeySelector);
		}

		return iKeySelector;
	}

	function snorkelEventHandler(iType, iMessage /*, iDatetime, iIsRemoteEvent, iId */ ) {
		emitLocally.call(this, iMessage.type, iMessage.key, iMessage.value, iMessage.oldValue, iMessage.namespace);
	}

	function SnorkelInvalidValueError(iMessage) {
		this.name = 'SnorkelInvalidValueError';
		this.message = (iMessage || '');
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, SnorkelInvalidValueError);
		}
	}

	SnorkelInvalidValueError.prototype = Error.prototype;

	SnorkelInvalidValueError.prototype.toString = function() {
		return this.message;
	};

	function throwInvalidValue(iName, iVal) {
		if (arguments.length) {
			throw new SnorkelInvalidValueError('invalid ' + iName + (arguments.length > 1 ? ': ' + d.stringify(iVal) : ''));
		}
	}

	function stripNamespace(iKey) {
		var prefix = getKeyPrefix.call(this);

		if (prefix === iKey.substring(0, prefix.length)) {
			return iKey.substring(prefix.length);
		}
	}

	// returns a flat array of valid (not necessarily existing) keys; dupes possible

	function resolveKeys(iKeys, iMaxResults, iExistingOnly, iUnique, iSorted, nAppendTo) {
		if (!nAppendTo) {
			nAppendTo = [];
		}

		var i, noMax = isUndefined(iMaxResults);

		if (!noMax && !(isNumber(iMaxResults) && isFinite(iMaxResults))) {
			throw 'maxResults must be finite numeric. Got ' + d.stringify(iMaxResults);
		}

		if (noMax || nAppendTo.length < iMaxResults) {
			var l = localStorage.length;
			var key;

			if (isUndefined(iKeys)) {
				for (i = 0; i < l && (noMax || nAppendTo.length < iMaxResults); i++) {
					if (!isUndefined(key = stripNamespace.call(this, localStorage.key(i))) && /*(!iExistingOnly || exists.call(this,key)) &&*/ (!iUnique || !contains(nAppendTo, key))) {
						nAppendTo.push(key);
					}
				}
			} else if (isRegExp(iKeys)) {
				for (i = 0; i < l && (noMax || nAppendTo.length < iMaxResults); i++) {
					if (!isUndefined(key = stripNamespace.call(this, localStorage.key(i))) && iKeys.test(key) && /*(!iExistingOnly || exists.call(this,key)) &&*/ (!iUnique || !contains(nAppendTo, key))) {
						nAppendTo.push(key);
					}
				}
			} else if (isFunction(iKeys) && iKeys.length === 1) {
				for (i = 0; i < l && (noMax || nAppendTo.length < iMaxResults); i++) {
					if (!isUndefined(key = stripNamespace.call(this, localStorage.key(i))) && iKeys(key) && /*(!iExistingOnly || exists.call(this,key)) &&*/ (!iUnique || !contains(nAppendTo, key))) {
						nAppendTo.push(key);
					}
				}
			} else if (isArray(iKeys)) {
				_.each(iKeys, function(el) {
					resolveKeys.call(this, el, iMaxResults, iExistingOnly, iUnique, iSorted, nAppendTo);
				}, this);
			} else if (validKey(iKeys)) {
				if ((!iExistingOnly || exists.call(this, iKeys)) && (!iUnique || !contains(nAppendTo, iKeys.toString()))) {
					nAppendTo.push(iKeys.toString()); // consider nAppendTo.push(iKeys)
				}
			} else {
				throwInvalidValue('key selector', iKeys);
			}
		}

		// TODO: (more) natural (and consistent) default sort (a,A,b,B...; a9,a10...)
		return (iSorted ? nAppendTo.sort((isFunction(iSorted) ? iSorted : function(a, b) {
			if ($.isNumeric(a)) {
				if ($.isNumeric(b)) {
					return a - b;
				} else {
					return -1;
				}
			}

			if ($.isNumeric(b)) {
				return 1;
			}

			return a.toLowerCase().localeCompare(b.toLowerCase()); // doesn't provide consistent collation of upper and lower case version of same string.
		})) : nAppendTo);
	}

	// var arrayAppend = function(arr, val) {
	// 	var r = arr.slice();

	// 	r.push(val);

	// 	return r;
	// };

	// --- API ---

	// HMM 2013-11-23: NOTE: do not add formal parameters to this function
	// references receiver

	function multi() {
		var key, l = arguments.length;

		if (!l) {
			return all.call(this);
		}

		key = arguments[0];

		// "snorkel('id','foo')" set call

		if (isArray(key) || isRegExp(key) || isFunction(key)) {
			if (l > 1) {
				return mset.call(this, key, arguments[1]);
			}

			return mget.call(this, key);
		}

		if (isObject(key)) {
			return mset.call(this, key);
		}

		// "snorkel({id:123,name:'foo'})" set call; note that this only considers enumerable properties
		if (l > 1) {
			return set.call(this, key, arguments[1]);
		}

		// "snorkel('id')" get call

		return get.call(this, key);
	}

	// snorkel.noConflict = function() {
	// 	var i;

	// 	if (arguments.length) {
	// 		_.each(arguments, function(arg) {
	// 			if (arg in access) {
	// 				global[arg] = access[arg]; // reset original reference
	// 			}
	// 		});
	// 	} else {
	// 		for (i in access) {
	// 			global[i] = access[i];
	// 		}
	// 	}

	// 	return snorkel;
	// };

	// references receiver

	function get(iKey, iDefault, iTransform) {
		// if (isUndefined(iKey)) {
		// 	return all(iTransform);
		// }

		checkKey(iKey);

		checkTransformArg(iTransform);
		iTransform = iTransform || _defaultTransforms['get'];

		if (exists.call(this, iKey)) {
			if (iTransform) {
				return iTransform([iKey], [getStoredValue.call(this, iKey)], []);
			}

			return getStoredValue.call(this, iKey); // don't incur overhead of a default transform function on prevailing use case
		}

		if (iTransform) {
			return iTransform([iKey], [iDefault], [1]);
		}

		return iDefault;
	}

	// iKey may be (arbitrarily-nested) array or selector (regexp, function)
	// if multi-key (ie, array) arg, returns flat array of all corresponding decoded stored values; non-existent-key values are filled with undefined or iDefault if provided

	function mget(iKeys, iDefault, iTransform, iOptions) {
		// if (isUndefined(iKeys)) {
		// 	return all(iTransform);
		// }

		if (!isFunction(iTransform) && isObject(iTransform) && arguments.length < 4) {
			iOptions = iTransform;
			iTransform = undefined;
		}

		var iMaxResults, iExistingOnly, iUniqueKeys, iSorted;

		if (iOptions) {
			iMaxResults = iOptions.maxResults;
			iExistingOnly = iOptions.existingOnly;
			iUniqueKeys = iOptions.uniqueKeys;
			iSorted = iOptions.sorted;
		}

		checkTransformArg(iTransform);
		iTransform = iTransform || _defaultTransforms['mget'];

		var resultKeys = resolveKeys.call(this, iKeys, iMaxResults, iExistingOnly, iUniqueKeys, iSorted);
		var resultNils = [];

		var resultValues = _.map(resultKeys, function(el, i) {
			if (iTransform && !exists.call(this, el)) {
				resultNils[i] = 1;
			}

			return get.call(this, el, iDefault);
		}, this);

		return (iTransform ? iTransform(resultKeys, resultValues, resultNils) : resultValues);
	}

	// iKey can be a non-empty string, number, arbitrarily-nested array of such (in which case iVal is set for each key in the array), or set object (in which case iVal must not be passed)
	// if single-key (ie, primitive) or multi-key (ie, array) arg, returns iVal.
	// if set object, returns array of set values.
	// references receiver

	function set(iKey, iVal, iTransform) {
		// bd.snap(iVal, 'iVal');

		checkKey(iKey);

		checkTransformArg(iTransform);
		iTransform = iTransform || _defaultTransforms['set'];

		return setStoredValue.call(this, iKey, iTransform ? iTransform(iKey, iVal, 0) : iVal);
	}

	function mset(iKeys, iVal, iTransform) {
		checkTransformArg(iTransform);
		iTransform = iTransform || _defaultTransforms['mset'];

		var i, encodedValue, keys, r = [];

		if (isRegExp(iKeys) || isFunction(iKeys) || isArray(iKeys)) {
			keys = resolveKeys.call(this, iKeys);
			encodedValue = encodeValue.call(this, iVal);

			_.each(keys, function(k, i) {
				if (iTransform) {
					r.push(setStoredValue.call(this, k, iTransform(k, iVal, i)));
				} else {
					r.push(setStoredValue.call(this, k, iVal, encodedValue));
				}
			}, this);
		} else if (isObject(iKeys)) {
			i = 0;
			_.each(iKeys, function(v, k) {
				r.push(setStoredValue.call(this, k, iTransform ? iTransform(k, v, i++) : v));
			}, this);
		} else {
			checkKey(iKeys);
			r.push(setStoredValue.call(this, iKeys, (iTransform ? iTransform(iKeys, iVal, 0) : iVal)));
		}

		return r;
	}

	// iKey may be a non-empty string, number, or arbitrarily-nested array of such
	// if single-key (ie, primitive) arg, return decoded stored value of removed item; non-existent key yields undefined or iDefault if provided
	// if multi-key (ie, array) arg,  return flat array of decoded stored values of all removed items; non-existent-key values are filled with undefined or iDefault if provided
	// if no args, remove all items and return object representation of entire (removed) data store
	// references receiver

	function remove(iKeys, iDefault, iTransform) {
		checkTransformArg(iTransform);
		iTransform = iTransform || _defaultTransforms['remove'];

		var that = this;

		return mget.call(this, iKeys, iDefault, function(keys, values, nils) {
			var canEmit = localEmit.call(that) && listeners.length || remoteEmit.call(that);

			// if (keys.length === localStorage.length) {
			// 	localStorage.clear();
			// 	if (canEmit) {
			// 		_.each(keys, function(k, i) {
			// 			emit.call(this, 'removed', k, values[i]);
			// 		}, that);
			// 	}
			// } else {
			_.each(keys, function(k, i) {
				localStorageRemove.call(this, k);
				if (canEmit) {
					emit.call(this, 'removed', k, values[i]);
				}
			}, that);
			// }

			return (iTransform || trans_get_object)(keys, values, nils);
		}, {
			existingOnly: true,
			uniqueKeys: true,
		});
	}

	// references receiver

	function clear() {
		return remove.call(this);
	}

	// iKey can be string, regexp, or array of such
	// if iKey is undefined, returns false if store is empty, otherwise true

	function exists(iKey) {
		// the line below assumes that the localStorage file is not updated by an external agent. The constraints FF (28.0) imposes on its localStorage table allows null values: "CREATE TABLE webappsstore2 (scope TEXT, key TEXT, value TEXT, secure INTEGER, owner TEXT)" while Chrome does not: "CREATE TABLE ItemTable (key TEXT UNIQUE ON CONFLICT REPLACE, value BLOB NOT NULL ON CONFLICT FAIL)". I didn't find anything specific on this in spec (http://www.w3.org/TR/webstorage/) other than that key and value must be DOMString (https://developer.mozilla.org/en/docs/Web/API/DOMString). Confirmed for FF v28: I was able to manually set a localStorage value to null. localStorage.getItem() subsequently returned null.
		return localStorageGet.call(this, iKey) !== null;

		//1// // enumeration approach
		//1// var i;
		//1// iKey = iKey.toString();
		//1// for (i = localStorage.length - 1; i >= 0; i--) {
		//1// 	if (localStorage.key(i) === iKey) {
		//1// 		return true;
		//1// 	}
		//1// }

		//1// return false;
	}

	// function key(iIndex) {
	// 	return localStorage.key(iIndex) || undefined;
	// }

	// using 'count'/'size' because function 'length' property is not writeable. http://es5.github.io/#x15.3.5.1

	function size(iKeySelectors) {
		// return localStorage.length;

		return eachOf.call(this, iKeySelectors);
	}

	// returns number of localStorage items

	function each(iIterator, iReceiver) {
		return eachOf.call(this, undefined, iIterator, iReceiver);
	}

	function eachOf(iKeySelectors, iIterator, iReceiver) {
		var count = 0;
		_.each(resolveKeys.call(this, iKeySelectors, undefined, true, true), function(el, i) {
			if (!isUndefined(iIterator)) {
				iIterator.call(iReceiver || global, el, get.call(this, el), i);
			}
			count++;
		}, this);

		return count;
	}

	// HMM 2013-11-18: iSorted is redundant on Chrome since keys are sorted by default. Not so for FF. See: http://www.w3.org/TR/webstorage/#storage-0 ["...order of keys is user-agent defined..."]
	// if iKeySelectors, filter the returned set of keys accordingly

	function keys(iKeySelectors, iSorted, iMaxResults) {
		return resolveKeys.call(this, iKeySelectors, iMaxResults, true, true, iSorted);
	}

	function values(iKeySelectors) {
		// return all(trans_get_array);  // one-line alternative that's less efficient but more terse

		var resultVals = [];

		eachOf.call(this, iKeySelectors, function(k, v) {
			resultVals.push(v);
		});

		return resultVals;
	}

	function all(iTransform) {
		checkTransformArg(iTransform);
		iTransform = iTransform || _defaultTransforms['all'];

		// return mget.call(this,undefined, undefined, iTransform || trans_get_object);

		var resultKeys = [],
			resultVals = [];

		each.call(this, function(k, v) {
			resultKeys.push(k);
			resultVals.push(v);
		});

		return (iTransform || trans_get_object)(resultKeys, resultVals, []);
	}

	function log(iKeys, iDefault, iOptions) {
		mget.call(this, iKeys, iDefault, trans_get_console, iOptions);
	}

	function logTable(iKeys, iDefault, iOptions) {
		(console.table || console.log).call(console, mget.call(this, iKeys, iDefault, trans_get_table, iOptions), (iOptions ? iOptions.columnFilter : undefined));
	}

	function defaultTransform(iMethod, iTransform) {
		checkTransformArg(iTransform);

		if (arguments.length > 1) {
			return _defaultTransforms[iMethod] = iTransform;
		}

		return _defaultTransforms[iMethod];
	}

	function clearDefaultTransform(iMethod) {
		delete _defaultTransforms[iMethod];
	}

	// accepts handler and a keySelector or array of keySelector, where a keySelector is a non-null string or number (for literal, full match) or a RegExp object;  if no keySelector passed, handler applies to all items
	// calls handler AFTER item matching associated keySelectors is impacted, passing event type, key, value, and old value
	// iOptions: 
	//    scope: 'local', 'remote', or 'all' [default]; determines if event is raised only if snorkel change call occurred locally, only if snorkel change call occurred remotely, or both
	//    alwaysFireOnUpdate: true, false [default]; determines whether to fire 'updated' event without regard to old vs. new values (ie, even when old and new value are the same)

	function on(iHandler, iKeySelectors, iOptions) {
		if (!isFunction(iHandler)) {
			throwInvalidValue('handler function argument', iHandler);
		}

		if (!isUndefined(iKeySelectors)) {
			if (isArray(iKeySelectors)) {
				iKeySelectors = _.flatten(iKeySelectors);

				_.each(iKeySelectors, function(el, i) {
					iKeySelectors[i] = normalizeKeySelector(el);
				});

				// iKeySelectors should now be a flat homogeneous array of RegExp elements
			} else {
				iKeySelectors = normalizeKeySelector(iKeySelectors);

				// iKeySelectors should now be a RegExp
			}
		}

		var scope = (iOptions && (iOptions.scope === 'local' && 'local' || iOptions.scope === 'remote' && 'remote')) || 'all';

		var listener = _.find(listeners, function(el) {
			return el.h === iHandler;
		});

		if (!listener) {
			listeners.push(
				listener = {
				s: scope,
				a: !! (iOptions && iOptions.alwaysFireOnUpdate), // alwaysFireOnUpdate
				h: iHandler, // handler:
				k: [] // keySelectors:
			});
		}

		if (isUndefined(iKeySelectors)) {
			listener.k = [];
		} else {
			listener.k = _.uniq(listener.k.concat(iKeySelectors), function(el) {
				return el.source + el.ignoreCase;
			});
		}

		if (scope === 'remote' || scope === 'all') {
			if (!remoteEventListenerCount) {
				originEvents.on('snorkel', snorkelEventHandler, 'remote', this);
			}

			remoteEventListenerCount++;
		}

		// console.dir(listeners);
	}

	function off(iHandler) {
		var index, listener;

		if (isFunction(iHandler)) {
			listener = _.find(listeners, function(el, i) {
				if (el.h === iHandler) {
					index = i;
					return true;
				}
				return false;
			});

			if (!isUndefined(index)) {
				if (listener.s === 'remote' || listener.s === 'all') {
					remoteEventListenerCount--;

					if (!remoteEventListenerCount) {
						originEvents.off('snorkel', snorkelEventHandler);
					}
				}

				listeners.splice(index, 1);
			}

			// console.dir(listeners);
		}
	}

	// references receiver

	function localEmit(iLocalEmit) {
		if (arguments.length) {
			this._localEmit = iLocalEmit;
		}

		return this._localEmit;
	}

	// references receiver

	function remoteEmit(iRemoteEmit) {
		if (arguments.length) {
			this._remoteEmit = iRemoteEmit;
		}

		return this._remoteEmit;
	}

	// references receiver

	function namespace(iNamespace) {
		if (!isUndefined(iNamespace)) {
			if (!validNamespace(iNamespace)) {
				throwInvalidValue('namespace', iNamespace);
			}

			this._namespace = iNamespace;
		}

		return this._namespace;
	}

	// references receiver

	function encodingVersion(iVer) {
		if (arguments.length) {
			this._encodingVersion = interpretEncodingVer(iVer);
		}

		return this._encodingVersion;
	}

	function addEncoder(iVer, iEncoder) {
		(this._encoders || (this._encoders = {}))[interpretEncodingVer(iVer)] = new iEncoder();
	}

	function hasEncoder(iVer) {
		return (this._encoders || (this._encoders = {})).hasOwnProperty(interpretEncodingVer(iVer));
	}

	// function expose(iObj, iItem) {
	// 	if (isFunction(iItem)) {
	// 		// bind when available to protect against (rare) possibility of function invocation
	// 		return iObj[iItem.name] = (Function.prototype.bind ? iItem.bind(iObj) : iItem);
	// 	}
	// }

	// initializes and returns a snorkel context

	function init(iNamespace, iLocalEmit, iRemoteEmit, iEncodingVersion) {
		if (arguments.length < 3 && !isString(iNamespace)) {
			iRemoteEmit = iLocalEmit;
			iLocalEmit = iNamespace;
			iNamespace = undefined;
		}

		var r = function() {
			return multi.apply(r, arguments);
		};

		r.version = VERSION;

		r.validKey = validKey;
		// r.validValue = isValidValue;
		// r.checkKey = checkKey;
		r.validNamespace = validNamespace;

		r.trans_get_object = trans_get_object;
		r.trans_get_report = trans_get_report;
		r.trans_get_array = trans_get_array;
		r.trans_set_array = trans_set_array;
		r.trans_get_console = trans_get_console;
		r.trans_get_table = trans_get_table;
		r.trans_get_html = trans_get_html;

		// r.resolveKeys = resolveKeys;

		r.get = get;
		r.mget = mget;
		r.set = set;
		r.mset = mset;
		r.remove = remove;
		r.clear = clear;
		r.has = r.exists = exists;
		r.count = r.size = size;
		r.each = each;
		r.keys = keys;
		r.values = values;
		r.items = r.all = all;
		r.addKeyListener = r.on = on;
		r.removeKeyListener = r.off = off;
		r.localEmit = localEmit;
		r.remoteEmit = remoteEmit;
		r.decodeValue = decodeValue;
		r.namespace = namespace;
		r.encodingVersion = encodingVersion;
		r.addEncoder = addEncoder;
		r.hasEncoder = hasEncoder;
		r.stripNamespace = stripNamespace;

		r.log = log;
		r.logTable = logTable;

		r.defaultTransform = defaultTransform;
		r.clearDefaultTransform = clearDefaultTransform;

		r.SnorkelInvalidValueError = SnorkelInvalidValueError;

		if (!d) {
			d = true;
			d = dabInit();
		}

		if (!bd) {
			bd = true;
			bd = browserDabInit();
		}

		if (!originEvents) {
			originEvents = true;
			originEvents = originEventsInit(false, true);
		}

		r.localEmit(isUndefined(iLocalEmit) || iLocalEmit);
		r.remoteEmit(isUndefined(iRemoteEmit) || iRemoteEmit);
		r.namespace(iNamespace);
		r.encodingVersion(iEncodingVersion || 0);

		r.addEncoder(0, SnorkelEncoder_v00);

		return r;
	}

	// if (typeof define === 'function' && define.amd) {
	// 	define('snorkelInit', function() {
	// 		return snorkelInit;
	// 	});
	// } else if (typeof module === 'object' && module.exports) {
	// 	module.exports = snorkelInit;
	// } else {
	// for (var i in access) {
	// 	global[i] = snorkelInit;
	// }
	// }

	snorkelInit = init;

}).call(this);
