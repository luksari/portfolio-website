!function e(t,n,r){function o(a,s){if(!n[a]){if(!t[a]){var u="function"==typeof require&&require;if(!s&&u)return u(a,!0);if(i)return i(a,!0);var l=new Error("Cannot find module '"+a+"'");throw l.code="MODULE_NOT_FOUND",l}var c=n[a]={exports:{}};t[a][0].call(c.exports,function(e){var n=t[a][1][e];return o(n||e)},c,c.exports,e,t,n,r)}return n[a].exports}for(var i="function"==typeof require&&require,a=0;a<r.length;a++)o(r[a]);return o}({1:[function(e,t,n){!function(e,r){"use strict";"function"==typeof define&&define.amd?define(r):"object"==typeof n&&"object"==typeof t?t.exports=r():e.smoothScroll=r()}(this,function(){"use strict";if("object"==typeof window&&void 0!==document.querySelectorAll&&void 0!==window.pageYOffset&&void 0!==history.pushState){var e=function(e,t,n,r){return n>r?t:e+(t-e)*function(e){return e<.5?4*e*e*e:(e-1)*(2*e-2)*(2*e-2)+1}(n/r)},t=function(t,n,r,o){n=n||500;var i=(o=o||window).scrollTop||window.pageYOffset;if("number"==typeof t)a=parseInt(t);else var a=function(e,t){return"HTML"===e.nodeName?-t:e.getBoundingClientRect().top+t}(t,i);var s=Date.now(),u=window.requestAnimationFrame||window.mozRequestAnimationFrame||window.webkitRequestAnimationFrame||function(e){window.setTimeout(e,15)},l=function(){var c=Date.now()-s;o!==window?o.scrollTop=e(i,a,c,n):window.scroll(0,e(i,a,c,n)),c>n?"function"==typeof r&&r(t):u(l)};l()};return document.addEventListener("DOMContentLoaded",function(){for(var e,n=document.querySelectorAll('a[href^="#"]:not([href="#"])'),r=n.length;e=n[--r];)e.addEventListener("click",function(e){if(!e.defaultPrevented){e.preventDefault(),location.hash!==this.hash&&window.history.pushState(null,null,this.hash);var n=document.getElementById(this.hash.substring(1));if(!n)return;t(n,500,function(e){location.replace("#"+e.id)})}},!1)}),t}})},{}],2:[function(e,t,n){!function(e,r){"use strict";var o="file:"===e.location.protocol,i=r.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure","1.1"),a=Array.prototype.forEach||function(e,t){if(void 0===this||null===this||"function"!=typeof e)throw new TypeError;var n,r=this.length>>>0;for(n=0;n<r;++n)n in this&&e.call(t,this[n],n,this)},s={},u=0,l=[],c=[],f={},d=function(e){return e.cloneNode(!0)},p=function(e,t){c[e]=c[e]||[],c[e].push(t)},m=function(t,n,r,m){var v=t.getAttribute("data-src")||t.getAttribute("src");if(/\.svg/i.test(v))if(i)-1===l.indexOf(t)&&(l.push(t),t.setAttribute("src",""),function(t,n){if(void 0!==s[t])s[t]instanceof SVGSVGElement?n(d(s[t])):p(t,n);else{if(!e.XMLHttpRequest)return n("Browser does not support XMLHttpRequest"),!1;s[t]={},p(t,n);var r=new XMLHttpRequest;r.onreadystatechange=function(){if(4===r.readyState){if(404===r.status||null===r.responseXML)return n("Unable to load SVG file: "+t),o&&n("Note: SVG injection ajax calls do not work locally without adjusting security setting in your browser. Or consider using a local webserver."),n(),!1;if(!(200===r.status||o&&0===r.status))return n("There was a problem injecting the SVG: "+r.status+" "+r.statusText),!1;if(r.responseXML instanceof Document)s[t]=r.responseXML.documentElement;else if(DOMParser&&DOMParser instanceof Function){var e;try{var i=new DOMParser;e=i.parseFromString(r.responseText,"text/xml")}catch(t){e=void 0}if(!e||e.getElementsByTagName("parsererror").length)return n("Unable to parse SVG file: "+t),!1;s[t]=e.documentElement}!function(e){for(var t=0,n=c[e].length;t<n;t++)!function(t){setTimeout(function(){c[e][t](d(s[e]))},0)}(t)}(t)}},r.open("GET",t),r.overrideMimeType&&r.overrideMimeType("text/xml"),r.send()}}(v,function(r){if(void 0===r||"string"==typeof r)return m(r),!1;var o=t.getAttribute("id");o&&r.setAttribute("id",o);var i=t.getAttribute("title");i&&r.setAttribute("title",i);var s=[].concat(r.getAttribute("class")||[],"injected-svg",t.getAttribute("class")||[]).join(" ");r.setAttribute("class",function(e){for(var t={},n=(e=e.split(" ")).length,r=[];n--;)t.hasOwnProperty(e[n])||(t[e[n]]=1,r.unshift(e[n]));return r.join(" ")}(s));var c=t.getAttribute("style");c&&r.setAttribute("style",c);var d=[].filter.call(t.attributes,function(e){return/^data-\w[\w\-]*$/.test(e.name)});a.call(d,function(e){e.name&&e.value&&r.setAttribute(e.name,e.value)});var p,g,h,w,y,b={clipPath:["clip-path"],"color-profile":["color-profile"],cursor:["cursor"],filter:["filter"],linearGradient:["fill","stroke"],marker:["marker","marker-start","marker-mid","marker-end"],mask:["mask"],pattern:["fill","stroke"],radialGradient:["fill","stroke"]};Object.keys(b).forEach(function(e){p=e,h=b[e];for(var t=0,n=(g=r.querySelectorAll("defs "+p+"[id]")).length;t<n;t++){w=g[t].id,y=w+"-"+u;var o;a.call(h,function(e){for(var t=0,n=(o=r.querySelectorAll("["+e+'*="'+w+'"]')).length;t<n;t++)o[t].setAttribute(e,"url(#"+y+")")}),g[t].id=y}}),r.removeAttribute("xmlns:a");for(var A,S,j=r.querySelectorAll("script"),q=[],x=0,M=j.length;x<M;x++)(S=j[x].getAttribute("type"))&&"application/ecmascript"!==S&&"application/javascript"!==S||(A=j[x].innerText||j[x].textContent,q.push(A),r.removeChild(j[x]));if(q.length>0&&("always"===n||"once"===n&&!f[v])){for(var k=0,L=q.length;k<L;k++)new Function(q[k])(e);f[v]=!0}var _=r.querySelectorAll("style");a.call(_,function(e){e.textContent+=""}),t.parentNode.replaceChild(r,t),delete l[l.indexOf(t)],t=null,u++,m(r)}));else{var g=t.getAttribute("data-fallback")||t.getAttribute("data-png");g?(t.setAttribute("src",g),m(null)):r?(t.setAttribute("src",r+"/"+v.split("/").pop().replace(".svg",".png")),m(null)):m("This browser does not support SVG and no PNG fallback was defined.")}else m("Attempted to inject a file with a non-svg extension: "+v)},v=function(e,t,n){var r=(t=t||{}).evalScripts||"always",o=t.pngFallback||!1,i=t.each;if(void 0!==e.length){var s=0;a.call(e,function(t){m(t,r,o,function(t){i&&"function"==typeof i&&i(t),n&&e.length===++s&&n(s)})})}else e?m(e,r,o,function(t){i&&"function"==typeof i&&i(t),n&&n(1),e=null}):n&&n(0)};"object"==typeof t&&"object"==typeof t.exports?t.exports=n=v:"function"==typeof define&&define.amd?define(function(){return v}):"object"==typeof e&&(e.SVGInjector=v)}(window,document)},{}],3:[function(e,t,n){"use strict";var r=e("./menu.js"),o=e("./utils.js");window.onload=function(){(0,o.svgInject)(),(0,r.delegateMenu)(),(0,o.enableSmoothScroll)()}},{"./menu.js":4,"./utils.js":5}],4:[function(e,t,n){"use strict";function r(){var e=document.querySelectorAll(".menu__menu-list"),t=document.querySelectorAll(".menu__menu-icon");e&&t&&(e[0].classList.toggle("opened"),e[0].classList.contains("opened")?t[0].setAttribute("src","svg/close.svg"):t[0].setAttribute("src","svg/menu.svg"))}Object.defineProperty(n,"__esModule",{value:!0}),n.delegateMenu=function(){var e=document.querySelectorAll(".page-header__menu");e&&e[0].addEventListener("click",function(e){e.target&&(e.target.classList.contains("menu__menu-button")||e.target.parentElement.classList.contains("menu__menu-button"))?r():!e.target||"A"!==e.target.nodeName&&"LI"!==e.target.parentElement.nodeName&&"IMG"!==e.target.nodeName||r()},!1)}},{}],5:[function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(n,"__esModule",{value:!0}),n.enableSmoothScroll=function(){window.addEventListener("click",function(e){if(e.target&&"A"===e.target.nodeName){var t=e.target.getAttribute("href"),n=document.querySelector(t);(0,o.default)(n,1e3)}})},n.svgInject=function(){var e=document.querySelectorAll("img.svg");(0,i.default)(e),document.querySelectorAll(".page-loader-wrapper")[0].style.display="none"};var o=r(e("smoothscroll")),i=r(e("svg-injector"))},{smoothscroll:1,"svg-injector":2}]},{},[3]);
//# sourceMappingURL=index.js.map
