var WebApp = function () {
    var myapp = {
        configs: {},
        callbacks: {},
        name: '',
        loaded: false
    };
    setTimeout('WebApp._config()', 500);

    return myapp;
}();

// Init
WebApp._config = function () {
    //document.body.addEventListener("click", function (e) { WebApp._dispatch("Body.click", e); });
    //document.body.addEventListener("dblclick", function (e) { WebApp._dispatch("Body.dblclick", e); });
    //document.body.addEventListener("mousedown", function (e) { WebApp._dispatch("Body.mousedown", e); });
    //document.body.addEventListener("mouseenter", function (e) { WebApp._dispatch("Body.mouseenter", e); });
    //document.body.addEventListener("mouseleave", function (e) { WebApp._dispatch("Body.mouseleave", e); });
    //document.body.addEventListener("mousemove", function (e) { WebApp._dispatch("Body.mousemove", e); });
    //document.body.addEventListener("mouseover", function (e) { WebApp._dispatch("Body.mouseover", e); });
    //document.body.addEventListener("mouseout", function (e) { WebApp._dispatch("Body.mouseout", e); });
    //document.body.addEventListener("mouseup", function (e) { WebApp._dispatch("Body.mouseup", e); });
    //document.body.addEventListener("keydown", function (e) { WebApp._dispatch("Body.keydown", e); });
    //document.body.addEventListener("keypress", function (e) { WebApp._dispatch("Body.keypress", e); });
    //document.body.addEventListener("keyup", function (e) { WebApp._dispatch("Body.keyup", e); });
    document.body.addEventListener("abort", function (e) { WebApp._dispatch("Body.abort", e); });
    document.body.addEventListener("error", function (e) { WebApp._dispatch("Body.error", e); });
    document.body.addEventListener("load", function (e) { WebApp._dispatch("Body.load", e); });
    document.body.addEventListener("resize", function (e) { WebApp._dispatch("Body.resize", e); });
    document.body.addEventListener("scroll", function (e) { WebApp._dispatch("Body.scroll", e); });
    window.onscroll = function (e) { WebApp._dispatch("Body.scroll", e); };
    document.body.addEventListener("unload", function (e) { WebApp._dispatch("Body.unload", e); });
    window.addEventListener("message", function (e) { WebApp._dispatch("Window.message", e); });
    document.addEventListener("offline", function (e) { WebApp._dispatch("Window.offline", e); });
    document.addEventListener("online", function (e) { WebApp._dispatch("Window.online", e); });

    if (window['configs'] === undefined) {
        WebApp._request('config.js', 'GET', 'JSON', null, function (configs) {
            WebApp.configs = configs;
            WebApp.name = WebApp._get_config('name') || WebApp.name;
            WebApp.loaded = true;
            WebApp._dispatch("WebApp.loaded");
        }, function () {
            WebApp._error('Can not load config.js');
            WebApp._dispatch("WebApp.unconfigured");
        });
    } else {
        WebApp.configs = configs;
        WebApp.loaded = true;
        WebApp.name = WebApp._get_config('name') || WebApp.name;
        WebApp._dispatch("WebApp.loaded");
    }
};

// Log
WebApp._debug = function (msg, info) {
    if (!WebApp._get_config('debug'))
        return;

    var stack = [];
    var tmp = arguments.callee.caller;
    while (tmp !== null) {
        stack.push(tmp.name !== "" ? tmp.name : "anonymous");
        tmp = tmp.arguments.callee.caller;
    }
    msg += "\n" + JSON.stringify(info) + "\n" + stack.join("\n");
    if (window.console)
        window.console.debug(msg);
};

WebApp._log = function (msg, info) {
    msg = msg.replace(/\n+/gi, "").replace(/\s+/gi, " ");
    if (WebApp.name !== '')
        msg = WebApp.name + " - " + msg;
    if (window.console && window.console.log)
        window.console.log(msg);
    WebApp._debug(msg, info);
};

WebApp._warn = function (msg) {
    if (WebApp.name !== '')
        msg = WebApp.name + " - " + msg;
    if (window.console)
        window.console.warn(msg);
    WebApp._debug(msg);
};

WebApp._error = function (msg) {
    if (WebApp.name !== '')
        msg = WebApp.name + " - " + msg;
    if (window.console)
        window.console.error(msg);
    else if (window.opera && window.opera.postError)
        window.opera.postError(msg);
    else if (window.alert)
        window.alert(msg);
};

// Utils
WebApp._get_config = function (key) {
    if (WebApp.configs && WebApp.configs[key])
        return WebApp.configs[key];
    return null;
};

WebApp._query_string = function () {
    var query_string = {};
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (typeof query_string[pair[0]] === "undefined") {
            query_string[pair[0]] = pair[1];
        } else if (typeof query_string[pair[0]] === "string") {
            var arr = [query_string[pair[0]], pair[1]];
            query_string[pair[0]] = arr;
        } else {
            query_string[pair[0]].push(pair[1]);
        }
    }
    return query_string;
}();

