import smoothScroll from 'smoothscroll';
import SVGInjector from 'svg-injector';

export function enableSmoothScroll() {
  window.addEventListener('click', e => {
    if (e.target && e.target.nodeName === "A") {
      let id = e
        .target
        .getAttribute('href');
      let element = document.querySelector(id);
      smoothScroll(element, 1000);
    }
  });
}

export function svgInject() {
  const mySVGsToInject = document.querySelectorAll('img.svg');
  SVGInjector(mySVGsToInject);
  document.querySelectorAll(".page-loader-wrapper")[0].style.display = "none";
}

