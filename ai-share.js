/*! AI Share Widget | MIT License
 *  Single-file library: registry + minimal dropdown UI + style injection
 *  Usage (CDN):
 *    <script src="https://yoheinakajima.github.io/ai-share-widget/ai-share.js"></script>
 *    AiShare.mountDropdown('#dest', () => 'Your prompt here', { services: ['chatgpt','claude'], buttonText: 'Send' });
 *
 *  API:
 *    AiShare.mountDropdown(container, promptOrFn, { services?: string[], buttonText?: string })
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
  .ai-inline{display:flex;gap:8px;align-items:center;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
  .ai-select{min-width:180px;padding:8px 10px;border:1px solid #e5e7eb;border-radius:8px;font-size:14px;background:#fff}
  .ai-send{padding:8px 12px;border:0;border-radius:8px;font-size:14px;background:#0b63f6;color:#fff;cursor:pointer}
  .ai-send:hover{background:#094bd2}
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
  function resolveContainer(container) {
    if (typeof container === 'string') return d.querySelector(container);
    return container && container.nodeType === 1 ? container : null;
  }

  // --------- Public API ---------------
  const API = {
    /** Mount an inline dropdown + send button.
     *  container: selector or element
     *  promptOrFn: string OR () => string (evaluated on click)
     *  options: { services?: string[], buttonText?: string }
     */
    mountDropdown(container, promptOrFn, options) {
      const root = resolveContainer(container);
      if (!root) return console.warn("[AiShare] container not found:", container);
      ensureStyle();

      const opts = Object.assign({ buttonText: "Send" }, options || {});
      const keys = normalizeKeys(opts.services);
      if (!keys.length) return console.warn("[AiShare] no services configured");

      root.innerHTML = ""; // clean
      const wrap = d.createElement("div");
      wrap.className = "ai-inline";

      const select = d.createElement("select");
      select.className = "ai-select";
      select.setAttribute("aria-label", "AI service");
      select.innerHTML = keys.map(k => `<option value="${k}">${Registry.services[k].label}</option>`).join("");

      const button = d.createElement("button");
      button.className = "ai-send";
      button.type = "button";
      button.textContent = opts.buttonText;

      button.addEventListener("click", () => {
        const key = select.value;
        const prompt = (typeof promptOrFn === 'function' ? promptOrFn() : promptOrFn) || "";
        const p = String(prompt).trim();
        if (!p) return console.warn("[AiShare] empty prompt");
        const url = Registry.buildURL(key, p);
        w.open(url, "_blank", "noopener");
      });

      wrap.appendChild(select);
      wrap.appendChild(button);
      root.appendChild(wrap);

      return { select, button, keys };
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

    /** Access the registry (read/modify services) */
    registry: Registry
  };

  w.AiShare = API;
})(window, document);
