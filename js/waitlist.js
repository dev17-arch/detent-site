/* Waitlist. Entries go to the Detent Google Form, so anyone can join without an account.
   The page checks the email, then opens the form in a new tab with every answer filled
   in; the visitor presses Submit there. If the new tab is blocked, a link does the same. */
(function () {
  "use strict";

  var FORM = "https://docs.google.com/forms/d/e/1FAIpQLSfOgdW-DH60N5YJgamcOcKZ4h52SqnOv2nl8qDsDvSRBkydCw/";
  var F_EMAIL = "entry.1959141737";
  var F_AGENTS = "entry.361403345";
  var F_RUNS = "entry.1222738898";
  var RUNS = { "1": "1", "2-3": "2 to 3", "4+": "4 or more" };

  var form = document.getElementById("wl-form");
  if (!form) return;
  var email = document.getElementById("wl-email");
  var emailMsg = document.getElementById("wl-email-msg");
  var submit = document.getElementById("wl-submit");
  var status = document.getElementById("wl-status");
  var done = document.getElementById("wl-done");
  var doneEmail = document.getElementById("wl-done-email");
  var again = document.getElementById("wl-again");

  var EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
  var busy = false;

  function say(el, text, isError) {
    el.textContent = text;
    el.classList.toggle("is-error", !!isError);
  }

  function validEmail() {
    var v = email.value.trim();
    var problem = "";
    if (!v) problem = "Enter your email address.";
    else if (v.length > 254) problem = "That address is too long.";
    else if (!EMAIL.test(v)) problem = "That doesn't look like an email address. Check for a missing @ or dot.";
    emailMsg.textContent = problem;
    email.setAttribute("aria-invalid", problem ? "true" : "false");
    return problem ? null : v;
  }

  email.addEventListener("blur", function () { if (email.value.trim()) validEmail(); });
  email.addEventListener("input", function () {
    if (email.getAttribute("aria-invalid") === "true") validEmail();
  });

  function answers(address) {
    var p = new URLSearchParams();
    p.append(F_EMAIL, address);
    Array.prototype.forEach.call(form.querySelectorAll('input[name="agents"]:checked'), function (c) {
      if (c.value === "Other") {
        p.append(F_AGENTS, "__other_option__");
        p.append(F_AGENTS + ".other_option_response", "Something else");
      } else {
        p.append(F_AGENTS, c.value);
      }
    });
    var runs = RUNS[document.getElementById("wl-runs").value];
    if (runs) p.append(F_RUNS, runs);
    return p;
  }

  function showDone(address) {
    doneEmail.textContent = address;
    form.hidden = true;
    done.hidden = false;
  }

  function fallback(params) {
    params.append("usp", "pp_url");
    status.textContent = "";
    status.classList.add("is-error");
    status.appendChild(document.createTextNode("Your browser blocked the new tab. "));
    var a = document.createElement("a");
    a.href = FORM + "viewform?" + params.toString();
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = "Finish joining on Google Forms";
    status.appendChild(a);
    status.appendChild(document.createTextNode(", your answers are already filled in."));
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (busy) return;
    var address = validEmail();
    if (!address) { email.focus(); return; }
    address = address.toLowerCase();
    var params = answers(address);

    // Open the Google Form with the answers filled in. This has to happen inside the click,
    // or the browser treats it as a pop-up and blocks it.
    params.append("usp", "pp_url");
    var win = null;
    try { win = window.open(FORM + "viewform?" + params.toString(), "_blank"); } catch (err) { win = null; }
    if (!win) { fallback(answers(address)); return; }
    try { win.opener = null; } catch (err) { /* cross-origin already, nothing to clear */ }
    say(status, "");
    showDone(address);
  });

  if (again) again.addEventListener("click", function () {
    form.reset();
    done.hidden = true;
    form.hidden = false;
    email.focus();
  });
})();
