/* Small page behaviour: the phone menu and the finish picker. */
(function () {
  "use strict";

  // ------------------------------------------------ phone menu
  var menu = document.getElementById("menu");
  var nav = document.getElementById("nav");
  if (menu && nav) {
    var setOpen = function (open) {
      nav.classList.toggle("is-open", open);
      menu.setAttribute("aria-expanded", String(open));
      menu.textContent = open ? "Close" : "Menu";
    };
    menu.addEventListener("click", function () { setOpen(!nav.classList.contains("is-open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); menu.focus(); }
    });
  }

  // ------------------------------------------------ finish picker
  var FINISH = {
    graphite: { src: "img/hero_graphite.webp", w: 1800, h: 1060,
                alt: "Detent in graphite with steel knobs and an orange button." },
    silver: { src: "img/silver.webp", w: 1400, h: 940,
              alt: "Detent in silver with black knobs and a black button, its light bar glowing blue." }
  };
  var img = document.getElementById("finish-img");
  var opts = document.querySelectorAll(".finish__opt");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function pick(name) {
    var f = FINISH[name];
    if (!f || !img) return;
    opts.forEach(function (o) {
      var on = o.dataset.finish === name;
      o.setAttribute("aria-checked", String(on));
      o.tabIndex = on ? 0 : -1;
    });
    var swap = function () {
      img.src = f.src; img.width = f.w; img.height = f.h; img.alt = f.alt;
      img.classList.remove("is-fading");
    };
    if (reduce) { swap(); return; }
    img.classList.add("is-fading");
    setTimeout(swap, 220);
  }

  opts.forEach(function (o, i) {
    o.tabIndex = i === 0 ? 0 : -1;
    o.addEventListener("click", function () { pick(o.dataset.finish); });
    o.addEventListener("keydown", function (e) {
      if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].indexOf(e.key) < 0) return;
      e.preventDefault();
      var next = opts[(i + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : opts.length - 1)) % opts.length];
      next.focus();
      pick(next.dataset.finish);
    });
  });

  // preload the other finish so the swap is instant
  if (img) { var pre = new Image(); pre.src = FINISH.silver.src; }
})();
