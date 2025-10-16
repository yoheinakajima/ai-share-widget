/*! AI Share Widget | MIT License
 *  Single-file library: registry + minimal dropdown + style injection
 *  Usage (CDN):
 *    <script src="https://yoheinakajima.github.io/ai-share-widget/ai-share.js"></script>
 *    AiShare.attachLauncher('#ask', () => 'Your prompt here', { services: ['chatgpt','claude'] });
 *
 *  API:
 *    AiShare.attachLauncher(buttonSelOrEl, promptOrFn, { services?: string[] })
 *      - Renders a hidden dropdown next to the given button.
 *      - On button click: shows dropdown.
 *      - On dropdown change: opens new tab and hides dropdown.
 *    AiShare.openDirect(serviceKey, prompt)
 *    AiShare.registerService(key, { label, url, param })
 *    AiShare.registry  // { services, buildURL(...) }
 */
(function (w, d) {
  // --------- Service Registry ----------
  const Registry = {
    services: {
      chatgpt:    { label: "ChatGPT",    url: "https://chat.openai.com/",         param: "q" },
      claude:     { label: "Claude",     url: "https://claude.ai/new",            param: "q" },
      perplexity: { label: "Perplexity", url: "https://www.perplexity.ai/search", param: "q" },
      gemini:     { label: "Gemini",     url: "https://gemini.google.com/app",    param: "q" },
    },
    buildURL(key, prompt) {
      const k = String(key || "").toLowerCase();
      const svc = this.services[k];
      if (!svc) throw new Error("[AiShare] Unknown service: " + key);
      const join = svc.url.includes("?") ? "&" : "?";
      return `${svc.url}${join}${svc.param}=${encodeURIComponent(prompt)}`;
    },
    register(key, def) {
      this.services[String(key).toLowerCase()] = def;
    }
  };

  // --------- CSS Injection ------------
  const STYLE_ID = "ai-share-style";
  const CSS = `
  .ai-inline-launcher{display:inline-flex;gap:8px;align-items:center;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
  .ai-launch-btn{padding:8px 12px;border:0;border-radius:10px;font-size:14px;background:#0b63f6;color:#fff;cursor:pointer}
  .ai-launch-btn:hover{background:#094bd2}
  .ai-select{min-width:180px;padding:8px 10px;border:1px solid #e5e7eb;border-radius:10px;font-size:14px;background:#fff;display:none}
  `;
  function ensureStyle() {
    if (!d.getElementById(STYLE_ID)) {
      const s = d.createElement("style");
      s.id = STYLE_ID;
      s.textContent = CSS;
      d.head.appendChild(s);
    }
  }

  // --------- Helpers ------------------
  function normalizeKeys(services) {
    if (Array.isArray(services) && services.length) {
      return services.map(s => String(s).toLowerCase()).filter(k => Registry.services[k]);
    }
    return Object.keys(Registry.services); // default: all
  }
  function resolveEl(target) {
    if (typeof target === "string") return d.querySelector(target);
    return target && target.nodeType === 1 ? target : null;
  }

  // --------- Public API ---------------
  const API = {
    /** Attach launcher behavior to an existing button.
     *  - buttonSelOrEl: selector or Element of your "Ask AI" button
     *  - promptOrFn: string OR () => string (evaluated on selection)
     *  - options: { services?: string[] }
     */
    attachLauncher(buttonSelOrEl, promptOrFn, options) {
      const btn = resolveEl(buttonSelOrEl);
      if (!btn) return console.warn("[AiShare] button not found:", buttonSelOrEl);
      ensureStyle();

      const keys = normalizeKeys(options?.services);
      if (!keys.length) return console.warn("[AiShare] no services configured");

      // Wrap the button + injected select inside a small inline container (for layout)
      let wrap = btn.closest(".ai-inline-launcher");
      if (!wrap) {
        wrap = d.createElement("span");
        wrap.className = "ai-inline-launcher";
        btn.classList.add("ai-launch-btn");
        btn.replaceWith(wrap);
        wrap.appendChild(btn);
      }

      // Create or reuse the adjacent select
      let select = wrap.querySelector("select.ai-select");
      if (!select) {
        select = d.createElement("select");
        select.className = "ai-select";
        select.setAttribute("aria-label", "AI service");
        wrap.appendChild(select);
      }
      select.innerHTML = keys.map(k => `<option value="${k}">${Registry.services[k].label}</option>`).join("");

      // Button click -> show select
      btn.addEventListener("click", () => {
        select.style.display = "inline-block";
        select.focus();
      });

      // Select change -> open immediately, then hide
      select.addEventListener("change", () => {
        const key = select.value;
        const prompt = (typeof promptOrFn === "function" ? promptOrFn() : promptOrFn) || "";
        const p = String(prompt).trim();
        if (!p) return console.warn("[AiShare] empty prompt");
        const url = Registry.buildURL(key, p);
        w.open(url, "_blank", "noopener");
        select.style.display = "none";
        select.selectedIndex = 0; // keep first option selected for next time
      });

      return { button: btn, select, keys };
    },

    /** Open a specific service immediately */
    openDirect(serviceKey, prompt) {
      const p = String(prompt || "").trim();
      if (!p) return console.warn("[AiShare] empty prompt");
      const url = Registry.buildURL(serviceKey, p);
      w.open(url, "_blank", "noopener");
    },

    /** Extend/override services */
    registerService: Registry.register.bind(Registry),

    /** Access registry */
    registry: Registry
  };

  w.AiShare = API;
})(window, document);
