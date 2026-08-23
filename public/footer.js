/* Shared site footer — injected on every page.
   Self-contained: styles + markup + aurora glow + scroll-to-top + CMS contact overrides. */
(function () {
  "use strict";

  var CMS_API_URL =
    location.protocol === "file:" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1"
      ? "http://localhost:4000/api"
      : "/api";

  var page = location.pathname.split("/").pop();
  var home = page === "" || page === "index.html" ? "" : "index.html";

  var CSS = [
    "#site-footer{position:relative;overflow:hidden;background:#050b18;width:100%;padding:48px 0 32px;font-family:Inter,ui-sans-serif,system-ui,sans-serif;box-sizing:border-box}",
    "@media(min-width:768px){#site-footer{padding:64px 0 48px}}",
    "#site-footer *{box-sizing:border-box}",
    "#site-footer .sf-wrap{max-width:1280px;margin:0 auto;padding:0 16px;position:relative;z-index:10}",
    "@media(min-width:768px){#site-footer .sf-wrap{padding:0 32px}}",
    "#site-footer .sf-grid{display:grid;grid-template-columns:1fr;gap:32px}",
    "@media(min-width:640px){#site-footer .sf-grid{grid-template-columns:repeat(3,1fr);gap:40px}}",
    "#site-footer h4{margin:0 0 12px;font-size:12px;line-height:1.4;color:#7df4ff;text-transform:uppercase;letter-spacing:.1em;font-weight:600}",
    "@media(min-width:768px){#site-footer h4{font-size:14px;margin-bottom:16px}}",
    "#site-footer ul{list-style:none;margin:0;padding:0}",
    "#site-footer li+li{margin-top:8px}",
    "#site-footer a{color:rgba(255,255,255,.5);text-decoration:none;font-size:14px;transition:color .2s ease}",
    "@media(min-width:768px){#site-footer a{font-size:16px}}",
    "#site-footer a:hover{color:#fff}",
    "#site-footer .sf-contact{display:flex;flex-direction:column;gap:12px}",
    "#site-footer .sf-contact a{display:flex;align-items:center;gap:8px}",
    "#site-footer .sf-contact svg{width:16px;height:16px;flex-shrink:0}",
    "#site-footer .sf-bottom{margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,.1);display:flex;flex-direction:column;align-items:center;justify-content:space-between;gap:16px}",
    "@media(min-width:640px){#site-footer .sf-bottom{flex-direction:row}}",
    "@media(min-width:768px){#site-footer .sf-bottom{margin-top:56px;padding-top:32px}}",
    "#site-footer .sf-bottom p,#site-footer .sf-status{margin:0;color:rgba(255,255,255,.4);font-size:12px}",
    "@media(min-width:768px){#site-footer .sf-bottom p,#site-footer .sf-status{font-size:14px}}",
    "#site-footer .sf-status{display:flex;align-items:center;gap:8px}",
    "#site-footer .sf-dot{width:8px;height:8px;border-radius:9999px;background:#7df4ff;box-shadow:0 0 8px #7df4ff;animation:sf-pulse 2s cubic-bezier(.4,0,.6,1) infinite}",
    "@keyframes sf-pulse{0%,100%{opacity:1}50%{opacity:.4}}",
    "#footer-aurora{position:absolute;bottom:-60px;left:0;right:0;height:160px;background:radial-gradient(55% 100% at 15% 100%,#1facb6 0%,transparent 65%),radial-gradient(50% 100% at 50% 100%,#7df4ff 0%,transparent 60%),radial-gradient(55% 100% at 85% 100%,#3a5f94 0%,transparent 65%);filter:blur(45px) saturate(1.3);opacity:.28;transform:scaleY(.55);transform-origin:bottom;transition:opacity 1.4s ease,transform 1.4s ease,filter 1.4s ease;pointer-events:none;z-index:1}",
    "#footer-aurora.in-view{opacity:.95;transform:scaleY(1);filter:blur(55px) saturate(1.6);animation:footer-aurora-pulse 7s ease-in-out infinite alternate}",
    "@keyframes footer-aurora-pulse{0%{filter:blur(50px) saturate(1.5) hue-rotate(0deg)}100%{filter:blur(65px) saturate(1.8) hue-rotate(12deg)}}",
    "#scroll-to-top.sf-scroll-top{position:fixed;right:20px;bottom:20px;width:48px;height:48px;border:0;border-radius:9999px;background:#1facb6;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:0;visibility:hidden;transform:translateY(12px);transition:opacity .3s ease,transform .3s ease,visibility .3s ease;box-shadow:0 10px 30px rgba(31,172,182,.45);z-index:60}",
    "#scroll-to-top.sf-scroll-top.visible{opacity:1;visibility:visible;transform:translateY(0)}",
    "#scroll-to-top.sf-scroll-top:hover{background:#7df4ff;color:#00363a}",
  ].join("");

  var MAIL_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>';
  var PHONE_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h1.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>';

  var HTML =
    '<div class="sf-wrap sf-grid">' +
    "<div><h4>Company</h4><ul>" +
    '<li><a href="' + home + '#why-us">About Us</a></li>' +
    '<li><a href="' + home + '#process">Our Process</a></li>' +
    "</ul></div>" +
    "<div><h4>Support</h4><ul>" +
    '<li><a href="privacy-policy.html">Privacy Policy</a></li>' +
    '<li><a href="terms-of-service.html">Terms of Service</a></li>' +
    '<li><a href="faq.html">FAQ</a></li>' +
    "</ul></div>" +
    '<div><h4>Contact</h4><div class="sf-contact">' +
    '<a id="cms-contact-email" href="mailto:pacificduct021@gmail.com">' +
    MAIL_ICON +
    "<span data-cms-text>pacificduct021@gmail.com</span></a>" +
    '<a id="cms-contact-phone" href="tel:+14698989044">' +
    PHONE_ICON +
    "<span data-cms-text>(469) 898-9044</span></a>" +
    "</div></div>" +
    "</div>" +
    '<div class="sf-wrap sf-bottom">' +
    "<p>&copy; 2026 Pacific Duct Systems. All rights reserved.</p>" +
    '<div class="sf-status"><span class="sf-dot"></span>Now Accepting Bookings</div>' +
    "<p>Remote &amp; On-Site Estimates Available</p>" +
    "</div>" +
    '<div id="footer-aurora" aria-hidden="true"></div>';

  function mount() {
    if (document.getElementById("site-footer")) return;

    var style = document.createElement("style");
    style.id = "site-footer-styles";
    style.textContent = CSS;
    document.head.appendChild(style);

    var footer = document.createElement("footer");
    footer.id = "site-footer";
    footer.innerHTML = HTML;

    var mountPoint = document.getElementById("site-footer-mount");
    if (mountPoint) mountPoint.remove();
    normalizeBodyLayout();
    document.body.appendChild(footer);

    initAurora();
    initScrollTop();
    loadContact();
  }

  /* Some pages make <body> the flex/grid layout container, which would squeeze the
     footer into a column beside the content. Move that layout onto a wrapper div so
     the footer can span the full page width. */
  function normalizeBodyLayout() {
    var body = document.body;
    var display = getComputedStyle(body).display;
    if (display !== "flex" && display !== "grid" && display !== "inline-flex") return;

    var wrapper = document.createElement("div");
    wrapper.className = body.className;
    wrapper.style.width = "100%";
    while (body.firstChild) wrapper.appendChild(body.firstChild);
    body.appendChild(wrapper);
    body.style.display = "block";
    body.style.padding = "0";
  }

  function initAurora() {
    var glow = document.getElementById("footer-aurora");
    var footer = document.getElementById("site-footer");
    if (!glow || !footer || !window.IntersectionObserver) return;
    new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          glow.classList.toggle("in-view", entry.isIntersecting);
        });
      },
      { threshold: 0.15 },
    ).observe(footer);
  }

  function initScrollTop() {
    if (document.getElementById("scroll-to-top")) return; // page has its own
    var btn = document.createElement("button");
    btn.id = "scroll-to-top";
    btn.className = "sf-scroll-top";
    btn.setAttribute("aria-label", "Scroll to top");
    btn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19V5m0 0l-6 6m6-6l6 6"/></svg>';
    document.body.appendChild(btn);
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    var toggle = function () {
      btn.classList.toggle("visible", window.scrollY > 320);
    };
    window.addEventListener("scroll", toggle, { passive: true });
    toggle();
  }

  function loadContact() {
    fetch(CMS_API_URL + "/content")
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.success || !data.content || !data.content.contact) return;
        var contact = data.content.contact;
        if (contact.email) {
          var mail = document.getElementById("cms-contact-email");
          if (mail) {
            mail.href = "mailto:" + contact.email;
            var ms = mail.querySelector("[data-cms-text]");
            if (ms) ms.textContent = contact.email;
          }
        }
        if (contact.phone) {
          var tel = document.getElementById("cms-contact-phone");
          if (tel) {
            tel.href = "tel:" + contact.phone.replace(/[^\d+]/g, "");
            var ts = tel.querySelector("[data-cms-text]");
            if (ts) ts.textContent = contact.phone;
          }
        }
      })
      .catch(function (err) {
        console.warn("CMS content unavailable, using defaults:", err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
