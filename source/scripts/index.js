import SVGInjector from 'svg-injector';
import smoothScroll from 'smoothscroll';



window.onload = () => {

svgInject();
document.querySelectorAll(".page-loader-wrapper")[0].style.display = "none";
delegateMenu();

};

function delegateMenu() {
  const menu = document.querySelectorAll(".page-header__menu");
  if (menu) {
    menu[0].addEventListener('click', (e) => {
      if (e.target &&
        (e.target.classList.contains("menu__menu-button") ||
          (e.target.parentElement.classList.contains("menu__menu-button")))) {
        toggleMenu();
      }
      if (e.target && (e.target.nodeName === "A" || e.target.parentElement.nodeName === "LI")) {

      const id = e.target.getAttribute('href');
      const element = document.querySelector(id)

      smoothScroll(element, 1000);
      toggleMenu();
      }
    }, false);
  }
}

function svgInject() {
  const mySVGsToInject = document.querySelectorAll('img.svg');
  const injectorOptions = {
    each: function (svg) {
      console.log('SVG injected: ' + svg.getAttribute('id'));
    }
  };
  SVGInjector(mySVGsToInject, injectorOptions, function (totalSVGsInjected) {
    console.log('We injected ' + totalSVGsInjected + ' SVG(s)!');
  });

}

function toggleMenu(){
  const menuList = document.querySelectorAll(".menu__menu-list");
  const burger = document.querySelectorAll(".menu__menu-icon");

  if (menuList && burger) {
    menuList[0].classList.toggle('opened');
    if (menuList[0].classList.contains('opened')) {
      burger[0].src = 'svg/close.svg';
    } else {
      burger[0].src = 'svg/menu.svg';
    }
  }
}

// function scrollTo(element, to, duration) {

//   var start = element.scrollTop,
//     change = to - start,
//     currentTime = 0,
//     increment = 20;

//   const animateScroll = function () {
//     currentTime += increment;
//     var val = Math.easeInOutQuad(currentTime, start, change, duration);
//     element.scrollTop = val;
//     if (currentTime < duration) {
//       setTimeout(animateScroll, increment);
//     }
//   };
//   animateScroll();
// }

// Math.easeInOutQuad = function (t, b, c, d) {
//   t /= d / 2;
//   if (t < 1)
//     return c / 2 * t * t + b;
//   t--;
//   return -c / 2 * (t * (t - 2) - 1) + b;
// };

