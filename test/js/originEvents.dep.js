// originEvents.js 1.0.0
// https://github.com/hansifer/originEvents.js
// (c) 2013-2014 Hans Meyer; Licensed MIT
//
// Depends:
// underscore (https://github.com/jashkenas/underscore)
// node-uuid (https://github.com/broofa/node-uuid)
// snorkel (https://github.com/hansifer/snorkel.js)

(function(undefined) {
	var VERSION = '1.0.0';

	// set global to 'window' (browser) or 'exports' (server)
	var global = this;

	var incrementor = 0;
	var baseKeyName = 'originEvents.nooxis.com.';
	var windowKeyName = baseKeyName + uuid.v4() + '.';

	// accommodate both uuid.js and uuid.mod.js
	var re2 = new RegExp('^' + baseKeyName.replace('.', '\\.') + '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.\\d+$');
	var re = new RegExp('^' + baseKeyName.replace('.', '\\.') + '[0-9a-f]{32}\\.\\d+$');

	var listeners = {};

	// number of total handlers with 'remote' or 'all' scope; used to add/remove 'storage' listener as needed
	var remoteListenerCount = 0;

	var snorkel;

	// called when 'storage' event is raised

	function storageEventHandler(e) {
		var originEvent;

		// Checking for "e.newValue" instead of "e.newValue !== null" because IE uses empty string instead of null for e.oldValue and e.newValue when adding and removing storage items, respectively.
		// Third condition is required for IE only since it raises locally-sourced "storage" events (against spec) in addition to remote ones

		var key = snorkel.stripNamespace(e.key);

		if (!_.isUndefined(key) && e.newValue && (re.test(key) || re2.test(key)) && key.substring(0, windowKeyName.length) !== windowKeyName) {
			originEvent = snorkel.decodeValue(e.newValue);
			emitLocally(originEvent.type, originEvent.message, originEvent.datetime, true, key);
		}
	}

	function emitLocally(iType, iMessage, iDatetime, iIsRemoteEvent, iId) {
		_.each(listeners[iType], function(handler) {
			if (handler.s === 'all' || ((handler.s === 'remote' && iIsRemoteEvent) || (handler.s === 'local' && !iIsRemoteEvent))) {
				handler.h.call(handler.r || global, iType, iMessage, iDatetime, iIsRemoteEvent, iId);
			}
		});
	}

	// API 

	// iScope determines the types of events this handler processes ('local', 'remote', or 'all' [default])

	function on(iType, iHandler, iScope, iReceiver) {
		iScope = iScope === 'local' && 'local' || iScope === 'remote' && 'remote' || 'all';

		if (!(iType in listeners)) {
			listeners[iType] = [];
		}

		var l = {
			h: iHandler,
			s: iScope,
		};

		if (!_.isUndefined(iReceiver)) {
			l.r = iReceiver;
		}

		// allowing duplicate handlers per event type
		listeners[iType].push(l);

		if (iScope === 'remote' || iScope === 'all') {
			if (!remoteListenerCount) {
				global.addEventListener('storage', storageEventHandler, false);
			}

			remoteListenerCount++;
		}
	}

	function off(iType, iHandler) {
		var index, handler;

		if (iType in listeners) {
			if (iHandler) {
				handler = _.find(listeners[iType], function(el, i) {
					if (el.h === iHandler) {
						index = i;
						return true;
					}
					return false;
				});

				if (!_.isUndefined(index)) {
					if (remoteListenerCount && (handler.s === 'remote' || handler.s === 'all')) {
						remoteListenerCount = Math.max(remoteListenerCount - 1, 0);

						if (!remoteListenerCount) {
							global.removeEventListener('storage', storageEventHandler, false);
						}
					}

					listeners[iType].splice(index, 1);
				}
			} else {
				if (remoteListenerCount) {
					_.each(listeners[iType], function(el) {
						if (el.s === 'remote' || el.s === 'all') {
							remoteListenerCount = Math.max(remoteListenerCount - 1, 0);
						}
					});

					if (!remoteListenerCount) {
						global.removeEventListener('storage', storageEventHandler, false);
					}
				}

				delete listeners[iType];
			}
		}
	}

	// requires context
	// returns event id

	function trigger(iType, iMessage) {
		var key = windowKeyName + (incrementor++);
		var datetime = new Date();

		if (this.canEmitRemotely()) {
			snorkel.set(key, {
				// incrementor: ++incrementor,
				datetime: datetime,
				type: iType,
				message: iMessage
			});

			//1// localStorage.removeItem(key); // don't incur unnecessary overhead for snorkel features we don't need
			snorkel.remove(key); //1// HMM 2014-04-20: need to use snorkel now due to namespacing
		}

		if (this.canEmitLocally()) {
			emitLocally(iType, iMessage, datetime, false, key);
		}

		return key;
	}

	// requires context

	function canEmitLocally(iCanEmitLocally) {
		if (arguments.length) {
			this._l = iCanEmitLocally;
		}

		return this._l;
	}

	// requires context

	function canEmitRemotely(iCanEmitRemotely) {
		if (arguments.length) {
			this._r = iCanEmitRemotely;
		}

		return this._r;
	}

	// initializes and returns a originEvents context

	function init(iCanEmitLocally, iCanEmitRemotely) {
		var r = {};

		r.version = VERSION;

		r.on = on;
		r.off = off;
		r.trigger = trigger;
		r.canEmitLocally = canEmitLocally;
		r.canEmitRemotely = canEmitRemotely;

		r.canEmitLocally(_.isUndefined(iCanEmitLocally) || iCanEmitLocally);
		r.canEmitRemotely(_.isUndefined(iCanEmitRemotely) || iCanEmitRemotely);

		if (!snorkel) {
			snorkel = true;
			snorkel = snorkelInit(false, false); // not using snorkel events
		}

		return r;
	}

	originEventsInit = init;

}).call(this);
