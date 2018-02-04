(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (root, smoothScroll) {
  'use strict';

  // Support RequireJS and CommonJS/NodeJS module formats.
  // Attach smoothScroll to the `window` when executed as a <script>.

  // RequireJS
  if (typeof define === 'function' && define.amd) {
    define(smoothScroll);

  // CommonJS
  } else if (typeof exports === 'object' && typeof module === 'object') {
    module.exports = smoothScroll();

  } else {
    root.smoothScroll = smoothScroll();
  }

})(this, function(){
'use strict';

// Do not initialize smoothScroll when running server side, handle it in client:
if (typeof window !== 'object') return;

// We do not want this script to be applied in browsers that do not support those
// That means no smoothscroll on IE9 and below.
if(document.querySelectorAll === void 0 || window.pageYOffset === void 0 || history.pushState === void 0) { return; }

// Get the top position of an element in the document
var getTop = function(element, start) {
    // return value of html.getBoundingClientRect().top ... IE : 0, other browsers : -pageYOffset
    if(element.nodeName === 'HTML') return -start
    return element.getBoundingClientRect().top + start
}
// ease in out function thanks to:
// http://blog.greweb.fr/2012/02/bezier-curve-based-easing-functions-from-concept-to-implementation/
var easeInOutCubic = function (t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1 }

// calculate the scroll position we should be in
// given the start and end point of the scroll
// the time elapsed from the beginning of the scroll
// and the total duration of the scroll (default 500ms)
var position = function(start, end, elapsed, duration) {
    if (elapsed > duration) return end;
    return start + (end - start) * easeInOutCubic(elapsed / duration); // <-- you can change the easing funtion there
    // return start + (end - start) * (elapsed / duration); // <-- this would give a linear scroll
}

// we use requestAnimationFrame to be called by the browser before every repaint
// if the first argument is an element then scroll to the top of this element
// if the first argument is numeric then scroll to this location
// if the callback exist, it is called when the scrolling is finished
// if context is set then scroll that element, else scroll window
var smoothScroll = function(el, duration, callback, context){
    duration = duration || 500;
    context = context || window;
    var start = context.scrollTop || window.pageYOffset;

    if (typeof el === 'number') {
      var end = parseInt(el);
    } else {
      var end = getTop(el, start);
    }

    var clock = Date.now();
    var requestAnimationFrame = window.requestAnimationFrame ||
        window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||
        function(fn){window.setTimeout(fn, 15);};

    var step = function(){
        var elapsed = Date.now() - clock;
        if (context !== window) {
          context.scrollTop = position(start, end, elapsed, duration);
        }
        else {
          window.scroll(0, position(start, end, elapsed, duration));
        }

        if (elapsed > duration) {
            if (typeof callback === 'function') {
                callback(el);
            }
        } else {
            requestAnimationFrame(step);
        }
    }
    step();
}

var linkHandler = function(ev) {
    if (!ev.defaultPrevented) {
        ev.preventDefault();

        if (location.hash !== this.hash) window.history.pushState(null, null, this.hash)
        // using the history api to solve issue #1 - back doesn't work
        // most browser don't update :target when the history api is used:
        // THIS IS A BUG FROM THE BROWSERS.
        // change the scrolling duration in this call
        var node = document.getElementById(this.hash.substring(1))
        if (!node) return; // Do not scroll to non-existing node

        smoothScroll(node, 500, function (el) {
            location.replace('#' + el.id)
            // this will cause the :target to be activated.
        });
    }
}

// We look for all the internal links in the documents and attach the smoothscroll function
document.addEventListener("DOMContentLoaded", function () {
    var internal = document.querySelectorAll('a[href^="#"]:not([href="#"])'), a;
    for(var i=internal.length; a=internal[--i];){
        a.addEventListener("click", linkHandler, false);
    }
});

// return smoothscroll API
return smoothScroll;

});

},{}],2:[function(require,module,exports){
/**
 * SVGInjector v1.1.3 - Fast, caching, dynamic inline SVG DOM injection library
 * https://github.com/iconic/SVGInjector
 *
 * Copyright (c) 2014-2015 Waybury <hello@waybury.com>
 * @license MIT
 */

(function (window, document) {

  'use strict';

  // Environment
  var isLocal = window.location.protocol === 'file:';
  var hasSvgSupport = document.implementation.hasFeature('http://www.w3.org/TR/SVG11/feature#BasicStructure', '1.1');

  function uniqueClasses(list) {
    list = list.split(' ');

    var hash = {};
    var i = list.length;
    var out = [];

    while (i--) {
      if (!hash.hasOwnProperty(list[i])) {
        hash[list[i]] = 1;
        out.unshift(list[i]);
      }
    }

    return out.join(' ');
  }

  /**
   * cache (or polyfill for <= IE8) Array.forEach()
   * source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
   */
  var forEach = Array.prototype.forEach || function (fn, scope) {
    if (this === void 0 || this === null || typeof fn !== 'function') {
      throw new TypeError();
    }

    /* jshint bitwise: false */
    var i, len = this.length >>> 0;
    /* jshint bitwise: true */

    for (i = 0; i < len; ++i) {
      if (i in this) {
        fn.call(scope, this[i], i, this);
      }
    }
  };

  // SVG Cache
  var svgCache = {};

  var injectCount = 0;
  var injectedElements = [];

  // Request Queue
  var requestQueue = [];

  // Script running status
  var ranScripts = {};

  var cloneSvg = function (sourceSvg) {
    return sourceSvg.cloneNode(true);
  };

  var queueRequest = function (url, callback) {
    requestQueue[url] = requestQueue[url] || [];
    requestQueue[url].push(callback);
  };

  var processRequestQueue = function (url) {
    for (var i = 0, len = requestQueue[url].length; i < len; i++) {
      // Make these calls async so we avoid blocking the page/renderer
      /* jshint loopfunc: true */
      (function (index) {
        setTimeout(function () {
          requestQueue[url][index](cloneSvg(svgCache[url]));
        }, 0);
      })(i);
      /* jshint loopfunc: false */
    }
  };

  var loadSvg = function (url, callback) {
    if (svgCache[url] !== undefined) {
      if (svgCache[url] instanceof SVGSVGElement) {
        // We already have it in cache, so use it
        callback(cloneSvg(svgCache[url]));
      }
      else {
        // We don't have it in cache yet, but we are loading it, so queue this request
        queueRequest(url, callback);
      }
    }
    else {

      if (!window.XMLHttpRequest) {
        callback('Browser does not support XMLHttpRequest');
        return false;
      }

      // Seed the cache to indicate we are loading this URL already
      svgCache[url] = {};
      queueRequest(url, callback);

      var httpRequest = new XMLHttpRequest();

      httpRequest.onreadystatechange = function () {
        // readyState 4 = complete
        if (httpRequest.readyState === 4) {

          // Handle status
          if (httpRequest.status === 404 || httpRequest.responseXML === null) {
            callback('Unable to load SVG file: ' + url);

            if (isLocal) callback('Note: SVG injection ajax calls do not work locally without adjusting security setting in your browser. Or consider using a local webserver.');

            callback();
            return false;
          }

          // 200 success from server, or 0 when using file:// protocol locally
          if (httpRequest.status === 200 || (isLocal && httpRequest.status === 0)) {

            /* globals Document */
            if (httpRequest.responseXML instanceof Document) {
              // Cache it
              svgCache[url] = httpRequest.responseXML.documentElement;
            }
            /* globals -Document */

            // IE9 doesn't create a responseXML Document object from loaded SVG,
            // and throws a "DOM Exception: HIERARCHY_REQUEST_ERR (3)" error when injected.
            //
            // So, we'll just create our own manually via the DOMParser using
            // the the raw XML responseText.
            //
            // :NOTE: IE8 and older doesn't have DOMParser, but they can't do SVG either, so...
            else if (DOMParser && (DOMParser instanceof Function)) {
              var xmlDoc;
              try {
                var parser = new DOMParser();
                xmlDoc = parser.parseFromString(httpRequest.responseText, 'text/xml');
              }
              catch (e) {
                xmlDoc = undefined;
              }

              if (!xmlDoc || xmlDoc.getElementsByTagName('parsererror').length) {
                callback('Unable to parse SVG file: ' + url);
                return false;
              }
              else {
                // Cache it
                svgCache[url] = xmlDoc.documentElement;
              }
            }

            // We've loaded a new asset, so process any requests waiting for it
            processRequestQueue(url);
          }
          else {
            callback('There was a problem injecting the SVG: ' + httpRequest.status + ' ' + httpRequest.statusText);
            return false;
          }
        }
      };

      httpRequest.open('GET', url);

      // Treat and parse the response as XML, even if the
      // server sends us a different mimetype
      if (httpRequest.overrideMimeType) httpRequest.overrideMimeType('text/xml');

      httpRequest.send();
    }
  };

  // Inject a single element
  var injectElement = function (el, evalScripts, pngFallback, callback) {

    // Grab the src or data-src attribute
    var imgUrl = el.getAttribute('data-src') || el.getAttribute('src');

    // We can only inject SVG
    if (!(/\.svg/i).test(imgUrl)) {
      callback('Attempted to inject a file with a non-svg extension: ' + imgUrl);
      return;
    }

    // If we don't have SVG support try to fall back to a png,
    // either defined per-element via data-fallback or data-png,
    // or globally via the pngFallback directory setting
    if (!hasSvgSupport) {
      var perElementFallback = el.getAttribute('data-fallback') || el.getAttribute('data-png');

      // Per-element specific PNG fallback defined, so use that
      if (perElementFallback) {
        el.setAttribute('src', perElementFallback);
        callback(null);
      }
      // Global PNG fallback directoriy defined, use the same-named PNG
      else if (pngFallback) {
        el.setAttribute('src', pngFallback + '/' + imgUrl.split('/').pop().replace('.svg', '.png'));
        callback(null);
      }
      // um...
      else {
        callback('This browser does not support SVG and no PNG fallback was defined.');
      }

      return;
    }

    // Make sure we aren't already in the process of injecting this element to
    // avoid a race condition if multiple injections for the same element are run.
    // :NOTE: Using indexOf() only _after_ we check for SVG support and bail,
    // so no need for IE8 indexOf() polyfill
    if (injectedElements.indexOf(el) !== -1) {
      return;
    }

    // Remember the request to inject this element, in case other injection
    // calls are also trying to replace this element before we finish
    injectedElements.push(el);

    // Try to avoid loading the orginal image src if possible.
    el.setAttribute('src', '');

    // Load it up
    loadSvg(imgUrl, function (svg) {

      if (typeof svg === 'undefined' || typeof svg === 'string') {
        callback(svg);
        return false;
      }

      var imgId = el.getAttribute('id');
      if (imgId) {
        svg.setAttribute('id', imgId);
      }

      var imgTitle = el.getAttribute('title');
      if (imgTitle) {
        svg.setAttribute('title', imgTitle);
      }

      // Concat the SVG classes + 'injected-svg' + the img classes
      var classMerge = [].concat(svg.getAttribute('class') || [], 'injected-svg', el.getAttribute('class') || []).join(' ');
      svg.setAttribute('class', uniqueClasses(classMerge));

      var imgStyle = el.getAttribute('style');
      if (imgStyle) {
        svg.setAttribute('style', imgStyle);
      }

      // Copy all the data elements to the svg
      var imgData = [].filter.call(el.attributes, function (at) {
        return (/^data-\w[\w\-]*$/).test(at.name);
      });
      forEach.call(imgData, function (dataAttr) {
        if (dataAttr.name && dataAttr.value) {
          svg.setAttribute(dataAttr.name, dataAttr.value);
        }
      });

      // Make sure any internally referenced clipPath ids and their
      // clip-path references are unique.
      //
      // This addresses the issue of having multiple instances of the
      // same SVG on a page and only the first clipPath id is referenced.
      //
      // Browsers often shortcut the SVG Spec and don't use clipPaths
      // contained in parent elements that are hidden, so if you hide the first
      // SVG instance on the page, then all other instances lose their clipping.
      // Reference: https://bugzilla.mozilla.org/show_bug.cgi?id=376027

      // Handle all defs elements that have iri capable attributes as defined by w3c: http://www.w3.org/TR/SVG/linking.html#processingIRI
      // Mapping IRI addressable elements to the properties that can reference them:
      var iriElementsAndProperties = {
        'clipPath': ['clip-path'],
        'color-profile': ['color-profile'],
        'cursor': ['cursor'],
        'filter': ['filter'],
        'linearGradient': ['fill', 'stroke'],
        'marker': ['marker', 'marker-start', 'marker-mid', 'marker-end'],
        'mask': ['mask'],
        'pattern': ['fill', 'stroke'],
        'radialGradient': ['fill', 'stroke']
      };

      var element, elementDefs, properties, currentId, newId;
      Object.keys(iriElementsAndProperties).forEach(function (key) {
        element = key;
        properties = iriElementsAndProperties[key];

        elementDefs = svg.querySelectorAll('defs ' + element + '[id]');
        for (var i = 0, elementsLen = elementDefs.length; i < elementsLen; i++) {
          currentId = elementDefs[i].id;
          newId = currentId + '-' + injectCount;

          // All of the properties that can reference this element type
          var referencingElements;
          forEach.call(properties, function (property) {
            // :NOTE: using a substring match attr selector here to deal with IE "adding extra quotes in url() attrs"
            referencingElements = svg.querySelectorAll('[' + property + '*="' + currentId + '"]');
            for (var j = 0, referencingElementLen = referencingElements.length; j < referencingElementLen; j++) {
              referencingElements[j].setAttribute(property, 'url(#' + newId + ')');
            }
          });

          elementDefs[i].id = newId;
        }
      });

      // Remove any unwanted/invalid namespaces that might have been added by SVG editing tools
      svg.removeAttribute('xmlns:a');

      // Post page load injected SVGs don't automatically have their script
      // elements run, so we'll need to make that happen, if requested

      // Find then prune the scripts
      var scripts = svg.querySelectorAll('script');
      var scriptsToEval = [];
      var script, scriptType;

      for (var k = 0, scriptsLen = scripts.length; k < scriptsLen; k++) {
        scriptType = scripts[k].getAttribute('type');

        // Only process javascript types.
        // SVG defaults to 'application/ecmascript' for unset types
        if (!scriptType || scriptType === 'application/ecmascript' || scriptType === 'application/javascript') {

          // innerText for IE, textContent for other browsers
          script = scripts[k].innerText || scripts[k].textContent;

          // Stash
          scriptsToEval.push(script);

          // Tidy up and remove the script element since we don't need it anymore
          svg.removeChild(scripts[k]);
        }
      }

      // Run/Eval the scripts if needed
      if (scriptsToEval.length > 0 && (evalScripts === 'always' || (evalScripts === 'once' && !ranScripts[imgUrl]))) {
        for (var l = 0, scriptsToEvalLen = scriptsToEval.length; l < scriptsToEvalLen; l++) {

          // :NOTE: Yup, this is a form of eval, but it is being used to eval code
          // the caller has explictely asked to be loaded, and the code is in a caller
          // defined SVG file... not raw user input.
          //
          // Also, the code is evaluated in a closure and not in the global scope.
          // If you need to put something in global scope, use 'window'
          new Function(scriptsToEval[l])(window); // jshint ignore:line
        }

        // Remember we already ran scripts for this svg
        ranScripts[imgUrl] = true;
      }

      // :WORKAROUND:
      // IE doesn't evaluate <style> tags in SVGs that are dynamically added to the page.
      // This trick will trigger IE to read and use any existing SVG <style> tags.
      //
      // Reference: https://github.com/iconic/SVGInjector/issues/23
      var styleTags = svg.querySelectorAll('style');
      forEach.call(styleTags, function (styleTag) {
        styleTag.textContent += '';
      });

      // Replace the image with the svg
      el.parentNode.replaceChild(svg, el);

      // Now that we no longer need it, drop references
      // to the original element so it can be GC'd
      delete injectedElements[injectedElements.indexOf(el)];
      el = null;

      // Increment the injected count
      injectCount++;

      callback(svg);
    });
  };

  /**
   * SVGInjector
   *
   * Replace the given elements with their full inline SVG DOM elements.
   *
   * :NOTE: We are using get/setAttribute with SVG because the SVG DOM spec differs from HTML DOM and
   * can return other unexpected object types when trying to directly access svg properties.
   * ex: "className" returns a SVGAnimatedString with the class value found in the "baseVal" property,
   * instead of simple string like with HTML Elements.
   *
   * @param {mixes} Array of or single DOM element
   * @param {object} options
   * @param {function} callback
   * @return {object} Instance of SVGInjector
   */
  var SVGInjector = function (elements, options, done) {

    // Options & defaults
    options = options || {};

    // Should we run the scripts blocks found in the SVG
    // 'always' - Run them every time
    // 'once' - Only run scripts once for each SVG
    // [false|'never'] - Ignore scripts
    var evalScripts = options.evalScripts || 'always';

    // Location of fallback pngs, if desired
    var pngFallback = options.pngFallback || false;

    // Callback to run during each SVG injection, returning the SVG injected
    var eachCallback = options.each;

    // Do the injection...
    if (elements.length !== undefined) {
      var elementsLoaded = 0;
      forEach.call(elements, function (element) {
        injectElement(element, evalScripts, pngFallback, function (svg) {
          if (eachCallback && typeof eachCallback === 'function') eachCallback(svg);
          if (done && elements.length === ++elementsLoaded) done(elementsLoaded);
        });
      });
    }
    else {
      if (elements) {
        injectElement(elements, evalScripts, pngFallback, function (svg) {
          if (eachCallback && typeof eachCallback === 'function') eachCallback(svg);
          if (done) done(1);
          elements = null;
        });
      }
      else {
        if (done) done(0);
      }
    }
  };

  /* global module, exports: true, define */
  // Node.js or CommonJS
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = exports = SVGInjector;
  }
  // AMD support
  else if (typeof define === 'function' && define.amd) {
    define(function () {
      return SVGInjector;
    });
  }
  // Otherwise, attach to window as global
  else if (typeof window === 'object') {
    window.SVGInjector = SVGInjector;
  }
  /* global -module, -exports, -define */

}(window, document));

},{}],3:[function(require,module,exports){
'use strict';

var _svgInjector = require('svg-injector');

var _svgInjector2 = _interopRequireDefault(_svgInjector);

var _smoothscroll = require('smoothscroll');

var _smoothscroll2 = _interopRequireDefault(_smoothscroll);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

window.onload = function () {

  svgInject();
  delegateMenu();
  enableSmoothScroll();
};

function enableSmoothScroll() {
  window.addEventListener('click', function (e) {
    if (e.target && e.target.nodeName === "A") {
      var id = e.target.getAttribute('href');
      var element = document.querySelector(id);
      (0, _smoothscroll2.default)(element, 1000);
    }
  });
}

function delegateMenu() {
  var menu = document.querySelectorAll(".page-header__menu");
  if (menu) {
    menu[0].addEventListener('click', function (e) {
      if (e.target && (e.target.classList.contains("menu__menu-button") || e.target.parentElement.classList.contains("menu__menu-button"))) {
        toggleMenu();
      }
      if (e.target && (e.target.nodeName === "A" || e.target.parentElement.nodeName === "LI")) {
        toggleMenu();
      }
    }, false);
  }
}

function svgInject() {
  var mySVGsToInject = document.querySelectorAll('img.svg');
  (0, _svgInjector2.default)(mySVGsToInject);
  document.querySelectorAll(".page-loader-wrapper")[0].style.display = "none";
}

function toggleMenu() {
  var menuList = document.querySelectorAll(".menu__menu-list");
  var burger = document.querySelectorAll(".menu__menu-icon");

  if (menuList && burger) {
    menuList[0].classList.toggle('opened');
    if (menuList[0].classList.contains('opened')) {
      burger[0].setAttribute('src', 'svg/close.svg');
    } else {
      burger[0].setAttribute('src', 'svg/menu.svg');
    }
  }
}
},{"smoothscroll":1,"svg-injector":2}]},{},[3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcxYF1a2FzelxccHJvamVjdHNcXHBvcnRmb2xpb1xcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQzovVXNlcnMvxYF1a2Fzei9wcm9qZWN0cy9wb3J0Zm9saW8vbm9kZV9tb2R1bGVzL3Ntb290aHNjcm9sbC9zbW9vdGhzY3JvbGwuanMiLCJDOi9Vc2Vycy/FgXVrYXN6L3Byb2plY3RzL3BvcnRmb2xpby9ub2RlX21vZHVsZXMvc3ZnLWluamVjdG9yL3N2Zy1pbmplY3Rvci5qcyIsIkM6L1VzZXJzL8WBdWthc3ovcHJvamVjdHMvcG9ydGZvbGlvL3NvdXJjZS9zY3JpcHRzL2Zha2VfNjY1YzA5MjQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbiAocm9vdCwgc21vb3RoU2Nyb2xsKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBTdXBwb3J0IFJlcXVpcmVKUyBhbmQgQ29tbW9uSlMvTm9kZUpTIG1vZHVsZSBmb3JtYXRzLlxuICAvLyBBdHRhY2ggc21vb3RoU2Nyb2xsIHRvIHRoZSBgd2luZG93YCB3aGVuIGV4ZWN1dGVkIGFzIGEgPHNjcmlwdD4uXG5cbiAgLy8gUmVxdWlyZUpTXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoc21vb3RoU2Nyb2xsKTtcblxuICAvLyBDb21tb25KU1xuICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gc21vb3RoU2Nyb2xsKCk7XG5cbiAgfSBlbHNlIHtcbiAgICByb290LnNtb290aFNjcm9sbCA9IHNtb290aFNjcm9sbCgpO1xuICB9XG5cbn0pKHRoaXMsIGZ1bmN0aW9uKCl7XG4ndXNlIHN0cmljdCc7XG5cbi8vIERvIG5vdCBpbml0aWFsaXplIHNtb290aFNjcm9sbCB3aGVuIHJ1bm5pbmcgc2VydmVyIHNpZGUsIGhhbmRsZSBpdCBpbiBjbGllbnQ6XG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gJ29iamVjdCcpIHJldHVybjtcblxuLy8gV2UgZG8gbm90IHdhbnQgdGhpcyBzY3JpcHQgdG8gYmUgYXBwbGllZCBpbiBicm93c2VycyB0aGF0IGRvIG5vdCBzdXBwb3J0IHRob3NlXG4vLyBUaGF0IG1lYW5zIG5vIHNtb290aHNjcm9sbCBvbiBJRTkgYW5kIGJlbG93LlxuaWYoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCA9PT0gdm9pZCAwIHx8IHdpbmRvdy5wYWdlWU9mZnNldCA9PT0gdm9pZCAwIHx8IGhpc3RvcnkucHVzaFN0YXRlID09PSB2b2lkIDApIHsgcmV0dXJuOyB9XG5cbi8vIEdldCB0aGUgdG9wIHBvc2l0aW9uIG9mIGFuIGVsZW1lbnQgaW4gdGhlIGRvY3VtZW50XG52YXIgZ2V0VG9wID0gZnVuY3Rpb24oZWxlbWVudCwgc3RhcnQpIHtcbiAgICAvLyByZXR1cm4gdmFsdWUgb2YgaHRtbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgLi4uIElFIDogMCwgb3RoZXIgYnJvd3NlcnMgOiAtcGFnZVlPZmZzZXRcbiAgICBpZihlbGVtZW50Lm5vZGVOYW1lID09PSAnSFRNTCcpIHJldHVybiAtc3RhcnRcbiAgICByZXR1cm4gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgKyBzdGFydFxufVxuLy8gZWFzZSBpbiBvdXQgZnVuY3Rpb24gdGhhbmtzIHRvOlxuLy8gaHR0cDovL2Jsb2cuZ3Jld2ViLmZyLzIwMTIvMDIvYmV6aWVyLWN1cnZlLWJhc2VkLWVhc2luZy1mdW5jdGlvbnMtZnJvbS1jb25jZXB0LXRvLWltcGxlbWVudGF0aW9uL1xudmFyIGVhc2VJbk91dEN1YmljID0gZnVuY3Rpb24gKHQpIHsgcmV0dXJuIHQ8LjUgPyA0KnQqdCp0IDogKHQtMSkqKDIqdC0yKSooMip0LTIpKzEgfVxuXG4vLyBjYWxjdWxhdGUgdGhlIHNjcm9sbCBwb3NpdGlvbiB3ZSBzaG91bGQgYmUgaW5cbi8vIGdpdmVuIHRoZSBzdGFydCBhbmQgZW5kIHBvaW50IG9mIHRoZSBzY3JvbGxcbi8vIHRoZSB0aW1lIGVsYXBzZWQgZnJvbSB0aGUgYmVnaW5uaW5nIG9mIHRoZSBzY3JvbGxcbi8vIGFuZCB0aGUgdG90YWwgZHVyYXRpb24gb2YgdGhlIHNjcm9sbCAoZGVmYXVsdCA1MDBtcylcbnZhciBwb3NpdGlvbiA9IGZ1bmN0aW9uKHN0YXJ0LCBlbmQsIGVsYXBzZWQsIGR1cmF0aW9uKSB7XG4gICAgaWYgKGVsYXBzZWQgPiBkdXJhdGlvbikgcmV0dXJuIGVuZDtcbiAgICByZXR1cm4gc3RhcnQgKyAoZW5kIC0gc3RhcnQpICogZWFzZUluT3V0Q3ViaWMoZWxhcHNlZCAvIGR1cmF0aW9uKTsgLy8gPC0tIHlvdSBjYW4gY2hhbmdlIHRoZSBlYXNpbmcgZnVudGlvbiB0aGVyZVxuICAgIC8vIHJldHVybiBzdGFydCArIChlbmQgLSBzdGFydCkgKiAoZWxhcHNlZCAvIGR1cmF0aW9uKTsgLy8gPC0tIHRoaXMgd291bGQgZ2l2ZSBhIGxpbmVhciBzY3JvbGxcbn1cblxuLy8gd2UgdXNlIHJlcXVlc3RBbmltYXRpb25GcmFtZSB0byBiZSBjYWxsZWQgYnkgdGhlIGJyb3dzZXIgYmVmb3JlIGV2ZXJ5IHJlcGFpbnRcbi8vIGlmIHRoZSBmaXJzdCBhcmd1bWVudCBpcyBhbiBlbGVtZW50IHRoZW4gc2Nyb2xsIHRvIHRoZSB0b3Agb2YgdGhpcyBlbGVtZW50XG4vLyBpZiB0aGUgZmlyc3QgYXJndW1lbnQgaXMgbnVtZXJpYyB0aGVuIHNjcm9sbCB0byB0aGlzIGxvY2F0aW9uXG4vLyBpZiB0aGUgY2FsbGJhY2sgZXhpc3QsIGl0IGlzIGNhbGxlZCB3aGVuIHRoZSBzY3JvbGxpbmcgaXMgZmluaXNoZWRcbi8vIGlmIGNvbnRleHQgaXMgc2V0IHRoZW4gc2Nyb2xsIHRoYXQgZWxlbWVudCwgZWxzZSBzY3JvbGwgd2luZG93XG52YXIgc21vb3RoU2Nyb2xsID0gZnVuY3Rpb24oZWwsIGR1cmF0aW9uLCBjYWxsYmFjaywgY29udGV4dCl7XG4gICAgZHVyYXRpb24gPSBkdXJhdGlvbiB8fCA1MDA7XG4gICAgY29udGV4dCA9IGNvbnRleHQgfHwgd2luZG93O1xuICAgIHZhciBzdGFydCA9IGNvbnRleHQuc2Nyb2xsVG9wIHx8IHdpbmRvdy5wYWdlWU9mZnNldDtcblxuICAgIGlmICh0eXBlb2YgZWwgPT09ICdudW1iZXInKSB7XG4gICAgICB2YXIgZW5kID0gcGFyc2VJbnQoZWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgZW5kID0gZ2V0VG9wKGVsLCBzdGFydCk7XG4gICAgfVxuXG4gICAgdmFyIGNsb2NrID0gRGF0ZS5ub3coKTtcbiAgICB2YXIgcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgICAgICB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICAgICAgZnVuY3Rpb24oZm4pe3dpbmRvdy5zZXRUaW1lb3V0KGZuLCAxNSk7fTtcblxuICAgIHZhciBzdGVwID0gZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIGVsYXBzZWQgPSBEYXRlLm5vdygpIC0gY2xvY2s7XG4gICAgICAgIGlmIChjb250ZXh0ICE9PSB3aW5kb3cpIHtcbiAgICAgICAgICBjb250ZXh0LnNjcm9sbFRvcCA9IHBvc2l0aW9uKHN0YXJ0LCBlbmQsIGVsYXBzZWQsIGR1cmF0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB3aW5kb3cuc2Nyb2xsKDAsIHBvc2l0aW9uKHN0YXJ0LCBlbmQsIGVsYXBzZWQsIGR1cmF0aW9uKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZWxhcHNlZCA+IGR1cmF0aW9uKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHN0ZXApO1xuICAgICAgICB9XG4gICAgfVxuICAgIHN0ZXAoKTtcbn1cblxudmFyIGxpbmtIYW5kbGVyID0gZnVuY3Rpb24oZXYpIHtcbiAgICBpZiAoIWV2LmRlZmF1bHRQcmV2ZW50ZWQpIHtcbiAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBpZiAobG9jYXRpb24uaGFzaCAhPT0gdGhpcy5oYXNoKSB3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUobnVsbCwgbnVsbCwgdGhpcy5oYXNoKVxuICAgICAgICAvLyB1c2luZyB0aGUgaGlzdG9yeSBhcGkgdG8gc29sdmUgaXNzdWUgIzEgLSBiYWNrIGRvZXNuJ3Qgd29ya1xuICAgICAgICAvLyBtb3N0IGJyb3dzZXIgZG9uJ3QgdXBkYXRlIDp0YXJnZXQgd2hlbiB0aGUgaGlzdG9yeSBhcGkgaXMgdXNlZDpcbiAgICAgICAgLy8gVEhJUyBJUyBBIEJVRyBGUk9NIFRIRSBCUk9XU0VSUy5cbiAgICAgICAgLy8gY2hhbmdlIHRoZSBzY3JvbGxpbmcgZHVyYXRpb24gaW4gdGhpcyBjYWxsXG4gICAgICAgIHZhciBub2RlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5oYXNoLnN1YnN0cmluZygxKSlcbiAgICAgICAgaWYgKCFub2RlKSByZXR1cm47IC8vIERvIG5vdCBzY3JvbGwgdG8gbm9uLWV4aXN0aW5nIG5vZGVcblxuICAgICAgICBzbW9vdGhTY3JvbGwobm9kZSwgNTAwLCBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIGxvY2F0aW9uLnJlcGxhY2UoJyMnICsgZWwuaWQpXG4gICAgICAgICAgICAvLyB0aGlzIHdpbGwgY2F1c2UgdGhlIDp0YXJnZXQgdG8gYmUgYWN0aXZhdGVkLlxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbi8vIFdlIGxvb2sgZm9yIGFsbCB0aGUgaW50ZXJuYWwgbGlua3MgaW4gdGhlIGRvY3VtZW50cyBhbmQgYXR0YWNoIHRoZSBzbW9vdGhzY3JvbGwgZnVuY3Rpb25cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaW50ZXJuYWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdhW2hyZWZePVwiI1wiXTpub3QoW2hyZWY9XCIjXCJdKScpLCBhO1xuICAgIGZvcih2YXIgaT1pbnRlcm5hbC5sZW5ndGg7IGE9aW50ZXJuYWxbLS1pXTspe1xuICAgICAgICBhLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBsaW5rSGFuZGxlciwgZmFsc2UpO1xuICAgIH1cbn0pO1xuXG4vLyByZXR1cm4gc21vb3Roc2Nyb2xsIEFQSVxucmV0dXJuIHNtb290aFNjcm9sbDtcblxufSk7XG4iLCIvKipcbiAqIFNWR0luamVjdG9yIHYxLjEuMyAtIEZhc3QsIGNhY2hpbmcsIGR5bmFtaWMgaW5saW5lIFNWRyBET00gaW5qZWN0aW9uIGxpYnJhcnlcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9pY29uaWMvU1ZHSW5qZWN0b3JcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtMjAxNSBXYXlidXJ5IDxoZWxsb0B3YXlidXJ5LmNvbT5cbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbihmdW5jdGlvbiAod2luZG93LCBkb2N1bWVudCkge1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBFbnZpcm9ubWVudFxuICB2YXIgaXNMb2NhbCA9IHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCA9PT0gJ2ZpbGU6JztcbiAgdmFyIGhhc1N2Z1N1cHBvcnQgPSBkb2N1bWVudC5pbXBsZW1lbnRhdGlvbi5oYXNGZWF0dXJlKCdodHRwOi8vd3d3LnczLm9yZy9UUi9TVkcxMS9mZWF0dXJlI0Jhc2ljU3RydWN0dXJlJywgJzEuMScpO1xuXG4gIGZ1bmN0aW9uIHVuaXF1ZUNsYXNzZXMobGlzdCkge1xuICAgIGxpc3QgPSBsaXN0LnNwbGl0KCcgJyk7XG5cbiAgICB2YXIgaGFzaCA9IHt9O1xuICAgIHZhciBpID0gbGlzdC5sZW5ndGg7XG4gICAgdmFyIG91dCA9IFtdO1xuXG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgaWYgKCFoYXNoLmhhc093blByb3BlcnR5KGxpc3RbaV0pKSB7XG4gICAgICAgIGhhc2hbbGlzdFtpXV0gPSAxO1xuICAgICAgICBvdXQudW5zaGlmdChsaXN0W2ldKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gb3V0LmpvaW4oJyAnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBjYWNoZSAob3IgcG9seWZpbGwgZm9yIDw9IElFOCkgQXJyYXkuZm9yRWFjaCgpXG4gICAqIHNvdXJjZTogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvZm9yRWFjaFxuICAgKi9cbiAgdmFyIGZvckVhY2ggPSBBcnJheS5wcm90b3R5cGUuZm9yRWFjaCB8fCBmdW5jdGlvbiAoZm4sIHNjb3BlKSB7XG4gICAgaWYgKHRoaXMgPT09IHZvaWQgMCB8fCB0aGlzID09PSBudWxsIHx8IHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgIH1cblxuICAgIC8qIGpzaGludCBiaXR3aXNlOiBmYWxzZSAqL1xuICAgIHZhciBpLCBsZW4gPSB0aGlzLmxlbmd0aCA+Pj4gMDtcbiAgICAvKiBqc2hpbnQgYml0d2lzZTogdHJ1ZSAqL1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICBpZiAoaSBpbiB0aGlzKSB7XG4gICAgICAgIGZuLmNhbGwoc2NvcGUsIHRoaXNbaV0sIGksIHRoaXMpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvLyBTVkcgQ2FjaGVcbiAgdmFyIHN2Z0NhY2hlID0ge307XG5cbiAgdmFyIGluamVjdENvdW50ID0gMDtcbiAgdmFyIGluamVjdGVkRWxlbWVudHMgPSBbXTtcblxuICAvLyBSZXF1ZXN0IFF1ZXVlXG4gIHZhciByZXF1ZXN0UXVldWUgPSBbXTtcblxuICAvLyBTY3JpcHQgcnVubmluZyBzdGF0dXNcbiAgdmFyIHJhblNjcmlwdHMgPSB7fTtcblxuICB2YXIgY2xvbmVTdmcgPSBmdW5jdGlvbiAoc291cmNlU3ZnKSB7XG4gICAgcmV0dXJuIHNvdXJjZVN2Zy5jbG9uZU5vZGUodHJ1ZSk7XG4gIH07XG5cbiAgdmFyIHF1ZXVlUmVxdWVzdCA9IGZ1bmN0aW9uICh1cmwsIGNhbGxiYWNrKSB7XG4gICAgcmVxdWVzdFF1ZXVlW3VybF0gPSByZXF1ZXN0UXVldWVbdXJsXSB8fCBbXTtcbiAgICByZXF1ZXN0UXVldWVbdXJsXS5wdXNoKGNhbGxiYWNrKTtcbiAgfTtcblxuICB2YXIgcHJvY2Vzc1JlcXVlc3RRdWV1ZSA9IGZ1bmN0aW9uICh1cmwpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gcmVxdWVzdFF1ZXVlW3VybF0ubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIC8vIE1ha2UgdGhlc2UgY2FsbHMgYXN5bmMgc28gd2UgYXZvaWQgYmxvY2tpbmcgdGhlIHBhZ2UvcmVuZGVyZXJcbiAgICAgIC8qIGpzaGludCBsb29wZnVuYzogdHJ1ZSAqL1xuICAgICAgKGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICByZXF1ZXN0UXVldWVbdXJsXVtpbmRleF0oY2xvbmVTdmcoc3ZnQ2FjaGVbdXJsXSkpO1xuICAgICAgICB9LCAwKTtcbiAgICAgIH0pKGkpO1xuICAgICAgLyoganNoaW50IGxvb3BmdW5jOiBmYWxzZSAqL1xuICAgIH1cbiAgfTtcblxuICB2YXIgbG9hZFN2ZyA9IGZ1bmN0aW9uICh1cmwsIGNhbGxiYWNrKSB7XG4gICAgaWYgKHN2Z0NhY2hlW3VybF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHN2Z0NhY2hlW3VybF0gaW5zdGFuY2VvZiBTVkdTVkdFbGVtZW50KSB7XG4gICAgICAgIC8vIFdlIGFscmVhZHkgaGF2ZSBpdCBpbiBjYWNoZSwgc28gdXNlIGl0XG4gICAgICAgIGNhbGxiYWNrKGNsb25lU3ZnKHN2Z0NhY2hlW3VybF0pKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICAvLyBXZSBkb24ndCBoYXZlIGl0IGluIGNhY2hlIHlldCwgYnV0IHdlIGFyZSBsb2FkaW5nIGl0LCBzbyBxdWV1ZSB0aGlzIHJlcXVlc3RcbiAgICAgICAgcXVldWVSZXF1ZXN0KHVybCwgY2FsbGJhY2spO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcblxuICAgICAgaWYgKCF3aW5kb3cuWE1MSHR0cFJlcXVlc3QpIHtcbiAgICAgICAgY2FsbGJhY2soJ0Jyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBYTUxIdHRwUmVxdWVzdCcpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIFNlZWQgdGhlIGNhY2hlIHRvIGluZGljYXRlIHdlIGFyZSBsb2FkaW5nIHRoaXMgVVJMIGFscmVhZHlcbiAgICAgIHN2Z0NhY2hlW3VybF0gPSB7fTtcbiAgICAgIHF1ZXVlUmVxdWVzdCh1cmwsIGNhbGxiYWNrKTtcblxuICAgICAgdmFyIGh0dHBSZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAgIGh0dHBSZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gcmVhZHlTdGF0ZSA0ID0gY29tcGxldGVcbiAgICAgICAgaWYgKGh0dHBSZXF1ZXN0LnJlYWR5U3RhdGUgPT09IDQpIHtcblxuICAgICAgICAgIC8vIEhhbmRsZSBzdGF0dXNcbiAgICAgICAgICBpZiAoaHR0cFJlcXVlc3Quc3RhdHVzID09PSA0MDQgfHwgaHR0cFJlcXVlc3QucmVzcG9uc2VYTUwgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKCdVbmFibGUgdG8gbG9hZCBTVkcgZmlsZTogJyArIHVybCk7XG5cbiAgICAgICAgICAgIGlmIChpc0xvY2FsKSBjYWxsYmFjaygnTm90ZTogU1ZHIGluamVjdGlvbiBhamF4IGNhbGxzIGRvIG5vdCB3b3JrIGxvY2FsbHkgd2l0aG91dCBhZGp1c3Rpbmcgc2VjdXJpdHkgc2V0dGluZyBpbiB5b3VyIGJyb3dzZXIuIE9yIGNvbnNpZGVyIHVzaW5nIGEgbG9jYWwgd2Vic2VydmVyLicpO1xuXG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIDIwMCBzdWNjZXNzIGZyb20gc2VydmVyLCBvciAwIHdoZW4gdXNpbmcgZmlsZTovLyBwcm90b2NvbCBsb2NhbGx5XG4gICAgICAgICAgaWYgKGh0dHBSZXF1ZXN0LnN0YXR1cyA9PT0gMjAwIHx8IChpc0xvY2FsICYmIGh0dHBSZXF1ZXN0LnN0YXR1cyA9PT0gMCkpIHtcblxuICAgICAgICAgICAgLyogZ2xvYmFscyBEb2N1bWVudCAqL1xuICAgICAgICAgICAgaWYgKGh0dHBSZXF1ZXN0LnJlc3BvbnNlWE1MIGluc3RhbmNlb2YgRG9jdW1lbnQpIHtcbiAgICAgICAgICAgICAgLy8gQ2FjaGUgaXRcbiAgICAgICAgICAgICAgc3ZnQ2FjaGVbdXJsXSA9IGh0dHBSZXF1ZXN0LnJlc3BvbnNlWE1MLmRvY3VtZW50RWxlbWVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qIGdsb2JhbHMgLURvY3VtZW50ICovXG5cbiAgICAgICAgICAgIC8vIElFOSBkb2Vzbid0IGNyZWF0ZSBhIHJlc3BvbnNlWE1MIERvY3VtZW50IG9iamVjdCBmcm9tIGxvYWRlZCBTVkcsXG4gICAgICAgICAgICAvLyBhbmQgdGhyb3dzIGEgXCJET00gRXhjZXB0aW9uOiBISUVSQVJDSFlfUkVRVUVTVF9FUlIgKDMpXCIgZXJyb3Igd2hlbiBpbmplY3RlZC5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBTbywgd2UnbGwganVzdCBjcmVhdGUgb3VyIG93biBtYW51YWxseSB2aWEgdGhlIERPTVBhcnNlciB1c2luZ1xuICAgICAgICAgICAgLy8gdGhlIHRoZSByYXcgWE1MIHJlc3BvbnNlVGV4dC5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyA6Tk9URTogSUU4IGFuZCBvbGRlciBkb2Vzbid0IGhhdmUgRE9NUGFyc2VyLCBidXQgdGhleSBjYW4ndCBkbyBTVkcgZWl0aGVyLCBzby4uLlxuICAgICAgICAgICAgZWxzZSBpZiAoRE9NUGFyc2VyICYmIChET01QYXJzZXIgaW5zdGFuY2VvZiBGdW5jdGlvbikpIHtcbiAgICAgICAgICAgICAgdmFyIHhtbERvYztcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyc2VyID0gbmV3IERPTVBhcnNlcigpO1xuICAgICAgICAgICAgICAgIHhtbERvYyA9IHBhcnNlci5wYXJzZUZyb21TdHJpbmcoaHR0cFJlcXVlc3QucmVzcG9uc2VUZXh0LCAndGV4dC94bWwnKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHhtbERvYyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmICgheG1sRG9jIHx8IHhtbERvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgncGFyc2VyZXJyb3InKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygnVW5hYmxlIHRvIHBhcnNlIFNWRyBmaWxlOiAnICsgdXJsKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gQ2FjaGUgaXRcbiAgICAgICAgICAgICAgICBzdmdDYWNoZVt1cmxdID0geG1sRG9jLmRvY3VtZW50RWxlbWVudDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBXZSd2ZSBsb2FkZWQgYSBuZXcgYXNzZXQsIHNvIHByb2Nlc3MgYW55IHJlcXVlc3RzIHdhaXRpbmcgZm9yIGl0XG4gICAgICAgICAgICBwcm9jZXNzUmVxdWVzdFF1ZXVlKHVybCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY2FsbGJhY2soJ1RoZXJlIHdhcyBhIHByb2JsZW0gaW5qZWN0aW5nIHRoZSBTVkc6ICcgKyBodHRwUmVxdWVzdC5zdGF0dXMgKyAnICcgKyBodHRwUmVxdWVzdC5zdGF0dXNUZXh0KTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGh0dHBSZXF1ZXN0Lm9wZW4oJ0dFVCcsIHVybCk7XG5cbiAgICAgIC8vIFRyZWF0IGFuZCBwYXJzZSB0aGUgcmVzcG9uc2UgYXMgWE1MLCBldmVuIGlmIHRoZVxuICAgICAgLy8gc2VydmVyIHNlbmRzIHVzIGEgZGlmZmVyZW50IG1pbWV0eXBlXG4gICAgICBpZiAoaHR0cFJlcXVlc3Qub3ZlcnJpZGVNaW1lVHlwZSkgaHR0cFJlcXVlc3Qub3ZlcnJpZGVNaW1lVHlwZSgndGV4dC94bWwnKTtcblxuICAgICAgaHR0cFJlcXVlc3Quc2VuZCgpO1xuICAgIH1cbiAgfTtcblxuICAvLyBJbmplY3QgYSBzaW5nbGUgZWxlbWVudFxuICB2YXIgaW5qZWN0RWxlbWVudCA9IGZ1bmN0aW9uIChlbCwgZXZhbFNjcmlwdHMsIHBuZ0ZhbGxiYWNrLCBjYWxsYmFjaykge1xuXG4gICAgLy8gR3JhYiB0aGUgc3JjIG9yIGRhdGEtc3JjIGF0dHJpYnV0ZVxuICAgIHZhciBpbWdVcmwgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtc3JjJykgfHwgZWwuZ2V0QXR0cmlidXRlKCdzcmMnKTtcblxuICAgIC8vIFdlIGNhbiBvbmx5IGluamVjdCBTVkdcbiAgICBpZiAoISgvXFwuc3ZnL2kpLnRlc3QoaW1nVXJsKSkge1xuICAgICAgY2FsbGJhY2soJ0F0dGVtcHRlZCB0byBpbmplY3QgYSBmaWxlIHdpdGggYSBub24tc3ZnIGV4dGVuc2lvbjogJyArIGltZ1VybCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSWYgd2UgZG9uJ3QgaGF2ZSBTVkcgc3VwcG9ydCB0cnkgdG8gZmFsbCBiYWNrIHRvIGEgcG5nLFxuICAgIC8vIGVpdGhlciBkZWZpbmVkIHBlci1lbGVtZW50IHZpYSBkYXRhLWZhbGxiYWNrIG9yIGRhdGEtcG5nLFxuICAgIC8vIG9yIGdsb2JhbGx5IHZpYSB0aGUgcG5nRmFsbGJhY2sgZGlyZWN0b3J5IHNldHRpbmdcbiAgICBpZiAoIWhhc1N2Z1N1cHBvcnQpIHtcbiAgICAgIHZhciBwZXJFbGVtZW50RmFsbGJhY2sgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtZmFsbGJhY2snKSB8fCBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtcG5nJyk7XG5cbiAgICAgIC8vIFBlci1lbGVtZW50IHNwZWNpZmljIFBORyBmYWxsYmFjayBkZWZpbmVkLCBzbyB1c2UgdGhhdFxuICAgICAgaWYgKHBlckVsZW1lbnRGYWxsYmFjaykge1xuICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoJ3NyYycsIHBlckVsZW1lbnRGYWxsYmFjayk7XG4gICAgICAgIGNhbGxiYWNrKG51bGwpO1xuICAgICAgfVxuICAgICAgLy8gR2xvYmFsIFBORyBmYWxsYmFjayBkaXJlY3Rvcml5IGRlZmluZWQsIHVzZSB0aGUgc2FtZS1uYW1lZCBQTkdcbiAgICAgIGVsc2UgaWYgKHBuZ0ZhbGxiYWNrKSB7XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZSgnc3JjJywgcG5nRmFsbGJhY2sgKyAnLycgKyBpbWdVcmwuc3BsaXQoJy8nKS5wb3AoKS5yZXBsYWNlKCcuc3ZnJywgJy5wbmcnKSk7XG4gICAgICAgIGNhbGxiYWNrKG51bGwpO1xuICAgICAgfVxuICAgICAgLy8gdW0uLi5cbiAgICAgIGVsc2Uge1xuICAgICAgICBjYWxsYmFjaygnVGhpcyBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgU1ZHIGFuZCBubyBQTkcgZmFsbGJhY2sgd2FzIGRlZmluZWQuJyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBNYWtlIHN1cmUgd2UgYXJlbid0IGFscmVhZHkgaW4gdGhlIHByb2Nlc3Mgb2YgaW5qZWN0aW5nIHRoaXMgZWxlbWVudCB0b1xuICAgIC8vIGF2b2lkIGEgcmFjZSBjb25kaXRpb24gaWYgbXVsdGlwbGUgaW5qZWN0aW9ucyBmb3IgdGhlIHNhbWUgZWxlbWVudCBhcmUgcnVuLlxuICAgIC8vIDpOT1RFOiBVc2luZyBpbmRleE9mKCkgb25seSBfYWZ0ZXJfIHdlIGNoZWNrIGZvciBTVkcgc3VwcG9ydCBhbmQgYmFpbCxcbiAgICAvLyBzbyBubyBuZWVkIGZvciBJRTggaW5kZXhPZigpIHBvbHlmaWxsXG4gICAgaWYgKGluamVjdGVkRWxlbWVudHMuaW5kZXhPZihlbCkgIT09IC0xKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUmVtZW1iZXIgdGhlIHJlcXVlc3QgdG8gaW5qZWN0IHRoaXMgZWxlbWVudCwgaW4gY2FzZSBvdGhlciBpbmplY3Rpb25cbiAgICAvLyBjYWxscyBhcmUgYWxzbyB0cnlpbmcgdG8gcmVwbGFjZSB0aGlzIGVsZW1lbnQgYmVmb3JlIHdlIGZpbmlzaFxuICAgIGluamVjdGVkRWxlbWVudHMucHVzaChlbCk7XG5cbiAgICAvLyBUcnkgdG8gYXZvaWQgbG9hZGluZyB0aGUgb3JnaW5hbCBpbWFnZSBzcmMgaWYgcG9zc2libGUuXG4gICAgZWwuc2V0QXR0cmlidXRlKCdzcmMnLCAnJyk7XG5cbiAgICAvLyBMb2FkIGl0IHVwXG4gICAgbG9hZFN2ZyhpbWdVcmwsIGZ1bmN0aW9uIChzdmcpIHtcblxuICAgICAgaWYgKHR5cGVvZiBzdmcgPT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBzdmcgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNhbGxiYWNrKHN2Zyk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgdmFyIGltZ0lkID0gZWwuZ2V0QXR0cmlidXRlKCdpZCcpO1xuICAgICAgaWYgKGltZ0lkKSB7XG4gICAgICAgIHN2Zy5zZXRBdHRyaWJ1dGUoJ2lkJywgaW1nSWQpO1xuICAgICAgfVxuXG4gICAgICB2YXIgaW1nVGl0bGUgPSBlbC5nZXRBdHRyaWJ1dGUoJ3RpdGxlJyk7XG4gICAgICBpZiAoaW1nVGl0bGUpIHtcbiAgICAgICAgc3ZnLnNldEF0dHJpYnV0ZSgndGl0bGUnLCBpbWdUaXRsZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIENvbmNhdCB0aGUgU1ZHIGNsYXNzZXMgKyAnaW5qZWN0ZWQtc3ZnJyArIHRoZSBpbWcgY2xhc3Nlc1xuICAgICAgdmFyIGNsYXNzTWVyZ2UgPSBbXS5jb25jYXQoc3ZnLmdldEF0dHJpYnV0ZSgnY2xhc3MnKSB8fCBbXSwgJ2luamVjdGVkLXN2ZycsIGVsLmdldEF0dHJpYnV0ZSgnY2xhc3MnKSB8fCBbXSkuam9pbignICcpO1xuICAgICAgc3ZnLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCB1bmlxdWVDbGFzc2VzKGNsYXNzTWVyZ2UpKTtcblxuICAgICAgdmFyIGltZ1N0eWxlID0gZWwuZ2V0QXR0cmlidXRlKCdzdHlsZScpO1xuICAgICAgaWYgKGltZ1N0eWxlKSB7XG4gICAgICAgIHN2Zy5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgaW1nU3R5bGUpO1xuICAgICAgfVxuXG4gICAgICAvLyBDb3B5IGFsbCB0aGUgZGF0YSBlbGVtZW50cyB0byB0aGUgc3ZnXG4gICAgICB2YXIgaW1nRGF0YSA9IFtdLmZpbHRlci5jYWxsKGVsLmF0dHJpYnV0ZXMsIGZ1bmN0aW9uIChhdCkge1xuICAgICAgICByZXR1cm4gKC9eZGF0YS1cXHdbXFx3XFwtXSokLykudGVzdChhdC5uYW1lKTtcbiAgICAgIH0pO1xuICAgICAgZm9yRWFjaC5jYWxsKGltZ0RhdGEsIGZ1bmN0aW9uIChkYXRhQXR0cikge1xuICAgICAgICBpZiAoZGF0YUF0dHIubmFtZSAmJiBkYXRhQXR0ci52YWx1ZSkge1xuICAgICAgICAgIHN2Zy5zZXRBdHRyaWJ1dGUoZGF0YUF0dHIubmFtZSwgZGF0YUF0dHIudmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gTWFrZSBzdXJlIGFueSBpbnRlcm5hbGx5IHJlZmVyZW5jZWQgY2xpcFBhdGggaWRzIGFuZCB0aGVpclxuICAgICAgLy8gY2xpcC1wYXRoIHJlZmVyZW5jZXMgYXJlIHVuaXF1ZS5cbiAgICAgIC8vXG4gICAgICAvLyBUaGlzIGFkZHJlc3NlcyB0aGUgaXNzdWUgb2YgaGF2aW5nIG11bHRpcGxlIGluc3RhbmNlcyBvZiB0aGVcbiAgICAgIC8vIHNhbWUgU1ZHIG9uIGEgcGFnZSBhbmQgb25seSB0aGUgZmlyc3QgY2xpcFBhdGggaWQgaXMgcmVmZXJlbmNlZC5cbiAgICAgIC8vXG4gICAgICAvLyBCcm93c2VycyBvZnRlbiBzaG9ydGN1dCB0aGUgU1ZHIFNwZWMgYW5kIGRvbid0IHVzZSBjbGlwUGF0aHNcbiAgICAgIC8vIGNvbnRhaW5lZCBpbiBwYXJlbnQgZWxlbWVudHMgdGhhdCBhcmUgaGlkZGVuLCBzbyBpZiB5b3UgaGlkZSB0aGUgZmlyc3RcbiAgICAgIC8vIFNWRyBpbnN0YW5jZSBvbiB0aGUgcGFnZSwgdGhlbiBhbGwgb3RoZXIgaW5zdGFuY2VzIGxvc2UgdGhlaXIgY2xpcHBpbmcuXG4gICAgICAvLyBSZWZlcmVuY2U6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTM3NjAyN1xuXG4gICAgICAvLyBIYW5kbGUgYWxsIGRlZnMgZWxlbWVudHMgdGhhdCBoYXZlIGlyaSBjYXBhYmxlIGF0dHJpYnV0ZXMgYXMgZGVmaW5lZCBieSB3M2M6IGh0dHA6Ly93d3cudzMub3JnL1RSL1NWRy9saW5raW5nLmh0bWwjcHJvY2Vzc2luZ0lSSVxuICAgICAgLy8gTWFwcGluZyBJUkkgYWRkcmVzc2FibGUgZWxlbWVudHMgdG8gdGhlIHByb3BlcnRpZXMgdGhhdCBjYW4gcmVmZXJlbmNlIHRoZW06XG4gICAgICB2YXIgaXJpRWxlbWVudHNBbmRQcm9wZXJ0aWVzID0ge1xuICAgICAgICAnY2xpcFBhdGgnOiBbJ2NsaXAtcGF0aCddLFxuICAgICAgICAnY29sb3ItcHJvZmlsZSc6IFsnY29sb3ItcHJvZmlsZSddLFxuICAgICAgICAnY3Vyc29yJzogWydjdXJzb3InXSxcbiAgICAgICAgJ2ZpbHRlcic6IFsnZmlsdGVyJ10sXG4gICAgICAgICdsaW5lYXJHcmFkaWVudCc6IFsnZmlsbCcsICdzdHJva2UnXSxcbiAgICAgICAgJ21hcmtlcic6IFsnbWFya2VyJywgJ21hcmtlci1zdGFydCcsICdtYXJrZXItbWlkJywgJ21hcmtlci1lbmQnXSxcbiAgICAgICAgJ21hc2snOiBbJ21hc2snXSxcbiAgICAgICAgJ3BhdHRlcm4nOiBbJ2ZpbGwnLCAnc3Ryb2tlJ10sXG4gICAgICAgICdyYWRpYWxHcmFkaWVudCc6IFsnZmlsbCcsICdzdHJva2UnXVxuICAgICAgfTtcblxuICAgICAgdmFyIGVsZW1lbnQsIGVsZW1lbnREZWZzLCBwcm9wZXJ0aWVzLCBjdXJyZW50SWQsIG5ld0lkO1xuICAgICAgT2JqZWN0LmtleXMoaXJpRWxlbWVudHNBbmRQcm9wZXJ0aWVzKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgZWxlbWVudCA9IGtleTtcbiAgICAgICAgcHJvcGVydGllcyA9IGlyaUVsZW1lbnRzQW5kUHJvcGVydGllc1trZXldO1xuXG4gICAgICAgIGVsZW1lbnREZWZzID0gc3ZnLnF1ZXJ5U2VsZWN0b3JBbGwoJ2RlZnMgJyArIGVsZW1lbnQgKyAnW2lkXScpO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgZWxlbWVudHNMZW4gPSBlbGVtZW50RGVmcy5sZW5ndGg7IGkgPCBlbGVtZW50c0xlbjsgaSsrKSB7XG4gICAgICAgICAgY3VycmVudElkID0gZWxlbWVudERlZnNbaV0uaWQ7XG4gICAgICAgICAgbmV3SWQgPSBjdXJyZW50SWQgKyAnLScgKyBpbmplY3RDb3VudDtcblxuICAgICAgICAgIC8vIEFsbCBvZiB0aGUgcHJvcGVydGllcyB0aGF0IGNhbiByZWZlcmVuY2UgdGhpcyBlbGVtZW50IHR5cGVcbiAgICAgICAgICB2YXIgcmVmZXJlbmNpbmdFbGVtZW50cztcbiAgICAgICAgICBmb3JFYWNoLmNhbGwocHJvcGVydGllcywgZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgICAvLyA6Tk9URTogdXNpbmcgYSBzdWJzdHJpbmcgbWF0Y2ggYXR0ciBzZWxlY3RvciBoZXJlIHRvIGRlYWwgd2l0aCBJRSBcImFkZGluZyBleHRyYSBxdW90ZXMgaW4gdXJsKCkgYXR0cnNcIlxuICAgICAgICAgICAgcmVmZXJlbmNpbmdFbGVtZW50cyA9IHN2Zy5xdWVyeVNlbGVjdG9yQWxsKCdbJyArIHByb3BlcnR5ICsgJyo9XCInICsgY3VycmVudElkICsgJ1wiXScpO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDAsIHJlZmVyZW5jaW5nRWxlbWVudExlbiA9IHJlZmVyZW5jaW5nRWxlbWVudHMubGVuZ3RoOyBqIDwgcmVmZXJlbmNpbmdFbGVtZW50TGVuOyBqKyspIHtcbiAgICAgICAgICAgICAgcmVmZXJlbmNpbmdFbGVtZW50c1tqXS5zZXRBdHRyaWJ1dGUocHJvcGVydHksICd1cmwoIycgKyBuZXdJZCArICcpJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBlbGVtZW50RGVmc1tpXS5pZCA9IG5ld0lkO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gUmVtb3ZlIGFueSB1bndhbnRlZC9pbnZhbGlkIG5hbWVzcGFjZXMgdGhhdCBtaWdodCBoYXZlIGJlZW4gYWRkZWQgYnkgU1ZHIGVkaXRpbmcgdG9vbHNcbiAgICAgIHN2Zy5yZW1vdmVBdHRyaWJ1dGUoJ3htbG5zOmEnKTtcblxuICAgICAgLy8gUG9zdCBwYWdlIGxvYWQgaW5qZWN0ZWQgU1ZHcyBkb24ndCBhdXRvbWF0aWNhbGx5IGhhdmUgdGhlaXIgc2NyaXB0XG4gICAgICAvLyBlbGVtZW50cyBydW4sIHNvIHdlJ2xsIG5lZWQgdG8gbWFrZSB0aGF0IGhhcHBlbiwgaWYgcmVxdWVzdGVkXG5cbiAgICAgIC8vIEZpbmQgdGhlbiBwcnVuZSB0aGUgc2NyaXB0c1xuICAgICAgdmFyIHNjcmlwdHMgPSBzdmcucXVlcnlTZWxlY3RvckFsbCgnc2NyaXB0Jyk7XG4gICAgICB2YXIgc2NyaXB0c1RvRXZhbCA9IFtdO1xuICAgICAgdmFyIHNjcmlwdCwgc2NyaXB0VHlwZTtcblxuICAgICAgZm9yICh2YXIgayA9IDAsIHNjcmlwdHNMZW4gPSBzY3JpcHRzLmxlbmd0aDsgayA8IHNjcmlwdHNMZW47IGsrKykge1xuICAgICAgICBzY3JpcHRUeXBlID0gc2NyaXB0c1trXS5nZXRBdHRyaWJ1dGUoJ3R5cGUnKTtcblxuICAgICAgICAvLyBPbmx5IHByb2Nlc3MgamF2YXNjcmlwdCB0eXBlcy5cbiAgICAgICAgLy8gU1ZHIGRlZmF1bHRzIHRvICdhcHBsaWNhdGlvbi9lY21hc2NyaXB0JyBmb3IgdW5zZXQgdHlwZXNcbiAgICAgICAgaWYgKCFzY3JpcHRUeXBlIHx8IHNjcmlwdFR5cGUgPT09ICdhcHBsaWNhdGlvbi9lY21hc2NyaXB0JyB8fCBzY3JpcHRUeXBlID09PSAnYXBwbGljYXRpb24vamF2YXNjcmlwdCcpIHtcblxuICAgICAgICAgIC8vIGlubmVyVGV4dCBmb3IgSUUsIHRleHRDb250ZW50IGZvciBvdGhlciBicm93c2Vyc1xuICAgICAgICAgIHNjcmlwdCA9IHNjcmlwdHNba10uaW5uZXJUZXh0IHx8IHNjcmlwdHNba10udGV4dENvbnRlbnQ7XG5cbiAgICAgICAgICAvLyBTdGFzaFxuICAgICAgICAgIHNjcmlwdHNUb0V2YWwucHVzaChzY3JpcHQpO1xuXG4gICAgICAgICAgLy8gVGlkeSB1cCBhbmQgcmVtb3ZlIHRoZSBzY3JpcHQgZWxlbWVudCBzaW5jZSB3ZSBkb24ndCBuZWVkIGl0IGFueW1vcmVcbiAgICAgICAgICBzdmcucmVtb3ZlQ2hpbGQoc2NyaXB0c1trXSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUnVuL0V2YWwgdGhlIHNjcmlwdHMgaWYgbmVlZGVkXG4gICAgICBpZiAoc2NyaXB0c1RvRXZhbC5sZW5ndGggPiAwICYmIChldmFsU2NyaXB0cyA9PT0gJ2Fsd2F5cycgfHwgKGV2YWxTY3JpcHRzID09PSAnb25jZScgJiYgIXJhblNjcmlwdHNbaW1nVXJsXSkpKSB7XG4gICAgICAgIGZvciAodmFyIGwgPSAwLCBzY3JpcHRzVG9FdmFsTGVuID0gc2NyaXB0c1RvRXZhbC5sZW5ndGg7IGwgPCBzY3JpcHRzVG9FdmFsTGVuOyBsKyspIHtcblxuICAgICAgICAgIC8vIDpOT1RFOiBZdXAsIHRoaXMgaXMgYSBmb3JtIG9mIGV2YWwsIGJ1dCBpdCBpcyBiZWluZyB1c2VkIHRvIGV2YWwgY29kZVxuICAgICAgICAgIC8vIHRoZSBjYWxsZXIgaGFzIGV4cGxpY3RlbHkgYXNrZWQgdG8gYmUgbG9hZGVkLCBhbmQgdGhlIGNvZGUgaXMgaW4gYSBjYWxsZXJcbiAgICAgICAgICAvLyBkZWZpbmVkIFNWRyBmaWxlLi4uIG5vdCByYXcgdXNlciBpbnB1dC5cbiAgICAgICAgICAvL1xuICAgICAgICAgIC8vIEFsc28sIHRoZSBjb2RlIGlzIGV2YWx1YXRlZCBpbiBhIGNsb3N1cmUgYW5kIG5vdCBpbiB0aGUgZ2xvYmFsIHNjb3BlLlxuICAgICAgICAgIC8vIElmIHlvdSBuZWVkIHRvIHB1dCBzb21ldGhpbmcgaW4gZ2xvYmFsIHNjb3BlLCB1c2UgJ3dpbmRvdydcbiAgICAgICAgICBuZXcgRnVuY3Rpb24oc2NyaXB0c1RvRXZhbFtsXSkod2luZG93KTsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZW1lbWJlciB3ZSBhbHJlYWR5IHJhbiBzY3JpcHRzIGZvciB0aGlzIHN2Z1xuICAgICAgICByYW5TY3JpcHRzW2ltZ1VybF0gPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvLyA6V09SS0FST1VORDpcbiAgICAgIC8vIElFIGRvZXNuJ3QgZXZhbHVhdGUgPHN0eWxlPiB0YWdzIGluIFNWR3MgdGhhdCBhcmUgZHluYW1pY2FsbHkgYWRkZWQgdG8gdGhlIHBhZ2UuXG4gICAgICAvLyBUaGlzIHRyaWNrIHdpbGwgdHJpZ2dlciBJRSB0byByZWFkIGFuZCB1c2UgYW55IGV4aXN0aW5nIFNWRyA8c3R5bGU+IHRhZ3MuXG4gICAgICAvL1xuICAgICAgLy8gUmVmZXJlbmNlOiBodHRwczovL2dpdGh1Yi5jb20vaWNvbmljL1NWR0luamVjdG9yL2lzc3Vlcy8yM1xuICAgICAgdmFyIHN0eWxlVGFncyA9IHN2Zy5xdWVyeVNlbGVjdG9yQWxsKCdzdHlsZScpO1xuICAgICAgZm9yRWFjaC5jYWxsKHN0eWxlVGFncywgZnVuY3Rpb24gKHN0eWxlVGFnKSB7XG4gICAgICAgIHN0eWxlVGFnLnRleHRDb250ZW50ICs9ICcnO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIFJlcGxhY2UgdGhlIGltYWdlIHdpdGggdGhlIHN2Z1xuICAgICAgZWwucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoc3ZnLCBlbCk7XG5cbiAgICAgIC8vIE5vdyB0aGF0IHdlIG5vIGxvbmdlciBuZWVkIGl0LCBkcm9wIHJlZmVyZW5jZXNcbiAgICAgIC8vIHRvIHRoZSBvcmlnaW5hbCBlbGVtZW50IHNvIGl0IGNhbiBiZSBHQydkXG4gICAgICBkZWxldGUgaW5qZWN0ZWRFbGVtZW50c1tpbmplY3RlZEVsZW1lbnRzLmluZGV4T2YoZWwpXTtcbiAgICAgIGVsID0gbnVsbDtcblxuICAgICAgLy8gSW5jcmVtZW50IHRoZSBpbmplY3RlZCBjb3VudFxuICAgICAgaW5qZWN0Q291bnQrKztcblxuICAgICAgY2FsbGJhY2soc3ZnKTtcbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogU1ZHSW5qZWN0b3JcbiAgICpcbiAgICogUmVwbGFjZSB0aGUgZ2l2ZW4gZWxlbWVudHMgd2l0aCB0aGVpciBmdWxsIGlubGluZSBTVkcgRE9NIGVsZW1lbnRzLlxuICAgKlxuICAgKiA6Tk9URTogV2UgYXJlIHVzaW5nIGdldC9zZXRBdHRyaWJ1dGUgd2l0aCBTVkcgYmVjYXVzZSB0aGUgU1ZHIERPTSBzcGVjIGRpZmZlcnMgZnJvbSBIVE1MIERPTSBhbmRcbiAgICogY2FuIHJldHVybiBvdGhlciB1bmV4cGVjdGVkIG9iamVjdCB0eXBlcyB3aGVuIHRyeWluZyB0byBkaXJlY3RseSBhY2Nlc3Mgc3ZnIHByb3BlcnRpZXMuXG4gICAqIGV4OiBcImNsYXNzTmFtZVwiIHJldHVybnMgYSBTVkdBbmltYXRlZFN0cmluZyB3aXRoIHRoZSBjbGFzcyB2YWx1ZSBmb3VuZCBpbiB0aGUgXCJiYXNlVmFsXCIgcHJvcGVydHksXG4gICAqIGluc3RlYWQgb2Ygc2ltcGxlIHN0cmluZyBsaWtlIHdpdGggSFRNTCBFbGVtZW50cy5cbiAgICpcbiAgICogQHBhcmFtIHttaXhlc30gQXJyYXkgb2Ygb3Igc2luZ2xlIERPTSBlbGVtZW50XG4gICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXG4gICAqIEByZXR1cm4ge29iamVjdH0gSW5zdGFuY2Ugb2YgU1ZHSW5qZWN0b3JcbiAgICovXG4gIHZhciBTVkdJbmplY3RvciA9IGZ1bmN0aW9uIChlbGVtZW50cywgb3B0aW9ucywgZG9uZSkge1xuXG4gICAgLy8gT3B0aW9ucyAmIGRlZmF1bHRzXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAvLyBTaG91bGQgd2UgcnVuIHRoZSBzY3JpcHRzIGJsb2NrcyBmb3VuZCBpbiB0aGUgU1ZHXG4gICAgLy8gJ2Fsd2F5cycgLSBSdW4gdGhlbSBldmVyeSB0aW1lXG4gICAgLy8gJ29uY2UnIC0gT25seSBydW4gc2NyaXB0cyBvbmNlIGZvciBlYWNoIFNWR1xuICAgIC8vIFtmYWxzZXwnbmV2ZXInXSAtIElnbm9yZSBzY3JpcHRzXG4gICAgdmFyIGV2YWxTY3JpcHRzID0gb3B0aW9ucy5ldmFsU2NyaXB0cyB8fCAnYWx3YXlzJztcblxuICAgIC8vIExvY2F0aW9uIG9mIGZhbGxiYWNrIHBuZ3MsIGlmIGRlc2lyZWRcbiAgICB2YXIgcG5nRmFsbGJhY2sgPSBvcHRpb25zLnBuZ0ZhbGxiYWNrIHx8IGZhbHNlO1xuXG4gICAgLy8gQ2FsbGJhY2sgdG8gcnVuIGR1cmluZyBlYWNoIFNWRyBpbmplY3Rpb24sIHJldHVybmluZyB0aGUgU1ZHIGluamVjdGVkXG4gICAgdmFyIGVhY2hDYWxsYmFjayA9IG9wdGlvbnMuZWFjaDtcblxuICAgIC8vIERvIHRoZSBpbmplY3Rpb24uLi5cbiAgICBpZiAoZWxlbWVudHMubGVuZ3RoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHZhciBlbGVtZW50c0xvYWRlZCA9IDA7XG4gICAgICBmb3JFYWNoLmNhbGwoZWxlbWVudHMsIGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgIGluamVjdEVsZW1lbnQoZWxlbWVudCwgZXZhbFNjcmlwdHMsIHBuZ0ZhbGxiYWNrLCBmdW5jdGlvbiAoc3ZnKSB7XG4gICAgICAgICAgaWYgKGVhY2hDYWxsYmFjayAmJiB0eXBlb2YgZWFjaENhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBlYWNoQ2FsbGJhY2soc3ZnKTtcbiAgICAgICAgICBpZiAoZG9uZSAmJiBlbGVtZW50cy5sZW5ndGggPT09ICsrZWxlbWVudHNMb2FkZWQpIGRvbmUoZWxlbWVudHNMb2FkZWQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGlmIChlbGVtZW50cykge1xuICAgICAgICBpbmplY3RFbGVtZW50KGVsZW1lbnRzLCBldmFsU2NyaXB0cywgcG5nRmFsbGJhY2ssIGZ1bmN0aW9uIChzdmcpIHtcbiAgICAgICAgICBpZiAoZWFjaENhbGxiYWNrICYmIHR5cGVvZiBlYWNoQ2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGVhY2hDYWxsYmFjayhzdmcpO1xuICAgICAgICAgIGlmIChkb25lKSBkb25lKDEpO1xuICAgICAgICAgIGVsZW1lbnRzID0gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgaWYgKGRvbmUpIGRvbmUoMCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8qIGdsb2JhbCBtb2R1bGUsIGV4cG9ydHM6IHRydWUsIGRlZmluZSAqL1xuICAvLyBOb2RlLmpzIG9yIENvbW1vbkpTXG4gIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gU1ZHSW5qZWN0b3I7XG4gIH1cbiAgLy8gQU1EIHN1cHBvcnRcbiAgZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBTVkdJbmplY3RvcjtcbiAgICB9KTtcbiAgfVxuICAvLyBPdGhlcndpc2UsIGF0dGFjaCB0byB3aW5kb3cgYXMgZ2xvYmFsXG4gIGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnKSB7XG4gICAgd2luZG93LlNWR0luamVjdG9yID0gU1ZHSW5qZWN0b3I7XG4gIH1cbiAgLyogZ2xvYmFsIC1tb2R1bGUsIC1leHBvcnRzLCAtZGVmaW5lICovXG5cbn0od2luZG93LCBkb2N1bWVudCkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX3N2Z0luamVjdG9yID0gcmVxdWlyZSgnc3ZnLWluamVjdG9yJyk7XG5cbnZhciBfc3ZnSW5qZWN0b3IyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfc3ZnSW5qZWN0b3IpO1xuXG52YXIgX3Ntb290aHNjcm9sbCA9IHJlcXVpcmUoJ3Ntb290aHNjcm9sbCcpO1xuXG52YXIgX3Ntb290aHNjcm9sbDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9zbW9vdGhzY3JvbGwpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG53aW5kb3cub25sb2FkID0gZnVuY3Rpb24gKCkge1xuXG4gIHN2Z0luamVjdCgpO1xuICBkZWxlZ2F0ZU1lbnUoKTtcbiAgZW5hYmxlU21vb3RoU2Nyb2xsKCk7XG59O1xuXG5mdW5jdGlvbiBlbmFibGVTbW9vdGhTY3JvbGwoKSB7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKGUudGFyZ2V0ICYmIGUudGFyZ2V0Lm5vZGVOYW1lID09PSBcIkFcIikge1xuICAgICAgdmFyIGlkID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdocmVmJyk7XG4gICAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoaWQpO1xuICAgICAgKDAsIF9zbW9vdGhzY3JvbGwyLmRlZmF1bHQpKGVsZW1lbnQsIDEwMDApO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGRlbGVnYXRlTWVudSgpIHtcbiAgdmFyIG1lbnUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLnBhZ2UtaGVhZGVyX19tZW51XCIpO1xuICBpZiAobWVudSkge1xuICAgIG1lbnVbMF0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuICAgICAgaWYgKGUudGFyZ2V0ICYmIChlLnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoXCJtZW51X19tZW51LWJ1dHRvblwiKSB8fCBlLnRhcmdldC5wYXJlbnRFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyhcIm1lbnVfX21lbnUtYnV0dG9uXCIpKSkge1xuICAgICAgICB0b2dnbGVNZW51KCk7XG4gICAgICB9XG4gICAgICBpZiAoZS50YXJnZXQgJiYgKGUudGFyZ2V0Lm5vZGVOYW1lID09PSBcIkFcIiB8fCBlLnRhcmdldC5wYXJlbnRFbGVtZW50Lm5vZGVOYW1lID09PSBcIkxJXCIpKSB7XG4gICAgICAgIHRvZ2dsZU1lbnUoKTtcbiAgICAgIH1cbiAgICB9LCBmYWxzZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc3ZnSW5qZWN0KCkge1xuICB2YXIgbXlTVkdzVG9JbmplY3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdpbWcuc3ZnJyk7XG4gICgwLCBfc3ZnSW5qZWN0b3IyLmRlZmF1bHQpKG15U1ZHc1RvSW5qZWN0KTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5wYWdlLWxvYWRlci13cmFwcGVyXCIpWzBdLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbn1cblxuZnVuY3Rpb24gdG9nZ2xlTWVudSgpIHtcbiAgdmFyIG1lbnVMaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5tZW51X19tZW51LWxpc3RcIik7XG4gIHZhciBidXJnZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLm1lbnVfX21lbnUtaWNvblwiKTtcblxuICBpZiAobWVudUxpc3QgJiYgYnVyZ2VyKSB7XG4gICAgbWVudUxpc3RbMF0uY2xhc3NMaXN0LnRvZ2dsZSgnb3BlbmVkJyk7XG4gICAgaWYgKG1lbnVMaXN0WzBdLmNsYXNzTGlzdC5jb250YWlucygnb3BlbmVkJykpIHtcbiAgICAgIGJ1cmdlclswXS5zZXRBdHRyaWJ1dGUoJ3NyYycsICdzdmcvY2xvc2Uuc3ZnJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJ1cmdlclswXS5zZXRBdHRyaWJ1dGUoJ3NyYycsICdzdmcvbWVudS5zdmcnKTtcbiAgICB9XG4gIH1cbn0iXX0=

//# sourceMappingURL=index.js.map
