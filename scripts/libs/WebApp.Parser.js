/**
 * Parser implementation (https://github.com/dfsq/Ashe)
 */
var Parser = WebApp._extend('WebApp.Parser', function () {
	return {
		uid: 1,
		tokens: {},
		modifiers: {},
		// if (this.Modifiers)
		// this.Modifiers();
	};
});

WebApp._parse = function (section, element, data, event) {
	if (typeof element === 'string') {
		element = document.getElementById(element);
	}
	element = element || document.getElementById('wrapper');
	event = event || 'Parser.parsed';
	data = data || {};

	if (!element) {
		return;
	}

	section_file = this._get_config('templates_dir') || 'templates';
	section_file += '/' + section + ".html";

	if (this._get_config('debug')) {
		section_file += "?nc=" + new Date().getTime();
		section += "-" + new Date().getTime();
	}

	var doParse = function () {
		var template = document.getElementById('tpl-' + section);
		if (template && template.innerHTML && template.innerHTML !== "") {
			var parsed = WebApp.Parser._parse(template.innerHTML, data);
			element.innerHTML = parsed;

			if (typeof event === 'string') {
				WebApp._dispatch(event, data);
			} else if (typeof event === 'function') {
				event(data);
			}
		}
	};

	if (document.getElementById('tpl-' + section) === null) {
		var callback = function () {
			doParse();
		};
		this._log("Loading: " + section_file);
		this._load_section(section, section_file, callback);
	} else {
		doParse();
	}
};

WebApp._load_section = function (section, url, callback) {
	var server = WebApp._XMLHttp();
	server.open("GET", url);
	server.onprogress = function (e) {
		if (e.lengthComputable) {
			var ratio = Math.floor((e.loaded / e.total) * 100) + '%';
			var progressBar = document.getElementById('progress-bar');
			if (progressBar)
				progressBar.style.width = ratio;
			WebApp._log("Loaded: " + e.loaded + ' of ' + e.total + ' - ' + ratio);
		}
	}
	server.onloadstart = function (e) {
		var progressBar = document.getElementById('progress-bar');
		if (progressBar)
			progressBar.style.width = '0';
		WebApp._log("Loading: " + url);
	}
	server.onloadend = function (e) {
		var progressBar = document.getElementById('progress-bar');
		if (progressBar)
			progressBar.style.width = '100%';
		WebApp._log("Loaded: " + url);
	}
	server.onreadystatechange = function () {
		if (server.readyState !== 4)
			return;

		if (server.status === 200 || server.status === 304) {
			var s = document.createElement('script');
			s.id = "tpl-" + section;
			s.type = "html/template";
			s.innerHTML = server.response;
			document.getElementsByTagName('head')[0].appendChild(s);

			if (callback)
				callback();
			return;
		}
	};
	server.send(null);
};

/**
 * Run analysing and parsing.
 * 
 * @param {String}
 *                template Template string.
 * @param {Object}
 *                data Data passed to the template.
 */
Parser._parse = function (section, data) {
	this._reset();
	data = data || {};
	var tmp = this._proccessMarkers(section);
	tmp = this._proccessControls(tmp, 0);
	tmp = this._process(tmp, data);
	tmp = this._proccessTranslation(tmp);
	return tmp;
};

/**
 * Translate codes between {[ and ]}.
 */
Parser._proccessTranslation = function (str) {
	var i = 0;

	if (WebApp.translator) {
		str = this._trim(str);
		while ((i = str.indexOf('{[', i)) !== -1) {
			var end = str.indexOf(']}', i);
			var buffer = this._trim(str.slice(i + 2, end)).split('|');
			var repl = '';

			for (var j = 0; j < buffer.length; j++)
				repl += this.webApp.translator.translate(buffer[j]);

			str = this._replaceWith(str, repl, i, end + 2);
			i = i + repl.length;
		}
	}

	return str;
};

/**
 * Replace just markers between {{ and }}.
 */
Parser._proccessMarkers = function (str) {
	var i = 0;
	str = this._trim(str);

	while ((i = str.indexOf('{{', i)) !== -1) {
		var id = this.uid++;
		var end = str.indexOf('}}', i);
		var buffer = this._trim(str.slice(i + 2, end)).split('|');
		var repl = '{_' + id + '}';

		this.tokens[id] = {
			buffer: buffer.shift(),
			modif: buffer
		};

		str = this._replaceWith(str, repl, i, end + 2);
		i = i + repl.length;
	}

	return str;
};

/**
 * Replace control blocks, loops, conditions.
 */
