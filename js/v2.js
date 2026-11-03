/* Detent site v2: hero field, scroll story, reveals, glow, tabs, FAQ. No dependencies. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------- nav */
  var nav = $("#nav"), menu = $("#menu");
  function onScroll() { nav.classList.toggle("is-scrolled", window.scrollY > 24); }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  menu.addEventListener("click", function () {
    var open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    menu.setAttribute("aria-expanded", String(open));
  });
  $$("#nav-links a").forEach(function (a) {
    a.addEventListener("click", function () { nav.classList.remove("is-open"); menu.setAttribute("aria-expanded", "false"); });
  });

  /* ---------------------------------------------------------------- hero field
     Lanes of agent actions flow left to right. Everyday ones pass the gate.
     Risky ones stop at the gate, glow, wait for a person, then go on. */
  var canvas = $("#field");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d"), W = 0, H = 0, dpr = 1, lanes = [], packets = [], gateX = 0, last = 0, visible = true;
    var hero = $(".hero");
    function size() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var gp = W < 860 ? .78 : .64;
      gateX = W * gp;
      hero.style.setProperty("--gate", (gp * 100) + "%");
      var n = W < 600 ? 9 : 14, top = H * .12, span = H * .8;
      lanes = [];
      for (var i = 0; i < n; i++) lanes.push({ y: top + span * (i + .5) / n, speed: 60 + Math.random() * 70, next: Math.random() * 1.5 });
      packets = [];
    }
    function spawn(l) {
      var risky = Math.random() < .09;
      packets.push({ lane: l, x: -20, v: l.speed * (risky ? 1 : .8 + Math.random() * .5), risky: risky, state: "run", t: 0, len: 18 + Math.random() * 46, a: .25 + Math.random() * .45 });
    }
    function frame(ts) {
      var dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts;
      ctx.clearRect(0, 0, W, H);
      // lane hairlines
      ctx.lineWidth = 1;
      for (var i = 0; i < lanes.length; i++) {
        var l = lanes[i];
        ctx.strokeStyle = "rgba(255,255,255,.035)";
        ctx.beginPath(); ctx.moveTo(0, l.y + .5); ctx.lineTo(W, l.y + .5); ctx.stroke();
        l.next -= dt;
        if (l.next <= 0) { spawn(l); l.next = .5 + Math.random() * 1.8; }
      }
      for (var j = packets.length - 1; j >= 0; j--) {
        var p = packets[j], y = p.lane.y;
        if (p.state === "run") {
          var nx = p.x + p.v * dt;
          if (p.risky && p.x < gateX - 6 && nx >= gateX - 6) { nx = gateX - 6; p.state = "wait"; p.t = 0; }
          p.x = nx;
        } else if (p.state === "wait") {
          p.t += dt;
          if (p.t > 1.6 + Math.random() * .02) { p.state = "go"; p.v *= 1.4; }
        } else { p.x += p.v * dt; }
        if (p.x - p.len > W + 20) { packets.splice(j, 1); continue; }
        var past = p.x > gateX;
        if (p.risky) {
          var col = p.state === "go" && past ? "127,209,168" : "240,122,53";
          var g = ctx.createLinearGradient(p.x - p.len * 1.6, 0, p.x, 0);
          g.addColorStop(0, "rgba(" + col + ",0)"); g.addColorStop(1, "rgba(" + col + ",.9)");
          ctx.strokeStyle = g; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(p.x - (p.state === "wait" ? 8 : p.len * 1.6), y); ctx.lineTo(p.x, y); ctx.stroke();
          var pulse = p.state === "wait" ? (Math.sin(p.t * 7) * .5 + .5) : 0;
          ctx.fillStyle = "rgba(" + col + ",1)";
          ctx.shadowColor = "rgba(" + col + ",.9)"; ctx.shadowBlur = 14 + pulse * 18;
          ctx.beginPath(); ctx.arc(p.x, y, 3 + pulse * 1.5, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
          if (p.state === "wait") {
            ctx.strokeStyle = "rgba(240,122,53," + (.5 - p.t * .25) + ")"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(p.x, y, 6 + p.t * 14, 0, Math.PI * 2); ctx.stroke();
          }
        } else {
          var gw = ctx.createLinearGradient(p.x - p.len, 0, p.x, 0);
          gw.addColorStop(0, "rgba(237,237,239,0)"); gw.addColorStop(1, "rgba(237,237,239," + p.a + ")");
          ctx.strokeStyle = gw; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(p.x - p.len, y); ctx.lineTo(p.x, y); ctx.stroke();
        }
      }
      if (visible && !reduce) requestAnimationFrame(frame);
    }
    size();
    window.addEventListener("resize", function () { size(); if (reduce) prefill(); });
    function prefill() {   // a still frame for reduced motion
      for (var k = 0; k < 400; k++) frame(k * 33);
    }
    function warm() {      // start with the lanes already busy
      var saveVis = visible; visible = false;
      for (var k = 0; k < 220; k++) frame(k * 33);
      visible = saveVis; last = 0;
    }
    if (reduce) prefill();
    else {
      warm();
      new IntersectionObserver(function (es) {
        var was = visible; visible = es[0].isIntersecting;
        if (visible && !was) { last = 0; requestAnimationFrame(frame); }
      }).observe(hero);
      requestAnimationFrame(frame);
    }
  }

  /* ---------------------------------------------------------------- reveals, staggered 20 ms */
  var groups = new Map();
  $$("[data-reveal]").forEach(function (el) {
    var parent = el.parentElement, n = groups.get(parent) || 0;
    el.style.setProperty("--i", String(n));
    groups.set(parent, n + 1);
  });
  if ("IntersectionObserver" in window && !reduce) {
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); ro.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: .08 });
    $$("[data-reveal]").forEach(function (el) { ro.observe(el); });
  } else $$("[data-reveal]").forEach(function (el) { el.classList.add("is-in"); });

  /* ---------------------------------------------------------------- cursor-tracking glow */
  $$("[data-glow]").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px");
      el.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* ---------------------------------------------------------------- sliding pills */
  function pill(list, pillEl) {
    function place() {
      var on = $("[aria-selected='true']", list);
      if (!on) return;
      pillEl.style.width = on.offsetWidth + "px";
      pillEl.style.transform = "translateX(" + on.offsetLeft + "px)";
    }
    place();
    new MutationObserver(place).observe(list, { attributes: true, subtree: true, attributeFilter: ["aria-selected"] });
    window.addEventListener("resize", place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  }
  var seg = $(".seg"); if (seg) pill(seg, $(".seg__pill", seg));

  /* ---------------------------------------------------------------- tabs */
  var tl = $(".tabs__list");
  if (tl) {
    var tabs = $$("[role='tab']", tl);
    pill(tl, $(".tabs__pill", tl));
    function select(t, focus) {
      var oldIdx = tabs.findIndex(function (x) { return x.getAttribute("aria-selected") === "true"; });
      var idx = tabs.indexOf(t);
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute("aria-selected", String(on));
        x.tabIndex = on ? 0 : -1;
        var p = document.getElementById(x.getAttribute("aria-controls"));
        p.hidden = !on;
        if (on) { p.style.setProperty("--from", (idx > oldIdx ? 24 : -24) + "px"); p.style.animation = "none"; void p.offsetWidth; p.style.animation = ""; }
      });
      if (focus) t.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t); });
      t.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
      });
    });
  }

  /* ---------------------------------------------------------------- scroll story */
  var panel = $("#panel"), feed = $("#feed"), count = $("#count");
  if (panel && feed) {
    var ACTIONS = [
      ["Claude Code", "cat src/billing/refund.ts", 0], ["Codex", "npm test", 1], ["Cursor", "git status", 0],
      ["Claude Code", "pip install -r requirements.txt", 1], ["Devin", "rg \"TODO\" src", 0], ["Codex", "git diff main", 0],
      ["Gemini CLI", "pytest -q tests/api", 1], ["Claude Code", "edit src/api/routes.ts", 1], ["Codex", "git push --force origin main", 2],
      ["Cursor", "ls -la migrations", 0], ["Copilot CLI", "npm run build", 1], ["Claude Code", "kubectl --context prod rollout restart deploy/api", 2],
      ["Devin", "cat README.md", 0], ["Codex", "go test ./...", 1], ["Gemini CLI", "stripe refunds create --charge ch_3P", 2],
      ["Cursor", "edit web/app/page.tsx", 1], ["Claude Code", "git log --oneline -20", 0], ["Copilot CLI", "terraform apply", 2]
    ];
    var LVL = ["Read only", "Normal", "High risk"], k = 0, n = 0, target = 1243;
    function add() {
      var a = ACTIONS[k++ % ACTIONS.length];
      var li = document.createElement("li");
      if (a[2] === 2) li.className = "is-risk";
      li.innerHTML = "<span class='who'></span><code></code><span class='lvl lvl--" + a[2] + "'>" + LVL[a[2]] + "</span>";
      li.firstChild.textContent = a[0]; li.children[1].textContent = a[1];
      feed.insertBefore(li, feed.firstChild);
      while (feed.children.length > 16) feed.removeChild(feed.lastChild);
    }
    for (var i = 0; i < 12; i++) add();
    var feedTimer = 0;
    function startFeed() { if (!feedTimer && !reduce) feedTimer = setInterval(add, 900); }
    function stopFeed() { clearInterval(feedTimer); feedTimer = 0; }
    function tickCount() {
      if (n < target) { n = Math.min(target, n + Math.ceil((target - n) / 18)); count.textContent = n.toLocaleString("en-US"); requestAnimationFrame(tickCount); }
    }
    var steps = $$(".step");
    function setStep(s) {
      if (panel.dataset.step === String(s)) return;
      panel.dataset.step = String(s);
      panel.style.setProperty("--heat", s === 2 || s === 3 ? "1" : "0");
      steps.forEach(function (st) { st.classList.toggle("is-on", st.dataset.step === String(s)); });
      if (s >= 3) stopFeed(); else startFeed();
      // restart the step's own animations each time it comes back
      if (s === 3 || s === 4) { var b = $(s === 3 ? ".ask" : ".chain", panel); b.style.display = "none"; void b.offsetWidth; b.style.display = ""; }
    }
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) setStep(+e.target.dataset.step); });
    }, { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach(function (s) { so.observe(s); });
    steps[0].classList.add("is-on");
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { tickCount(); if (+panel.dataset.step < 3) startFeed(); } else stopFeed();
    }).observe(panel);
  }

  /* ---------------------------------------------------------------- FAQ: animated open and close */
  $$(".faq details").forEach(function (d) {
    var s = $("summary", d);
    s.addEventListener("click", function (e) {
      e.preventDefault();
      if (d.open) {
        d.classList.remove("is-open");
        setTimeout(function () { if (!d.classList.contains("is-open")) d.open = false; }, reduce ? 0 : 450);
      } else {
        d.open = true;
        requestAnimationFrame(function () { requestAnimationFrame(function () { d.classList.add("is-open"); }); });
      }
    });
  });
})();
