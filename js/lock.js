/* Scroll-locked knob: the section pins to the screen and scrolling winds the knob. */
(function () {
  "use strict";
  var sec = document.getElementById("lock");
  if (!sec) return;
  var dev = document.getElementById("lock-dev"), stage = dev.parentElement;
  var knob = document.getElementById("lock-knob"), arc = document.getElementById("lock-arc");
  var deg = document.getElementById("lock-deg"), meter = document.getElementById("lock-meter");
  var hint = document.getElementById("lock-hint"), done = document.getElementById("lock-done");
  var press = document.getElementById("lock-press"), bar = document.getElementById("lock-bar");
  var steps = Array.prototype.slice.call(sec.querySelectorAll(".lock__step"));
  var clamp = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var ease = function (x) { return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };
  var raf = 0;

  function fit() { dev.style.transform = "scale(" + (stage.clientWidth / 1400) + ")"; }

  function render() {
    raf = 0;
    var r = sec.getBoundingClientRect();
    var p = clamp(-r.top / Math.max(1, sec.offsetHeight - window.innerHeight));
    var turn = ease(clamp((p - .10) / .58));            // 10% to 68% of the scroll winds the knob
    var a = turn * 360;
    knob.style.transform = "rotate(" + a + "deg)";
    arc.setAttribute("stroke-dashoffset", String(779 * (1 - turn)));
    deg.textContent = Math.round(a);
    meter.style.width = (turn * 100) + "%";
    var pressed = p > .74 && p < .80, allowed = p >= .80;
    press.style.opacity = pressed ? 1 : 0;
    done.style.opacity = allowed ? 1 : 0;
    sec.classList.toggle("is-done", allowed);
    hint.textContent = turn < 1 ? "Wind the big knob a full turn" : "Press the button to allow";
    var k = p < .10 ? 0 : p < .70 ? 1 : p < .80 ? 2 : 3;
    steps.forEach(function (s, i) { s.classList.toggle("is-on", i === k); });
    bar.style.width = (p * 100) + "%";
  }

  function onScroll() { if (!raf) raf = requestAnimationFrame(render); }
  fit(); render();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { fit(); render(); });
})();