WebApp._clone = function (obj) {
    if (null === obj || "object" !== typeof obj)
        return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr))
            copy[attr] = obj[attr];
    }
    return copy;
};

/*
window.setIntervals = function (callback, period, n) {
  var i = 0, interval = setInterval(function () {
    if (i < n) {
      callback()
      i++
    } else {
      clearInterval(interval)
    }
  }, period)
}
 */

// Namespace
WebApp._extend = function (namespace, constructor) {
    constructor = constructor || null;
    var parts = namespace.split('.');
    var parent = WebApp;
    var pl, i;

    if (parts[0] === "WebApp")
        parts = parts.slice(1);

    pl = parts.length;
    for (i = 0; i < pl; i++) {
        if (typeof parent[parts[i]] === 'undefined')
            parent[parts[i]] = i + 1 === pl && constructor ? constructor() : {};

        parent = parent[parts[i]];
    }

    return parent;
};

// Events
WebApp._bind = function (event_name, callback) {
    WebApp._log("Binding " + event_name.toString());
    WebApp.callbacks[event_name] = WebApp.callbacks[event_name] || [];
    return WebApp.callbacks[event_name].push(callback) - 1;
};

WebApp._unbind = function (event_name, id) {
    WebApp._log("Unbinding " + event_name.toString());
    if (typeof WebApp.callbacks[event_name] === 'undefined'
        || typeof WebApp.callbacks[event_name][id] === 'undefined')
        return;
    WebApp.callbacks[event_name].splice(id, 1);
};

WebApp._listeners = function (event_name) {
    return WebApp.callbacks[event_name];
};

WebApp._has_listeners = function (event_name) {
    return WebApp.callbacks[event_name] !== undefined;
};

WebApp._dispatch = function (event_name, data) {
    data = data || null;
    if (event_name !== 'WebApp.event')
        WebApp._dispatch('WebApp.event', { event: event_name, data: data });

    WebApp._log("Dispatch " + event_name);

    var chain = WebApp.callbacks[event_name];

    if (typeof chain === 'undefined')
        return;

    if (chain.length === 1) {
        var func = typeof chain[0] === 'string' ? window[chain[0]] : chain[0];
        // this._debug("Dispatching " + chain[0]);
        setTimeout(function () {
            if (func)
                func(data);
        }, 10);
    } else
        setTimeout(function () {
            for (var i = 0; i < chain.length; i++) {
                var func = typeof chain[i] === 'string' ? window[chain[i]]
                    : chain[i];
                // parent._debug("Dispatching " + chain[0]);
                if (func)
                    func(data);
            }
        }, 10);

    return this;
};

WebApp._clear_callstack = function (func, data) {
    setTimeout(function () {
        if (func)
            func(data);
    }, 10);
};

// Request
WebApp._XMLHttp = function () {
    var xmlhttp = null;
    xmlhttp = new XMLHttpRequest();
    if (xmlhttp === null)
        xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
    if (xmlhttp === null)
        xmlhttp = new ActiveXObject("Msxml3.XMLHTTP");
    if (xmlhttp === null)
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");

    return xmlhttp;
};

WebApp._guid = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};

WebApp._request = function (url, method, type, data, success, error, user, pass) {
    var server = WebApp._XMLHttp();
    var nc = new Date().getTime();
    var uuid = WebApp._guid();
    var callback_error_id = WebApp._bind(uuid + "_error", error);
    var callback_success_id = WebApp._bind(uuid + "_success", success);

    WebApp._log("Request process: " + uuid + " " + url);

    //url += (url.indexOf('?') > -1 ? '&' : '?') + 'nocache=' + nc;
    data = data || null;

    if (server === null)
        return this._dispatch(uuid + "_error", 'Unable to create Server');

    /*
     * reqwest({ url: url , type: 'json' , method: method , data: postData ,
     * contentType: 'application/json' , crossOrigin: true , withCredentials:
     * false , error: error , success: function (resp) { callback(resp); } });
     * return;
     */

    server.open(method, url, true, user || null, pass || null);

    if (type === "JSON") {
        //if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1)
        //    server.setRequestHeader('Accept', 'application/json, text/javascript');
        //else
        //    server.setRequestHeader('Accept', 'application/json');
        server.setRequestHeader('Accept', 'application/json, application/javascript, text/javascript');
        if (data) {
            server.setRequestHeader('Content-Type', 'application/json');
            data = JSON.stringify(data);
            if (server.overrideMimeType !== null)
                server.overrideMimeType("application/json");
        }
    } else { // if (type === "HTML") {
        if (data) {
            server.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            if (server.overrideMimeType !== null)
                server.overrideMimeType("application/x-www-form-urlencoded");
        }
    }

    server.onreadystatechange = function () {
        // dispatch request.readystatechange
        WebApp._log("Request State change: " + uuid + " " + server.readyState);

        if (server.readyState === 4) {
            try {
                if (server.status !== 200 && server.status !== 304) {
                    WebApp._log("Request error: " + uuid + " " + server.status);
                    WebApp._dispatch(uuid + "_error", server.response);
                } else {
                    WebApp._log("Request result: " + uuid + " " + server.status, server.response);
                    var response = type === "JSON" ? eval("(" + server.response + ")") : server.response;
                    //var response = type === "JSON" ? JSON.parse(server.response) : server.response;
                    WebApp._dispatch(uuid + "_success", response);
                }
            } catch (e) {
                WebApp._log("Request error: " + uuid + " " + e);
                WebApp._dispatch(uuid + "_error", server);
            }
            WebApp._unbind(uuid + "_error", callback_error_id);
            WebApp._unbind(uuid + "_success", callback_success_id);
        }
    };
    server.send(data);
};