Parser._proccessControls = function (str, i, lookingFor, exprDescr, inline) {
	var from = i;

	while ((i = str.indexOf('{%', i)) !== -1) {
		var id = this.uid++;
		var end = str.indexOf('%}', i);
		var expr = str.slice(i + 2, end);
		var repl = '{_' + id + '}';

		if (inline || (lookingFor && expr.match(lookingFor))) {
			var start = from - 2;
			end = i + expr.length + 4;

			this.tokens[id] = {
				buffer: this._trim(str.slice(start, end)),
				expr: exprDescr
			};

			return this._replaceWith(str, repl, start, end);
		} else {
			var m;
			if (m = expr
				.match(/\s*for\s+((?:\w+\s*,)?\s*\w+)\s+in\s+(.+?)\s*$/i)) {
				// For loop
				str = this._proccessControls(str, i + 2, /\s*endfor\s*/i, {
					type: 'for',
					elem: m[1],
					list: m[2]
				});
			} else if (m = expr.match(/\s*if\s+(.+)\s*/i)) {
				// If statement
				str = this._proccessControls(str, i + 2, /\s*endif\s*/i, {
					type: 'if',
					cond: this._trim(m[1])
				});
			} else if (m = expr.match(/\s*set\s+(\w+)(?:\s*=\s*(.*)?)?\s*/i)) {
				// Set expression
				var dat = {
					type: 'set',
					svar: m[1],
					sval: m[2]
				};
				str = m[2] ? this._proccessControls(str, i, null, dat, true)
					: this._proccessControls(str, i + 2, /\s*endset\s*/i,
						dat);
			} else if (m = expr.match(/\s*include\s+(.+)\s*/i)) {
				// Include statement
				str = this._proccessControls(str, i + 2, /\s*endinclude\s*/i, {
					type: 'include',
					section: this._trim(m[1])
				});
			}
		}
		i = i + repl.length;
	}

	return str;
};

/**
 * Recursive parsing method. Parse template string in context of provided object
 * data.
 * 
 * @param {String}
 *                str Template string.
 * @param {Object}
 *                data Data for template.
 */
