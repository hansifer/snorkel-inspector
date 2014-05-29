(function() {
	var d = dabInit();
	var dd = domDabInit();
	var defaultNamespace = 'snorkel-demo';

	var settings = snorkelInit('snorkel-demo-settings', true, true);
	var s = snorkelInit(namespaceCurrent(), true, true);
	s.defaultTransform('mget', trans_get_table);

	var dontReset;

	settings.on(function(iEventType, iKey, iVal, iOldValue, isRemoteEvent) {
		refreshOptions(iVal);
		refreshSnorkelTable();
		refreshIframeHeight();
	}, 'indent');

	settings.on(function(iEventType, iKey, iVal, iOldValue, isRemoteEvent) {
		if (iKey === 'namespace') {
			if (s) {
				s.namespace(iVal);
			}
		}
		refreshNamespaceSelect(iKey === 'namespace' ? iVal : undefined, iKey === 'namespaces' ? iVal : undefined);
		refreshSnorkelData();
	}, /^namespaces?$/);

	settings.on(function(iEventType, iKey, iVal, iOldValue, isRemoteEvent) {
		refreshSearchType(iVal);
		refreshSnorkelData();
	}, 'searchType');

	s.on(function(iEventType, iKey, iVal, iOldValue, isRemoteEvent) {
		// console.log(iEventType, iKey, iVal, iOldValue, isRemoteEvent);

		switch (iEventType) {
			case 'added':
				refreshSnorkelData(undefined, iKey);
				scrollToRow(iKey);
				break;
			case 'removed':
				findTableRows(iKey).hide();
				refreshKeyInputWidth();
				refreshSnorkelSummary();
				if ($('#snorkel-table tr:visible').length < 2) {
					showNoData();
				}
				refreshIframeHeight();
				break;
			case 'updated':
				var iEl = findTableRows(iKey).find('.snorkel-val');

				if (isRemoteEvent /*&& iEl.length && iEl[0] !== document.activeElement*/ ) {
					resetSnorkelValueCell(iKey, iEl);
				}
				refreshIframeHeight();
				break;
		}
	});

	function init() {

		// define internal css rules for syntax coloring

		var syntaxStyles = '';
		_.each(d.typeColor, function(v, k) {
			syntaxStyles += '.' + k + '{\ncolor:' + v + ';\n}\n';
		});

		$('#syntax').text(syntaxStyles);

		$('#origin').html(dd.origin());

		refreshSearchType();

		refreshNamespaceSelect();

		$('#input-key').val(genAlphaKey());

		refreshOptions();

		refreshSnorkelData();
	}


	// --- FUNCTIONALITY ---

	function addSnorkelItem(k, v) {
		if (s.exists(k)) {
			throw 'key exists';
		}

		return s.set(k, v);
	}

	function updateSnorkelItem(k, v) {
		if (!s.exists(k)) {
			throw 'key does not exist';
		}

		return s.set(k, v);
	}

	function removeSnorkelItem(k) {
		return s.remove(k);
	}

	function snorkelClear(iSnorkelObject) {
		iSnorkelObject.clear();
		return true;
	}

	function snorkelClearCurrent() {
		return snorkelClear(s);
	}

	function removeNamespace(iNamespace) {
		settings.set('namespaces', _.without(settings.get('namespaces', []), iNamespace));

		if (iNamespace === namespaceCurrent()) {
			namespaceCurrent(defaultNamespace);
		}

		return true;
	}

	function removeNamespaceCurrent() {
		return removeNamespace(namespaceCurrent());
	}

	function addNamespace(iNamespace) {
		if (settings.validNamespace(iNamespace) && iNamespace !== defaultNamespace) {
			settings.set('namespaces', d.pushUnique(settings.get('namespaces', []), iNamespace));
			return true;
		}
	}

	function namespaceCurrent(iNamespace) {
		if (settings.validNamespace(iNamespace) && (_.contains(settings.get('namespaces', []), iNamespace) || iNamespace === defaultNamespace)) {
			return settings.set('namespace', iNamespace);
		}

		return settings.get('namespace', defaultNamespace);
	}

	function searchTypeCurrent(iSearchType) {
		if (arguments.length) {
			if (iSearchType !== 'filter') {
				iSearchType = 'highlight';
			}

			return settings.set('searchType', iSearchType);
		}

		return settings.get('searchType', 'filter');
	}

	function indentCurrent(iIndent) {
		if (arguments.length) {
			return settings.set('indent', !! iIndent);
		}

		return settings.get('indent', false);
	}

	// --- EVENTS ---

	$('#input-key, #input-val').on('keydown', function(e) {
		if (e.keyCode === 13) {
			processInputAddSnorkelItem();
		}
	});

	$('#btn-add').on('click', function() {
		processInputAddSnorkelItem();
	});

	$('#input-search').on('keyup', function(e) {
		if (searchTypeCurrent() === 'filter') {
			refreshSnorkelData(e.currentTarget.value);
		} else {
			// refreshSnorkelData(undefined, e.currentTarget.value);

			var reHighlightKey;
			if ($('#input-search').val()) {
				reHighlightKey = new RegExp(d.escapeRegExp($('#input-search').val()));
			}

			$('#snorkel-data-box tr').each(function(i, el) {
				if (reHighlightKey && reHighlightKey.test($(el).data('key'))) {
					$(el).addClass('row-highlight');
				} else {
					$(el).removeClass('row-highlight');
				}
			});
		}
	});

	$('#remove-namespace').on('click', function() {
		if (namespaceCurrent() !== defaultNamespace) {
			confirmRemoveNamespaceCurrent();
		}
	});

	$('#input-namespace-new').on('keyup', function(e) {
		if (e.keyCode === 13) {
			processInputAddNamespace();
		} else {
			if (settings.validNamespace($(this).val().trim())) {
				$('#btn-accept-namespace').removeAttr('disabled');
			} else {
				$('#btn-accept-namespace').attr('disabled', 'disabled');
			}

			$(this).css('background-color', '').css('outline-color', '');
		}
	});

	$('#btn-accept-namespace').on('click', function() {
		processInputAddNamespace();
	});

	$('#modal-error').on('hidden.bs.modal', function(e) {
		setTimeout(function() {
			$(e.currentTarget).data('focusInput').select();
		});
	});

	$('#modal-confirm').on('shown.bs.modal', function(e) {
		$('#btn-accept-confirm').focus();
	});

	$('#modal-namespace').on('shown.bs.modal', function(e) {
		$('#input-namespace-new').val('').focus();
	});

	$('#modal-error').on('shown.bs.modal', function(e) {
		$('#btn-accept-error').focus();
	});

	$('#modal-snorkel-update-error').on('shown.bs.modal', function(e) {
		$('#btn-edit-snorkel-update-error').focus();
	});

	$('#modal-key-exists').on('shown.bs.modal', function(e) {
		$('#btn-overwrite-key-exists').focus();
	});

	function whichTransitionEvent() {
		var t;
		var el = document.createElement('fakeelement');
		var transitions = {
			'transition': 'transitionend',
			'OTransition': 'oTransitionEnd',
			'MozTransition': 'transitionend',
			'WebkitTransition': 'webkitTransitionEnd'
		};

		for (t in transitions) {
			if (el.style[t] !== undefined) {
				return transitions[t];
			}
		}
	}

	$('#snorkel-data-box').delegate('.table-container', 'mousewheel', function(e) {
		dd.suppressParentScroll(e);	
	});

	$('#snorkel-data-box').delegate('tr', whichTransitionEvent(), function(e) {
		$(e.currentTarget).css('-webkit-transition', '').css('transition', '');
	});

	$('#snorkel-data-box').delegate('td:nth-of-type(2)', 'mousedown', function(e) {
		if (e.which !== 1) {
			e.preventDefault();
			return;
		}

		if (document.activeElement === $(e.currentTarget).find('.snorkel-val')[0]) {
			if (e.target === e.currentTarget) {
				dd.moveCursorToEnd(document.activeElement);
				e.preventDefault();
			}
		} else {
			e.stopPropagation();
			e.preventDefault();

			setTimeout(function() {
				$(e.currentTarget).find('.snorkel-val').focus();
			});
		}
	});

	$('#snorkel-data-box').delegate('.snorkel-val', 'focus', function(e) {
		// console.log(e);
		if (dontReset) {
			dontReset = false;
		} else {
			e.currentTarget.textContent = editableValue(s.get($(e.currentTarget).closest('tr').data('key')));

			$(e.currentTarget).css('color', '#000');
			setBorder($(e.currentTarget), 'active');
		}

		dd.selectElementContents(e.currentTarget);
	});

	$('#snorkel-data-box').delegate('.snorkel-val', 'blur', function(e) {
		var $el = $(e.currentTarget);
		var key = $el.closest('tr').data('key');

		if (processInputUpdateSnorkelItem(key, $el)) {
			resetSnorkelValueCell(key, $el);
		}
	});

	$('#snorkel-data-box').delegate('.snorkel-val', 'keydown', function(e) {
		var $el = $(e.currentTarget);
		if (e.keyCode === 27) { // escape
			if (editableValue(s.get($el.closest('tr').data('key'))) === $el.text()) {
				$el.blur();
			} else {
				$el.text(editableValue(s.get($el.closest('tr').data('key'))));
				dd.selectElementContents(e.currentTarget);
				unsetBorder($el, 'error');
			}
		} else if (e.keyCode === 13 && !e.shiftKey) { // enter
			$el.blur();
		}
	});

	$('#modal-snorkel-update-error').on('hidden.bs.modal', function(e) {
		if ($(e.currentTarget).data('key')) { // presence of key implies "discard"
			// resetSnorkelValueCell($(e.currentTarget).data('key'), $(e.currentTarget).data('focusInput'));
			$(e.currentTarget).data('focusInput').focus();
			unsetBorder($(e.currentTarget).data('focusInput'), 'error');
		} else {
			setBorder($(e.currentTarget).data('focusInput'), 'error');
			dontReset = true;
			$(e.currentTarget).data('focusInput').focus();
		}
	});

	$('#btn-edit-snorkel-update-error').on('click', function() {
		$('#modal-snorkel-update-error').data('key', '');
		$('#modal-snorkel-update-error').modal('hide');
	});

	$('#btn-suggest-key-exists').on('click', function() {
		$('#modal-key-exists').modal('hide');

		var suggestedKey = suggestKey($('#modal-key-exists').data('key'));
		addSnorkelItem(suggestedKey, $('#modal-key-exists').data('val'));

		if ($('#modal-key-exists').data('keyInput')) {
			$('#modal-key-exists').data('keyInput').val(suggestKey(suggestedKey));
			$('#modal-key-exists').data('keyInput', ''); // for modal hidden event
		}
	});

	$('#btn-overwrite-key-exists').on('click', function() {
		$('#modal-key-exists').modal('hide');
		s.set($('#modal-key-exists').data('key'), $('#modal-key-exists').data('val'));
		resetSnorkelValueCell($('#modal-key-exists').data('key'));
		flashRow(scrollToRow($('#modal-key-exists').data('key')));

		if ($('#modal-key-exists').data('keyInput')) {
			$('#modal-key-exists').data('keyInput').val(suggestKey($('#modal-key-exists').data('key')));
			$('#modal-key-exists').data('keyInput', ''); // for modal hidden event
		}
	});

	$('#modal-key-exists').on('hidden.bs.modal', function(e) {
		if ($('#modal-key-exists').data('keyInput')) {
			$('#modal-key-exists').data('focusInput', $('#modal-key-exists').data('keyInput'));
		}

		setTimeout(function() {
			$(e.currentTarget).data('focusInput').select();
		});
	});

	$('#btn-accept-confirm').on('click', function(e) {
		if ($('#modal-confirm').data('acceptConfirm')()) {
			$('#modal-confirm').modal('hide');
		}
	});

	$('#btn-clear').on('click', function() {
		confirmSnorkelClearCurrent();
	});

	$('#menuitem-filter-by-key').on('click', function() {
		searchTypeCurrent('filter');
	});

	$('#menuitem-highlight-by-key').on('click', function() {
		searchTypeCurrent('highlight');
	});

	$('#menuitem-options-indent').on('click', function() {
		indentCurrent(!indentCurrent());
	});

	$('#snorkel-data-box').on('click', 'td:last-child', function(e) {
		removeSnorkelItem($(this).parent().data('key'));

		// if (r && r.hasOwnProperty($(this).parent().data('key'))) {
		// 	$(this).parent().hide();
		// }
	});

	$('#snorkel-data-box').on('mouseover', 'td:last-child', function(e) {
		$(e.currentTarget).closest('tr').addClass('row-remove-warn');
	});

	$('#snorkel-data-box').on('mouseout', 'td:last-child', function(e) {
		$(e.currentTarget).closest('tr').removeClass('row-remove-warn');
	});

	// --- UI ---

	function refreshSearchType(iSearchType) {
		if (_.isUndefined(iSearchType)) {
			iSearchType = searchTypeCurrent();
		}

		if (iSearchType === 'filter') {
			$('#menuitem-filter-by-key').addClass('active');
			$('#menuitem-highlight-by-key').removeClass('active');
			setSearchPlaceholder('filter by key');
		} else {
			$('#menuitem-highlight-by-key').addClass('active');
			$('#menuitem-filter-by-key').removeClass('active');
			setSearchPlaceholder('highlight by key');
		}
	}

	function refreshNamespaceSelect(iNamespace, iNamespaces) {
		if (_.isUndefined(iNamespace)) {
			iNamespace = namespaceCurrent();
		}

		if (_.isUndefined(iNamespaces)) {
			iNamespaces = settings.get('namespaces', []);
		}

		$('#select-namespace > ul.dropdown-menu').html('');

		_.each(_.sortBy(_.uniq(iNamespaces.concat(defaultNamespace))), function(el) {
			if (iNamespace === el) {
				popNamespaceSelect(el, true);

				$('#select-namespace > a > span:first-child').text(el);

				if (el === defaultNamespace) {
					$('#remove-namespace').hide();
				} else {
					$('#remove-namespace').show();
				}
			} else {
				popNamespaceSelect(el, undefined, function() {
					namespaceCurrent(el);
				});
			}
		});

		$('<li role="presentation" class="divider"></li>').appendTo($('#select-namespace > ul.dropdown-menu'));

		popNamespaceSelect('New...', undefined, function() {
			showAddNamespaceModal();
		});
	}

	function refreshSnorkelData(iFilterTxt, iFlashKeys) {
		refreshKeyInputWidth();
		refreshSnorkelTable(iFilterTxt, iFlashKeys);
		refreshSnorkelSummary(undefined, undefined, iFilterTxt);
		refreshIframeHeight();
	}

	function refreshIframeHeight() {
		if (window.resetIframeHeight) {
			window.resetIframeHeight($("#snorkel-data-box").height());
		} else if (window.postMessage) {
			// console.log('posting reset iframe height');
			window.postMessage({
				type: 'resetIframeHeight',
				dataBoxHeight: $('#snorkel-data-box').height()
			}, '*');
		}
	}

	window.refreshIframeHeight = refreshIframeHeight;

	window.addEventListener('message', function(event) {
		// only accept messages from ourselves
		if (event.source !== window.parent.window) {
			return;
		}

		if (event.data.type && (event.data.type === 'refreshIframeHeight')) {
			// console.log('refreshing iframe height');
			refreshIframeHeight();
		}
	}, false);

	function refreshKeyInputWidth() {
		var el = document.getElementById('wrapper-input-key');

		if (el) {
			el = el.childNodes[0];
		}

		if (el && el.nodeType === 1) {
			el.textContent = _.reduce(s.keys(), function(memo, el) {
				if (el.length > memo.length) {
					return el;
				} else {
					return memo;
				}
				return Math.max(el.length, memo);
			}, '*');
		}
	}

	function refreshOptions(iIndent) {
		if (_.isUndefined(iIndent)) {
			iIndent = indentCurrent();
		}

		if (iIndent) {
			$('#menuitem-options-indent').addClass('active');
		} else {
			$('#menuitem-options-indent').removeClass('active');
		}
	}

	function refreshSnorkelTable(iFilterTxt, iFlashKeys) {
		if (_.isUndefined(iFilterTxt) && searchTypeCurrent() === 'filter') {
			iFilterTxt = $('#input-search').val();
		}

		var table = s.mget(iFilterTxt ? new RegExp(d.escapeRegExp(iFilterTxt)) : undefined, undefined, {
			sorted: true
		});

		if (table) {
			$('#snorkel-data-box').html($('<div class="table-container">').html(table));

			findTableRows(iFlashKeys).each(function() {
				flashRow($(this));
			});
		} else {
			showNoData();
		}
	}

	function refreshSnorkelSummary(iTotalItemCount, iDisplayedItemCount, iFilterTxt) {
		if (_.isUndefined(iTotalItemCount) && _.isUndefined(iDisplayedItemCount)) {
			if (_.isUndefined(iFilterTxt) && searchTypeCurrent() === 'filter') {
				iFilterTxt = $('#input-search').val();
			}

			iTotalItemCount = s.size();

			if (iFilterTxt) {
				iDisplayedItemCount = s.size(new RegExp(d.escapeRegExp(iFilterTxt)));
			}
		}

		if (_.isUndefined(iTotalItemCount) || _.isUndefined(iDisplayedItemCount)) {
			if (iTotalItemCount || iDisplayedItemCount) {
				$('#summary').html((iTotalItemCount || iDisplayedItemCount) + ' item' + ((iTotalItemCount || iDisplayedItemCount) !== 1 ? 's' : ''));
			} else {
				$('#summary').html('');
			}
		} else if (iTotalItemCount) {
			$('#summary').html('Showing ' + (iDisplayedItemCount === iTotalItemCount ? 'all' : iDisplayedItemCount) + ' of ' + iTotalItemCount + ' item' + (iTotalItemCount !== 1 ? 's' : ''));
		}
	}

	function showAddNamespaceModal() {
		setTimeout(function() {
			$('#btn-accept-namespace').attr('disabled', 'disabled');
			$('#modal-namespace').modal();
		}, 17);
	}

	function showErrorModal(iErrorDescription, iFocusInput) {
		setTimeout(function() {
			$('#modal-error').data('focusInput', iFocusInput || document.activeElement);
			$('#modal-error').find('.modal-body').text(iErrorDescription);
			$('#modal-error').modal();
		}, 17);
	}

	function showSnorkelUpdateErrorModal(iKey, iErrorDescription, iFocusInput) {
		setTimeout(function() {
			$('#modal-snorkel-update-error').data('focusInput', iFocusInput || document.activeElement).data('key', iKey);
			$('#modal-snorkel-update-error').find('.modal-body').text(iErrorDescription);
			$('#modal-snorkel-update-error').modal();
		}, 17);
	}

	function showKeyExistsModal(iKey, iVal, iFocusInput, iKeyInput) {
		setTimeout(function() {
			$('#modal-key-exists').data('keyInput', iKeyInput || $('#input-key')).data('key', iKey).data('val', iVal).data('focusInput', iFocusInput || document.activeElement);
			$('.label-heavy').text(iKey);
			$('#modal-key-exists').modal();
		}, 17);
	}

	function confirmRemoveNamespaceCurrent() {
		setModalConfirm('Remove namespace<div><span class="label-heavy">' + namespaceCurrent() + '</span>?</div>', removeNamespaceCurrent);
		confirm();
	}

	function confirmSnorkelClearCurrent() {
		setModalConfirm('Clear all data for namespace<div><span class="label-heavy">' + namespaceCurrent() + '</span>?</div>', snorkelClearCurrent);
		confirm();
	}

	function processInputAddNamespace() {
		var namespaceInput = $('#input-namespace-new');

		if (addNamespace(namespaceInput.val().trim())) {
			$('#modal-namespace').modal('hide');
			namespaceCurrent(namespaceInput.val().trim());
		} else {
			namespaceInput.focus().select();
			namespaceInput.css('background-color', 'hsl(0, 100%, 92%)').css('outline-color', 'hsl(0, 67%, 51%)');
		}
	}

	function processInputAddSnorkelItem() {
		var focusedInput = document.activeElement === $('#input-key')[0] ? $('#input-key') : $('#input-val');

		var val;
		try {
			val = interpretValueInput($('#input-val').val());
		} catch (ex) {
			showErrorModal(ex, $('#input-val'));
			return;
		}

		var itemKeyInputValue = $('#input-key').val();

		try {
			addSnorkelItem(itemKeyInputValue, val);
		} catch (ex) {
			if (ex === 'key exists') {
				showKeyExistsModal(itemKeyInputValue, val, focusedInput, $('#input-key'));
			} else {
				showErrorModal(ex, $('#input-val'));
			}
			return;
		}

		$('#input-key').val(suggestKey(itemKeyInputValue));

		focusedInput.select();
	}

	function processInputUpdateSnorkelItem(iKey, iEl) {
		var val;

		try {
			val = interpretValueInput(iEl.text());

			if (s.get(iKey) !== val) {
				updateSnorkelItem(iKey, val);
			}

			return true;
		} catch (ex) {
			showSnorkelUpdateErrorModal(iKey, ex, iEl);
		}
	}

	function showNoData() {
		$('#snorkel-data-box').html('<div class="no-data">no data</div>');
	}

	// --- HELPERS ---

	// snorkel mget transformation 

	function trans_get_table(keys, values) {
		if (keys.length) {
			var reHighlightKey;
			if (searchTypeCurrent() === 'highlight' && $('#input-search').val()) {
				reHighlightKey = new RegExp(d.escapeRegExp($('#input-search').val()));
			}

			var table = $('<table id="snorkel-table">');
			var row;

			// table.append('<thead><tr><th style="position:absolute;top:-7px;left:10px;"><div>Key</div></th></tr><tr><th style="width:58px;"></th><th style="position:absolute;top:-7px;padding-left:3px;">Value</th><th></th></tr></thead>');

			table.append('<tr><td>Key</td><td>Value</td><td></td></tr>');

			_.each(keys, function(k, i) {
				row = $('<tr>').appendTo(table).data('key', k);

				if (reHighlightKey && reHighlightKey.test(k)) {
					row.addClass('row-highlight');
				}

				$('<td>').appendTo(row).text(k);

				$('<span class="snorkel-val" contenteditable="true" spellcheck="false" draggable="false">').appendTo($('<td>').appendTo(row)).html(displayValue(values[i]));

				$('<td>').appendTo(row).html('<span class="fa fa-times"></span>');
			});

			return table;
		}
	}

	function displayValue(iVal) {
		return d.stringify(iVal, itemTrans_html, {
			indent: indentCurrent() * 3 // convert bool to: 0 or 3
		});
	}

	function editableValue(iVal) {
		if (_.isFunction(iVal)) {
			return iVal.toString(); // b/c stringify() abbreviates body
		} else if (_.isDate(iVal)) {
			return 'new Date("' + iVal.toISOString() + '")';
		}

		return d.stringify(iVal, itemTrans_edit, {
			indent: indentCurrent() * 3 // convert bool to: 0 or 3
		});
	}

	// custom item transform b/c we need to escape strings

	function itemTrans_edit(iNonComposite) {
		if (_.isString(iNonComposite)) {
			return '"' + d.escapeJSON(iNonComposite) + '"';
		}

		// if (_.isFunction(iNonComposite)) {
		// 	var arr = /(function\s*\w*\()([^\)]*)\)/.exec(iNonComposite.toString());
		// 	return arr[1] + arr[2].replace(/\s/g, '').replace(/,/g, ', ') + '){ ... }';
		// }

		if (_.isDate(iNonComposite)) {
			return iNonComposite.toISOString();
		}

		return iNonComposite + '';
	}

	function itemTrans_html(item) {
		var txt = d.stringify(item);

		if (_.isString(item)) {
			txt = txt.replace(/ /g, '·'); // &#183;
		}

		return '<span class="' + d.type(item) + '">' + d.escapeHTML(txt) + '</span>';
	}

	function confirm() {
		$('#modal-confirm').modal();
	}

	function setModalConfirm(iContent, iAcceptFct) {
		$('#modal-confirm').find('.modal-body').html('<div style="padding:7px;">' + iContent + '</div>');
		$('#modal-confirm').data('acceptConfirm', iAcceptFct);
	}

	function popNamespaceSelect(iNamespace, iActive, iOnClickFct, iEl) {
		var el = $('<li>').attr('role', 'presentation');

		if (iActive) {
			el.attr('class', 'active');
		}

		(iEl || $('#select-namespace > ul.dropdown-menu')).append(el);

		el = $('<a>').attr('role', 'menuitem').attr('tabindex', '-1').text(iNamespace).appendTo(el);

		if (iOnClickFct) {
			el.on('click', iOnClickFct);
		}
	}

	function setSearchPlaceholder(iPlaceholder) {
		$('#input-search').attr('placeholder', iPlaceholder);
	}

	function interpretValueInput(iStr) {
		// consider demo shortcuts first

		if (iStr.trim() === '') {
			iStr = 'undefined';
		} else if (iStr.trim()[0] === '@') {
			iStr = iStr.substring(1);

			switch (iStr.trim().toLowerCase()) {
				case '':
				case 'now':
					return new Date();
			}

			iStr = 'new Date(' + iStr + ')';
		}

		//TODO: use something like JSandbox to eval input

		// return Function('return ' + iStr)();

		return (function(a) {
			var iStr; // hide closured iStr (in case input is "iStr")
			var r;
			eval('r=' + a); // provides cleaner js err than Function approach
			return r;
		}(iStr));
	}

	function suggestKey(iKey) {
		if ($.isNumeric(iKey)) {
			return genIntKey(iKey);
		}

		return genAlphaKey();
	}

	function genIntKey(iStartInt) {
		var keys = s.keys();
		while (_.contains(keys, iStartInt + '')) {
			iStartInt -= -1; // minus prevents string concat
		}

		return iStartInt;
	}

	var genAlphaKey = function() {
		var alphaKeyGen = new d.StringGenerator();

		return function() {
			var k, keys = s.keys();
			while (_.contains(keys, k = alphaKeyGen.next())) {}
			return k;
		};
	}();

	function resetSnorkelValueCell(iKey, iEl) {
		if (!iEl) {
			iEl = findTableRows(iKey).find('.snorkel-val');
		}
		iEl.html(displayValue(s.get(iKey)));
		iEl.css('color', '');
		unsetBorder(iEl, 'active');
		unsetBorder(iEl, 'error');
	}

	function findTableRows(iKeys) {
		if (_.isUndefined(iKeys)) {
			return $();
		} else if (!_.isArray(iKeys)) {
			iKeys = [iKeys];
		}

		return $('#snorkel-table tr').filter(function() {
			return _.contains(iKeys, $(this).data('key'));
		});
	}

	function closestVisibleRow(iEl) {
		if (!iEl.is('tr')) {
			iEl = iEl.closest('tr');
		}

		var prev = iEl.prevUntil(':visible');

		if (prev.length) {
			prev = prev.last().prev();
		} else {
			prev = iEl.prev();
		}

		return prev;
	}

	function setBorder(iEl, inBorderName) {
		addRemoveBorder(true, iEl, inBorderName);
	}

	function unsetBorder(iEl, inBorderName) {
		addRemoveBorder(false, iEl, inBorderName);
	}

	function addRemoveBorder(iAdd, iEl, inBorderName) {
		switch (inBorderName) {
			case 'error':
				addRemoveBorderClasses(iAdd, iEl, 'error-cell', 'error-cell-prev', 'error-cell-top', 'error-cell-next', 'error-cell-next-top');
				break;
			case 'active':
				addRemoveBorderClasses(iAdd, iEl, 'active-cell', 'active-cell-prev', 'active-cell-top', 'active-cell-next', 'active-cell-next-top');
				break;
		}
	}

	function addRemoveBorderClasses(iAdd, iEl, iCellClassname, iCellPrevClassname, iCellTopClassname, iCellNextClassname, iCellNextTopClassname) {
		var fct = iAdd ? $().addClass : $().removeClass;

		fct.call(iEl.closest('td'), iCellClassname);
		fct.call(iEl.closest('td').next(), iCellNextClassname);
		fct.call(iEl.closest('td').prev(), iCellPrevClassname);
		fct.call(closestVisibleRow(iEl).find('td:nth-child(2)'), iCellTopClassname);
		fct.call(closestVisibleRow(iEl).find('td:last-child'), iCellNextTopClassname);
	}

	function scrollToRow(iRow) {
		if (_.isElement(iRow)) {
			iRow = $(iRow);
		} else {
			iRow = findTableRows(iRow);
		}

		try {
			if (iRow.length) {
				iRow.scrollIntoView(undefined, undefined, undefined, parseInt($('.table-container').css('padding-top'), 10), parseInt($('#snorkel-data-box').css('padding-top'), 10));
			}
		} catch (ex) {}

		return iRow;
	}

	function flashRow(iRow) {
		iRow.css('background-color', 'hsl(208, 100%, 96%)');
		setTimeout(function() {
			iRow.css('background-color', '').css('-webkit-transition', '3s');
		}, 1000);
	}

	init();

}());
