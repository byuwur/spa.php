/* Shared opt-in privacy controls for SPA shells and standalone website pages. */
(() => {
  "use strict";
  const common = (window.byCommon ||= {});
  if (common.initPrivacyControls) return;

  // ===== CONTROL LINKS AND TRANSLATIONS =====
  const aliases = ["#privacy-controls", "#cookie-controls"];
  const initialHash = location.hash;
  const translations = {
    en: {
      title: "Your privacy",
      message: "Choose whether to allow optional analytics.",
      settings: "Privacy settings",
      accept: "Accept",
      reject: "Reject",
      close: "Close",
      privacy: "Privacy",
      cookies: "Cookies",
      accepted: "You have accepted analytics.",
      rejected: "You have rejected analytics."
    },
    es: {
      title: "Tu privacidad",
      message: "Elige si permites la analítica opcional.",
      settings: "Configuración de privacidad",
      accept: "Aceptar",
      reject: "Rechazar",
      close: "Cerrar",
      privacy: "Privacidad",
      cookies: "Cookies",
      accepted: "Has aceptado la analítica.",
      rejected: "Has rechazado la analítica."
    },
    ja: {
      title: "プライバシーについて",
      message: "任意のアクセス解析を許可するか選択してください。",
      settings: "プライバシー設定",
      accept: "許可",
      reject: "拒否",
      close: "閉じる",
      privacy: "プライバシー",
      cookies: "Cookie",
      accepted: "アクセス解析を許可しています。",
      rejected: "アクセス解析を拒否しています。"
    }
  };
  let controls;
  common.openPrivacyControls = (trigger) => controls?.open(trigger);

  // ===== PRIVACY PANEL =====
  // Hosts own consent and measurement. Omitting onChoice enables a tab-local preview.
  common.initPrivacyControls = ({ policyURL, cookiesURL, message, onChoice, dismissalDomain, theme } = {}) => {
    if (controls) return controls;
    const panel = document.createElement("aside");
    panel.id = "privacy-controls";
    panel.className = "by-privacy-panel";
    panel.setAttribute("aria-labelledby", "by-privacy-title");
    panel.innerHTML = /* HTML */ `<header><strong id="by-privacy-title"></strong><button type="button" data-close></button></header>
      <p data-message></p>
      <p data-links><a data-policy></a><span data-divider aria-hidden="true"> · </span><a data-cookies></a></p>
      <p id="by-privacy-status" data-status role="status" hidden></p>
      <div class="by-privacy-actions"><button type="button" data-choice="yes"></button><button type="button" data-choice="no"></button><button type="button" data-settings aria-controls="by-privacy-status"></button></div>`;
    const settings = panel.querySelector("[data-settings]");
    const status = panel.querySelector("[data-status]");
    const style = document.createElement("style");
    style.textContent = `
      .by-privacy-panel {
        color-scheme: light dark;
        --panel-bg: light-dark(#fff, #111);
        --panel-ink: light-dark(#212529, #e4e6e8);
        --panel-edge: light-dark(#b5b9bd, #53565a);
        position: fixed;
        right: .75rem;
        bottom: .75rem;
        z-index: 2147483645;
        box-sizing: border-box;
        width: min(28rem, calc(100% - 1.5rem));
        max-height: calc(100dvh - 1.5rem);
        overflow: auto;
        padding: .8rem .95rem;
        background: var(--panel-bg);
        color: var(--panel-ink);
        border: 1px solid var(--panel-edge);
        border-top: 2px solid light-dark(#972c35, #8b262d);
        border-radius: 0;
        box-shadow: 0 .2rem .75rem #0002;
        font: inherit;
        font-size: .875rem;
        line-height: 1.4;
        text-align: start;
      }
      .by-privacy-panel[data-theme="dark"] { color-scheme: dark; }
      .by-privacy-panel[data-theme="light"] { color-scheme: light; }
      [data-bs-theme="dark"] .by-privacy-panel { color-scheme: dark; }
      [data-bs-theme="light"] .by-privacy-panel { color-scheme: light; }
      :root:has(#themesheet[href$=".dark.css"]) .by-privacy-panel { color-scheme: dark; }
      :root:has(#themesheet[href$=".light.css"]) .by-privacy-panel { color-scheme: light; }
      .by-privacy-panel header, .by-privacy-actions { display: flex; align-items: center; gap: .45rem; }
      .by-privacy-panel header { justify-content: space-between; }
      .by-privacy-panel strong { font-size: 1rem; }
      .by-privacy-panel p { margin: .35rem 0 0; }
      .by-privacy-panel [data-links] { margin-top: .2rem; }
      .by-privacy-panel a { color: light-dark(#174e99, #91bfff); text-decoration: underline; }
      .by-privacy-actions { flex-wrap: wrap; margin-top: .65rem; }
      .by-privacy-panel button {
        --ink: var(--panel-ink);
        --fill: light-dark(#f5f5f5, #202020);
        --edge: var(--panel-edge);
        color: var(--ink);
        background: var(--fill);
        border: 1px solid var(--edge);
        border-radius: 0;
        padding: .28rem .6rem;
        font: inherit;
        font-size: .8125rem;
        line-height: 1.4;
        cursor: pointer;
      }
      .by-privacy-panel [data-choice="yes"] { --ink: light-dark(#14532d, #b8efca); --fill: light-dark(#e3f3e7, #173623); --edge: light-dark(#619072, #528561); }
      .by-privacy-panel [data-choice="no"] { --ink: light-dark(#85232f, #ffc4ca); --fill: light-dark(#fae6e8, #401f25); --edge: light-dark(#ac7178, #a4646d); }
      .by-privacy-panel [data-close] { --ink: light-dark(#444a50, #e2e4e7); --fill: light-dark(#eceef0, #303236); padding: .15rem .4rem; }
      .by-privacy-panel button:hover, .by-privacy-panel button[aria-pressed=true] { border-color: currentColor; }
      .by-privacy-panel :focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
      [data-privacy-inline] > .by-privacy-panel { position:static; width:100%; max-height:none; margin:0 0 1.25rem; box-shadow:none; }
      .by-privacy-panel[hidden],.by-privacy-panel [hidden] { display:none!important; }`;
    const link = panel.querySelector("[data-policy]");
    const cookies = panel.querySelector("[data-cookies]");
    if (cookiesURL) cookies.href = cookiesURL;
    if (policyURL) link.href = policyURL;
    // Follow the host theme; the OS preference applies when the host has none.
    try {
      const storedTheme = document.cookie.match(/(?:^|; )theme=(light|dark)(?:;|$)/)?.[1] || window.byStorage?.getItem("APP_THEME");
      if (["light", "dark"].includes(storedTheme)) panel.dataset.theme = storedTheme;
    } catch {
      // System colors and the host's theme attributes still work without storage.
    }
    if (theme === "light" || theme === "dark") panel.style.colorScheme = theme;
    const accept = panel.querySelector('[data-choice="yes"]');
    const reject = panel.querySelector('[data-choice="no"]');
    const close = panel.querySelector("[data-close]");
    const key = "byPrivacyPreview:" + (cookiesURL || policyURL || location.pathname);
    let preview = "",
      active = false,
      manual = false,
      dismissed = false,
      dismissedInline,
      opener,
      savedChoice;
    if (!onChoice) {
      try {
        preview = sessionStorage.getItem(key) || "";
      } catch {
        /* Storage can be disabled. */
      }
    }
    const dismissalKey = "byPrivacyDismissed";
    const dismissalDays = 180;
    function wasDismissed() {
      try {
        if (dismissalDomain && document.cookie.split("; ").includes(dismissalKey + "=1")) return true;
        return Number(localStorage.getItem(dismissalKey)) > Date.now();
      } catch {
        return false;
      }
    }
    function rememberDismissal() {
      dismissed = true;
      try {
        if (dismissalDomain) {
          document.cookie = dismissalKey + "=1; Domain=" + dismissalDomain + "; Path=/; Max-Age=" + dismissalDays * 86400 + "; Secure; SameSite=Lax";
          if (document.cookie.split("; ").includes(dismissalKey + "=1")) return;
        }
        localStorage.setItem(dismissalKey, String(Date.now() + dismissalDays * 86400000));
      } catch {
        // Dismiss for this document when storage is unavailable.
      }
    }
    // ===== PANEL STATE =====
    function open(trigger) {
      if (!active) return;
      const modalElement = document.querySelector(".modal.show");
      const modal = modalElement && window.bootstrap?.Modal?.getInstance(modalElement);
      if (modal) {
        modalElement.addEventListener("hidden.bs.modal", () => open(trigger), { once: true });
        modal.hide();
        return;
      }
      opener = trigger;
      manual = true;
      update(active, savedChoice);
      accept.focus();
    }
    function hide() {
      dismissedInline = panel.closest("[data-privacy-inline]");
      manual = false;
      if (aliases.includes(location.hash)) history.replaceState(history.state, "", location.pathname + location.search);
      dismissed = true;
      panel.hidden = true;
      if (opener?.isConnected && !panel.contains(opener)) opener.focus();
    }
    // ===== CONSENT DISPLAY =====
    function update(enabled = true, saved = preview) {
      const lang = document.documentElement.lang.split("-")[0];
      const words = translations[lang] || translations.en;
      const inline = document.querySelector("[data-privacy-inline]");
      const parent = inline || document.body;
      if (panel.parentElement !== parent) parent.append(panel);
      active = enabled;
      if (!enabled) manual = false;
      savedChoice = saved;
      const expanded = manual || !!inline;
      if (inline?.dataset.privacyInline === "on-load") {
        panel.hidden = !manual && dismissedInline === inline;
      } else {
        panel.hidden = !enabled || (!manual && (Boolean(saved) || dismissed || wasDismissed()));
      }
      panel.querySelector("strong").textContent = words.title;
      settings.textContent = words.settings;
      settings.hidden = expanded;
      settings.setAttribute("aria-expanded", String(expanded));
      status.hidden = !expanded || (saved !== "yes" && saved !== "no");
      status.textContent = saved === "yes" ? words.accepted : saved === "no" ? words.rejected : "";
      panel.querySelector("[data-message]").textContent = message || words.message;
      link.textContent = words.privacy;
      cookies.textContent = words.cookies;
      link.hidden = !policyURL;
      cookies.hidden = !cookiesURL;
      panel.querySelector("[data-divider]").hidden = !policyURL || !cookiesURL;
      panel.querySelector("[data-links]").hidden = !policyURL && !cookiesURL;
      accept.textContent = words.accept;
      reject.textContent = words.reject;
      close.textContent = words.close;
      accept.setAttribute("aria-pressed", String(saved === "yes"));
      reject.setAttribute("aria-pressed", String(saved === "no"));
    }
    settings.onclick = () => open(settings);
    close.onclick = () => {
      rememberDismissal();
      hide();
    };
    panel.onkeydown = (event) => {
      if (event.key === "Escape" && !close.hidden) {
        event.preventDefault();
        close.click();
      }
    };
    for (const button of [accept, reject])
      button.onclick = () => {
        const value = button.dataset.choice;
        hide();
        // The host persists real consent. Previews remember only the banner dismissal across visits.
        if (onChoice) onChoice(value);
        else {
          rememberDismissal();
          preview = value;
          try {
            sessionStorage.setItem(key, value);
          } catch {
            /* Use the in-memory preview. */
          }
          update();
        }
      };
    document.addEventListener(
      "click",
      (event) => {
        if (!active || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        const trigger = event.target.closest?.("a[href],button[href],button[data-bs-target],button[data-target]");
        if (!trigger || trigger.hasAttribute("download") || (trigger.target && trigger.target !== "_self")) return;
        if (trigger.hasAttribute("href")) {
          const fragment = trigger.getAttribute("href");
          const samePage = trigger.origin === location.origin && trigger.pathname === location.pathname && trigger.search === location.search;
          if (!aliases.includes(fragment) && !(samePage && aliases.includes(trigger.hash))) return;
        } else if (!aliases.includes(trigger.dataset.bsTarget || trigger.dataset.target)) return;
        event.preventDefault();
        event.stopPropagation();
        open(trigger);
      },
      true
    );
    window.addEventListener("hashchange", () => {
      if (aliases.includes(location.hash)) open();
    });
    const refresh = () => update(active, savedChoice);
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) dismissedInline = null;
      refresh();
    });
    window.addEventListener("storage", (event) => {
      if (event.key === dismissalKey) refresh();
    });
    window.cookieStore?.addEventListener("change", (event) => {
      if ([...event.changed, ...event.deleted].some((cookie) => cookie.name === dismissalKey)) refresh();
    });
    document.head.append(style);
    controls = { open, update };
    update();
    if (aliases.includes(initialHash) || aliases.includes(location.hash)) open();
    return controls;
  };
})();