Parser._process = function (str, data) {
	var Parser = this;
	var onProcess = function (a, b) {
		var token = Parser.tokens[b], repl, i;
		if (!token.expr) {
			repl = Parser._evl(data, Parser.tokens[b].buffer);

			for (var i = 0; i < token.modif.length; i++) {
				var modif = token.modif[i];
				var params = [];
				var check = token.modif[i].match(/(\w+)\(([\s\S]+)\)/);

				if (check) {
					modif = check[1];
					params = check[2].split(/\s*,\s*/);

					for (var jj = 0; jj < params.length; jj++) {
						params[jj] = Parser._evl(data, params[jj]);
					}
				}

				if (modif == 'fromData') {
					repl = data[repl] ? data[repl] : '';
				} else {
					params.unshift(repl);
					modif = Parser.modifiers[modif] || window[modif] || modif;

					if (typeof modif !== 'function') {
						if (repl[modif] === 'undefined')
							throw new Error('Ashe: Unknown modifier "' + token.modif[i] + '".');
						else {
							try {
								repl = repl[modif](params);
							} catch (e) {
								repl = params[0];
							}
						}
					} else {
						try {
							repl = modif.apply(this, params);
						} catch (e) {
							repl = params[0];
						}
					}
				}
			}

			return repl;
		} else {
			var block;
			switch (token.expr.type) {
				case 'if':
					var cond = false;
					var values = token.expr.cond.split(/[<>=!]+/);
					if (values.length === 2) {
						var oper = token.expr.cond.match(/[<>=!]+/);
						if (values[0].indexOf("'") === -1
							&& values[0].indexOf('"') === -1)
							cond = "'" + Parser._evl(data, values[0]) + "'";
						else
							cond = values[0];
						cond += (oper[0] ? oper[0] : '');
						if (values[1].indexOf("'") === -1
							&& values[1].indexOf('"') === -1)
							cond += "'" + Parser._evl(data, values[1]) + "'";
						else
							cond += values[1];
						cond = eval(cond + '?true:false');
					} else {
						cond = Parser._evl(data, token.expr.cond);
					}
					block = token.buffer
						.match(cond ? /\{%\s*if\s+.+?\s*%\}([\s\S]*?)\{%/i
							: /\{%\s*else\s*%\}([\s\S]*?)\{%/i);
					return block ? Parser._process(block[1], data) : '';
				case 'for':
					var loopData = Parser._evl(data, token.expr.list);
					if (typeof loopData === 'undefined') {
						if (Ashe.debug) {
							throw new Error('Ashe: Undefined list "'
								+ token.expr.list + '".');
						}
						return '';
					}

					if (Parser._hasElements(loopData)) {
						block = token.buffer
							.match(/\{%\s*for.*?\s*%\}([\s\S]*?)\{%/i);
						if (block) {
							var key;
							var k;
							var elem = token.expr.elem;
							var split = elem.split(/\s*,\s*/);
							var subStr = '';

							if (split.length === 2) {
								key = split[0];
								elem = split[1];
							}

							for (k in loopData) {
								if (loopData.hasOwnProperty(k)) {
									// var tmpObj = {};
									// if (key)
									// tmpObj[key] = k;
									// tmpObj[elem] = loopData[k];
									// subStr += Parser.process(block[1], tmpObj);
									if (key)
										data[key] = k;
									data[elem] = loopData[k];
									subStr += Parser._process(block[1], data);
								}
							}
							return subStr;
						}
						return '';
					} else {
						block = token.buffer
							.match(/\{%\s*else\s*%\}([\s\S]*?)\{%/i);
						return block ? Parser._process(block[1], loopData) : '';
					}
					;
				case 'set':
					var t = token.expr;
					var v = t.sval ? Parser._evl(data, t.sval) : Parser._process(
						token.buffer.replace(/\{%.*?%\}/g, ''), data);
					data[t.svar] = v;
					return '';
				case 'include':
					var parser = WebApp._clone(WebApp.Parser);
					parser._reset();

					if (document.getElementById('tpl-' + token.expr.section) === null) {
						var replacement = 'replace_' + token.expr.section + '_'
							+ new Date().getTime();
						var callback = function () {
							var template = document.getElementById('tpl-'
								+ token.expr.section);
							if (template && template.innerHTML
								&& template.innerHTML !== "") {
								var parsed = parser
									._parse(template.innerHTML, data);
								if (parsed) {
									var replaced = document.querySelectorAll('#'
										+ replacement);
									for (var i = 0; i < replaced.length; i++) {
										var container = replaced[i].parentElement;
										container.innerHTML = container.innerHTML
											.replace(
												'<div style="display:none;" id="'
												+ replacement
												+ '"></div>',
												parsed);
										if (WebApp.UI)
											WebApp.UI._initialize(container);
									}
								}
							}
						};
						WebApp._log("Loading Section: sections/"
							+ token.expr.section);
						// WebApp._load_section(token.expr.section, "sections/" +
						// token.expr.section + ".html" +
						// (Parser.webApp.configs.debug ? "?nc=" + new
						// Date().getTime() : ''), callback);
						WebApp._load_section(token.expr.section, "sections/"
							+ token.expr.section + ".html", callback);
						return '<div style="display:none;" id="' + replacement
							+ '"></div>';
					} else {
						var parsed = parser._parse(token.expr.section, data);
						return parsed ? parsed : '';
					}
			}
		}
	};
	return str.replace(/\{_(\d+?)\}/g, onProcess);
};

/**
 * Trim whitespaces.
 */
Parser._trim = function (s) {
	return s.replace(/^\s*|\s*$/g, '');
};

/**
 * Replace specified part of string.
 */
Parser._replaceWith = function (str, replace, start, end) {
	return str.substr(0, start) + replace + str.substr(end);
};

/**
 * Resolve variables from the data scope.
 */
Parser._evl = function (data, buffer) {
	var check = buffer.match(/["|']([^"']+)["|']/);
	if (check) {
		return check[1];
	}

	// var parts = ~buffer.indexOf('.') ? buffer.split('.') : [buffer];
	var parts = buffer.trim().split('.');
	var l = parts.length;
	var ret = data;
	var tmp_ret;
	var i = 0

	if (parts[0] === 'WebApp') {
		var ret = WebApp;
		i = 1;
	}

	for (; i < l; i++) {
		ret = ret[parts[i]];
		if (typeof ret === 'undefined')
			return '';
	}

	try {
		tmp_ret = JSON.parse(ret);
	} catch (e) {
		tmp_ret = ret;
	}

	return typeof ret === 'function' ? ret.call(data) : (ret === JSON.stringify(tmp_ret) ? tmp_ret : (ret ? ret : ''));
};

/**
 * Check if array or object is empty.
 * 
 * @param {Array|Object}
 */
Parser._hasElements = function (obj) {
	if (obj.hasOwnProperty('length'))
		return !!obj.length;
	for (var k in obj) {
		if (obj.hasOwnProperty(k))
			return true;
	}
	return false;
};

/**
 * Need to flush closure vars before next parsing.
 */
Parser._reset = function () {
	this.uid = 1;
	this.tokens = {};
};

/**
 * Add new modifiers.
 */
Parser._addModifiers = function (obj) {
	for (var i in obj) {
		if (obj.hasOwnProperty(i))
			this.modifiers[i] = obj[i];
	}
};