// Includes
WebApp._include_header = function (type, attributes) {
    var s = document.createElement(type);
    attributes = attributes || {};
    for (var i in attributes)
        s.setAttribute(i, attributes[i]);
    document.getElementsByTagName('head')[0].appendChild(s);
};

// inArray implementation - returns true if the value is within the
// array, false otherwise
if (!Array.prototype.inArray) {
    Array.prototype.inArray = function (value) {
        var i;
        for (i = 0; i < this.length; i++)
            if (this[i] === value)
                return true;

        return false;
    };
}

// indexOf implementation - returns the index of the element or -1
// if it can't be found
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (elt) {
        var len = this.length;

        for (from = 0; from < len; from++)
            if (from in this && this[from] === elt)
                return from;

        return -1;
    };
}

// String.Format implementation
String.prototype.format = function () {
    // store arguments in an array
    var args = arguments;
    // use replace to iterate over the string
    // select the match and check if related argument is present
    // if yes, replace the match with the argument
    return this.replace(/{([0-9]+)}/g, function (match, index) {
        // check if the argument is present
        return typeof args[index] == 'undefined' ? match : args[index];
    });
};

// Array.filter implementation
if (!Array.prototype.filter) {
    Array.prototype.filter = function (func, thisArg) {
        'use strict';
        if (!((typeof func === 'Function' || typeof func === 'function') && this))
            throw new TypeError();

        var len = this.length >>> 0,
            res = new Array(len), // preallocate array
            t = this, c = 0, i = -1;

        var kValue;
        if (thisArg === undefined) {
            while (++i !== len) {
                // checks to see if the key was set
                if (i in this) {
                    kValue = t[i]; // in case t is changed in callback
                    if (func(t[i], i, t)) {
                        res[c++] = kValue;
                    }
                }
            }
        }
        else {
            while (++i !== len) {
                // checks to see if the key was set
                if (i in this) {
                    kValue = t[i];
                    if (func.call(thisArg, t[i], i, t)) {
                        res[c++] = kValue;
                    }
                }
            }
        }

        res.length = c; // shrink down array to proper size
        return res;
    };
}

// Array.map implementation
if (!Array.prototype.map) {

    Array.prototype.map = function (callback, thisArg) {

        var T, A, k;

        if (this == null) {
            throw new TypeError(' this is null or not defined');
        }

        // 1. Let O be the result of calling ToObject passing the |this|
        //    value as the argument.
        var O = Object(this);

        // 2. Let lenValue be the result of calling the Get internal
        //    method of O with the argument "length".
        // 3. Let len be ToUint32(lenValue).
        var len = O.length >>> 0;

        // 4. If IsCallable(callback) is false, throw a TypeError exception.
        // See: http://es5.github.com/#x9.11
        if (typeof callback !== 'function') {
            throw new TypeError(callback + ' is not a function');
        }

        // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
        if (arguments.length > 1) {
            T = thisArg;
        }

        // 6. Let A be a new array created as if by the expression new Array(len)
        //    where Array is the standard built-in constructor with that name and
        //    len is the value of len.
        A = new Array(len);

        // 7. Let k be 0
        k = 0;

        // 8. Repeat, while k < len
        while (k < len) {

            var kValue, mappedValue;

            // a. Let Pk be ToString(k).
            //   This is implicit for LHS operands of the in operator
            // b. Let kPresent be the result of calling the HasProperty internal
            //    method of O with argument Pk.
            //   This step can be combined with c
            // c. If kPresent is true, then
            if (k in O) {

                // i. Let kValue be the result of calling the Get internal
                //    method of O with argument Pk.
                kValue = O[k];

                // ii. Let mappedValue be the result of calling the Call internal
                //     method of callback with T as the this value and argument
                //     list containing kValue, k, and O.
                mappedValue = callback.call(T, kValue, k, O);

                // iii. Call the DefineOwnProperty internal method of A with arguments
                // Pk, Property Descriptor
                // { Value: mappedValue,
                //   Writable: true,
                //   Enumerable: true,
                //   Configurable: true },
                // and false.

                // In browsers that support Object.defineProperty, use the following:
                // Object.defineProperty(A, k, {
                //   value: mappedValue,
                //   writable: true,
                //   enumerable: true,
                //   configurable: true
                // });

                // For best browser support, use the following:
                A[k] = mappedValue;
            }
            // d. Increase k by 1.
            k++;
        }

        // 9. return A
        return A;
    };
}