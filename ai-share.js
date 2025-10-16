/*! AI Share Widget | MIT License
 *  Single-file widget: registry + minimal row-of-buttons + style injection
 *  API:
 *    AiShare.mountButtons(container, promptOrFn, { services?: string[], size?: 'md'|'sm' })
 *    AiShare.openDirect(serviceKey, prompt)
 *    AiShare.registerService(key, { label, url, param })
 *    AiShare.registry
 */
(function (w, d) {
  // ---------- Service Registry ----------
  const Registry = {
    services: {
      chatgpt:    { label: "ChatGPT",    url: "https://chat.openai.com/",         param: "q" },
      claude:     { label: "Claude",     url: "https://claude.ai/new",            param: "q" },
      perplexity: { label: "Perplexity", url: "https://www.perplexity.ai/search", param: "q" },
      gemini:     { label: "Gemini",     url: "https://gemini.google.com/app",    param: "q" }
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

  // ---------- CSS (injected once) ----------
  const STYLE_ID = "ai-share-style";
  const CSS = `
  .ai-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
  .ai-btn{display:inline-flex;align-items:center;gap:.5ch;white-space:nowrap;padding:10px 14px;border:1px solid #e5e7eb;border-radius:12px;background:#ffffff;color:#0b1220;cursor:pointer;transition:transform .04s ease, background .15s}
  .ai-btn:active{transform:translateY(1px)}
  @media(hover:hover){.ai-btn:hover{background:#f6f8fc}}
  .ai-btn.sm{padding:8px 12px;border-radius:10px;font-size:14px}
  `;
  function ensureStyle() {
    if (!d.getElementById(STYLE_ID)) {
      const s = d.createElement("style");
      s.id = STYLE_ID;
      s.textContent = CSS;
      d.head.appendChild(s);
    }
  }

  // ---------- Helpers ----------
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

  // ---------- Public API ----------
  const API = {
    /** Render a row of buttons; each opens its service with your prompt. */
    mountButtons(container, promptOrFn, options) {
      const root = resolveEl(container);
      if (!root) { console.warn("[AiShare] container not found:", container); return null; }
      ensureStyle();

      const opts = Object.assign({ size: "md" }, options || {});
      const keys = normalizeKeys(opts.services);
      if (!keys.length) { console.warn("[AiShare] no services configured"); return null; }

      // Clean & render
      root.innerHTML = "";
      root.classList.add("ai-row");
      keys.forEach(k => {
        const def = Registry.services[k];
        const btn = d.createElement("button");
        btn.type = "button";
        btn.className = "ai-btn" + (opts.size === "sm" ? " sm" : "");
        btn.textContent = def.label;
        btn.addEventListener("click", () => {
          const prompt = (typeof promptOrFn === "function" ? promptOrFn() : promptOrFn) || "";
          const p = String(prompt).trim();
          if (!p) { console.warn("[AiShare] empty prompt"); return; }
          const url = Registry.buildURL(k, p);
          w.open(url, "_blank", "noopener");
        });
        root.appendChild(btn);
      });

      return { element: root, services: keys };
    },

    /** Open a specific service immediately */
    openDirect(serviceKey, prompt) {
      const p = String(prompt || "").trim();
      if (!p) { console.warn("[AiShare] empty prompt"); return; }
      const url = Registry.buildURL(serviceKey, p);
      w.open(url, "_blank", "noopener");
    },

    /** Extend/override services */
    registerService: Registry.register.bind(Registry),

    /** Access the registry */
    registry: Registry
  };

  w.AiShare = API;
})(window, document);
