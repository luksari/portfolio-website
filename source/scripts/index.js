import SVGInjector from 'svg-injector';
import smoothScroll from 'smoothscroll';


window.onload = () => {

svgInject();
delegateMenu();
enableSmoothScroll();
};

function enableSmoothScroll() {
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
      toggleMenu();
      }
    }, false);
  }
}

function svgInject() {
  const mySVGsToInject = document.querySelectorAll('img.svg');
  SVGInjector(mySVGsToInject);
  document.querySelectorAll(".page-loader-wrapper")[0].style.display = "none";
}

function toggleMenu(){
  const menuList = document.querySelectorAll(".menu__menu-list");
  const burger = document.querySelectorAll(".menu__menu-icon");

  if (menuList && burger) {
    menuList[0].classList.toggle('opened');
    if (menuList[0].classList.contains('opened')) {
      burger[0].setAttribute('src', 'svg/close.svg');
    } else {
      burger[0].setAttribute('src', 'svg/menu.svg');
    }
  }
}

