import {delegateMenu} from './menu.js';
import {svgInject, enableSmoothScroll} from './utils.js'


window.onload = () => {

svgInject();
delegateMenu();
enableSmoothScroll();

};
