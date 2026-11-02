/* The live knob in "How it works". Same rules as the firmware:
   a high-risk request needs a full 360-degree wind, then a press within 5 s;
   presses in the first 0.7 s are ignored; holding the button denies;
   a double press denies a high-risk request. One detent = 15 degrees. */
(function () {
  "use strict";

  var DETENT = 15, FULL = 360, ARM_MS = 5000, GLANCE_MS = 700, HOLD_MS = 650, DOUBLE_MS = 450;

  var CASES = {
    high: {
      agent: "Codex · web-app", tier: "High risk",
      cmd: "git push --force origin main", why: "Rewrites shared history on main",
      tab: "tab-high"
    },
    normal: {
      agent: "Claude Code · api-server", tier: "Normal",
      cmd: "npm run test -- --coverage", why: "Runs the test suite inside the project",
      tab: "tab-normal"
    }
  };

  var demo = document.getElementById("demo");
  if (!demo) return;
  var $ = function (id) { return document.getElementById(id); };
  var screen = demo.querySelector(".screen");
  var knob = $("knob"), rot = $("knob-rot"), press = $("press"), again = $("again");
  var ticksGroup = knob.querySelector(".knob__ticks");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 24 detent marks around the knob
  var ticks = [];
  for (var i = 0; i < 24; i++) {
    var a = (i * 15 - 90) * Math.PI / 180;
    var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", 60 + Math.cos(a) * 52); line.setAttribute("y1", 60 + Math.sin(a) * 52);
    line.setAttribute("x2", 60 + Math.cos(a) * 57); line.setAttribute("y2", 60 + Math.sin(a) * 57);
    ticksGroup.appendChild(line);
    ticks.push(line);
  }

  var s = {};

  function start(name) {
    clearInterval(s.timer);
    s = { kase: name, wind: 0, turned: 0, choice: "allow", armedUntil: 0, shownAt: Date.now(),
          lastPress: 0, done: false, timer: 0 };
    var c = CASES[name];
    demo.dataset.case = name;
    $("d-agent").textContent = c.agent;
    $("d-tier").textContent = c.tier;
    $("d-cmd").textContent = c.cmd;
    $("d-why").textContent = c.why;
    $("d-meter-wrap").hidden = name !== "high";
    $("d-choice").hidden = name !== "normal";
    Object.keys(CASES).forEach(function (k) {
      $(CASES[k].tab).setAttribute("aria-selected", String(k === name));
    });
    screen.classList.remove("is-armed", "is-done", "is-denied");
    again.hidden = true;
    press.disabled = false;
    hint(name === "high" ? "Wind the big knob a full turn" : "Knob on Allow. Press to run it.");
    light(name === "high" ? "risk" : "wait");
    draw();
  }

  function light(v) { demo.dataset.light = v; }
  function hint(text) { $("d-hint").textContent = text; }

  function draw() {
    rot.setAttribute("transform", "rotate(" + s.turned + " 60 60)");
    var lit = s.kase === "high" ? Math.round(s.wind / DETENT) : 0;
    ticks.forEach(function (t, i) { t.classList.toggle("is-lit", i < lit); });
    if (s.kase === "high") {
      $("d-deg").textContent = Math.round(s.wind) + "°";
      $("d-meter").style.width = (s.wind / FULL * 100) + "%";
      knob.setAttribute("aria-valuenow", String(Math.round(s.wind)));
      knob.setAttribute("aria-valuetext", Math.round(s.wind) + " of 360 degrees");
    } else {
      $("d-allow").classList.toggle("is-on", s.choice === "allow");
      $("d-deny").classList.toggle("is-on", s.choice === "deny");
      knob.setAttribute("aria-valuenow", s.choice === "allow" ? "360" : "0");
      knob.setAttribute("aria-valuetext", s.choice === "allow" ? "Allow" : "Deny");
    }
  }

  function turn(steps) {
    if (s.done || !steps) return;
    s.turned += steps * DETENT;
    if (s.kase === "high") {
      if (s.armedUntil) { draw(); return; }
      s.wind = Math.max(0, Math.min(FULL, s.wind + steps * DETENT));
      if (s.wind >= FULL) arm();
      else hint(s.wind > 0 ? "Keep turning to arm" : "Wind the big knob a full turn");
    } else {
      s.choice = steps > 0 ? "allow" : "deny";
      hint(s.choice === "allow" ? "Knob on Allow. Press to run it." : "Knob on Deny. Press to refuse it.");
    }
    draw();
  }

  function arm() {
    s.armedUntil = Date.now() + ARM_MS;
    screen.classList.add("is-armed");
    light("wait");
    tick();
    s.timer = setInterval(tick, 200);
  }

  function tick() {
    var left = s.armedUntil - Date.now();
    if (left <= 0) {
      clearInterval(s.timer);
      s.armedUntil = 0;
      s.wind = 0;
      screen.classList.remove("is-armed");
      light("risk");
      hint("Five seconds passed. Wind it again.");
      draw();
      return;
    }
    hint("Armed. Press within " + Math.ceil(left / 1000) + " s");
  }

  function nope(text) {
    hint(text);
    if (reduceMotion) return;
    screen.classList.remove("is-nope");
    void screen.offsetWidth;
    screen.classList.add("is-nope");
  }

  function finish(allowed) {
    clearInterval(s.timer);
    s.done = true;
    s.armedUntil = 0;
    screen.classList.remove("is-armed");
    screen.classList.add(allowed ? "is-done" : "is-denied");
    var agent = CASES[s.kase].agent.split(" · ")[0];
    hint(allowed ? "Allowed. " + agent + " runs it." : "Denied. " + agent + " was told no.");
    light(allowed ? "done" : "off");
    press.disabled = true;
    again.hidden = false;
  }

  function onPress() {
    if (s.done) return;
    var now = Date.now();
    if (now - s.shownAt < GLANCE_MS) { nope("Too quick. Read the command first."); return; }
    if (s.kase === "normal") { finish(s.choice === "allow"); return; }
    if (s.armedUntil) { finish(true); return; }
    if (now - s.lastPress < DOUBLE_MS) { finish(false); return; }
    s.lastPress = now;
    nope("Wind the knob a full turn first");
  }

  // ------------------------------------------------ knob input
  var drag = null;
  function angleAt(e) {
    var r = knob.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
  }
  knob.addEventListener("pointerdown", function (e) {
    drag = { last: angleAt(e), acc: 0 };
    knob.setPointerCapture(e.pointerId);
    knob.focus({ preventScroll: true });
    e.preventDefault();
  });
  knob.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var a = angleAt(e), d = a - drag.last;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    drag.last = a;
    drag.acc += d;
    var steps = drag.acc > 0 ? Math.floor(drag.acc / DETENT) : Math.ceil(drag.acc / DETENT);
    if (steps) { drag.acc -= steps * DETENT; turn(steps); }
  });
  function endDrag() { drag = null; }
  knob.addEventListener("pointerup", endDrag);
  knob.addEventListener("pointercancel", endDrag);

  var wheelAcc = 0;
  knob.addEventListener("wheel", function (e) {
    e.preventDefault();
    wheelAcc += e.deltaY;
    var steps = wheelAcc > 0 ? Math.floor(wheelAcc / 40) : Math.ceil(wheelAcc / 40);
    if (steps) { wheelAcc -= steps * 40; turn(steps); }
  }, { passive: false });

  knob.addEventListener("keydown", function (e) {
    var map = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 6, PageDown: -6 };
    if (map[e.key]) { e.preventDefault(); turn(map[e.key]); }
  });

  // ------------------------------------------------ button: press, or hold to deny
  var hold = null;
  function setHold(v) { press.style.setProperty("--hold", String(v)); }
  press.addEventListener("pointerdown", function (e) {
    if (s.done || e.button > 0) return;
    press.setPointerCapture(e.pointerId);
    press.classList.add("is-down");
    hold = { t0: performance.now(), fired: false, raf: 0 };
    var step = function (t) {
      if (!hold) return;
      var p = Math.min(1, (t - hold.t0) / HOLD_MS);
      setHold(p);
      if (p >= 1 && !hold.fired) { hold.fired = true; setHold(0); finish(false); return; }
      hold.raf = requestAnimationFrame(step);
    };
    hold.raf = requestAnimationFrame(step);
  });
  function release(fire) {
    if (!hold) return;
    cancelAnimationFrame(hold.raf);
    var fired = hold.fired;
    hold = null;
    setHold(0);
    press.classList.remove("is-down");
    if (fire && !fired) onPress();
  }
  press.addEventListener("pointerup", function () { release(true); });
  press.addEventListener("pointercancel", function () { release(false); });
  press.addEventListener("click", function (e) {
    if (e.detail === 0) onPress();          // keyboard: Enter or Space
  });

  again.addEventListener("click", function () { start(s.kase); press.focus(); });
  document.querySelectorAll(".seg [data-case]").forEach(function (b) {
    b.addEventListener("click", function () { start(b.dataset.case); });
  });

  start("high");
})();
