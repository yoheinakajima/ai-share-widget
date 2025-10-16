/*! AI Share Widget | MIT License
 *  Single-file library: registry + mobile-friendly modal + style injection
 *  Recommended usage (jsDelivr):
 *    <script src="https://cdn.jsdelivr.net/gh/yoheinakajima/ai-share-widget@v1/ai-share.js"></script>
 *    <script>
 *      // Open a modal to pick a destination, then redirect with the prompt:
 *      AiShare.open("Your prompt here", { services: ["chatgpt","claude"] });
 *      // Or attach an Ask AI button:
 *      AiShare.attach("#ask-ai-btn", () => "Your prompt built at click time");
 *    </script>
 *
 *  API:
 *    AiShare.open(prompt, { services?: string[] })
 *    AiShare.attach(buttonSelOrEl, promptOrFn, { services?: string[] })
 *    AiShare.openDirect(serviceKey, prompt)
 *    AiShare.registerService(key, { label, url, param })
 *    AiShare.registry  // { services, buildURL(key, prompt) }
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

  // --------- CSS Injection (once) ------------
  const STYLE_ID = "ai-share-style";
  const CSS = `
  .ai-modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;align-items:center;justify-content:center;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
  .ai-modal-content{width:min(94vw,440px);max-height:85vh;overflow:auto;background:#fff;border-radius:14px;padding:18px 16px 14px;box-shadow:0 10px 30px rgba(0,0,0,.25)}
  .ai-modal-title{margin:0 0 10px;font-size:1.05rem}
  .ai-select{width:100%;padding:12px;border:1px solid #e5e7eb;border-radius:10px;font-size:15px;background:#fff}
  .ai-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:14px}
  .ai-btn{border:0;border-radius:10px;padding:10px 14px;font-size:.95rem;cursor:pointer}
  .ai-cancel{background:#eef0f5;color:#111}
  .ai-send{background:#0b63f6;color:#fff}
  .ai-send:active{transform:translateY(1px)}
  @media(hover:hover){.ai-send:hover{background:#094bd2}}
  `;
  function ensureStyle() {
    if (!d.getElementById(STYLE_ID)) {
      const s = d.createElement("style");
      s.id = STYLE_ID;
      s.textContent = CSS;
      d.head.appendChild(s);
    }
  }

  // --------- Utilities ------------------
  function normalizeKeys(services) {
    if (Array.isArray(services) && services.length) {
      return services.map(s => String(s).toLowerCase()).filter(k => Registry.services[k]);
    }
    return Object.keys(Registry.services); // default: all
  }
  function $el(target) {
    if (typeof target === "string") return d.querySelector(target);
    return target && target.nodeType === 1 ? target : null;
  }

  // --------- Modal (lazy create + reuse) -----
  let modal, selectEl, sendBtn, cancelBtn;
  let selectedPrompt = "", currentKeys = [];
  const LS_KEY = "AiShare:lastService";

  function ensureModal(keys) {
    ensureStyle();
    if (!modal) {
      modal = d.createElement("div");
      modal.className = "ai-modal";
      modal.setAttribute("data-ai-share-modal", "");
      modal.innerHTML = `
        <div class="ai-modal-content" role="dialog" aria-modal="true" aria-labelledby="ai-modal-title">
          <h3 class="ai-modal-title" id="ai-modal-title">Choose your AI</h3>
          <select class="ai-select" id="ai-service" aria-label="AI service"></select>
          <div class="ai-actions">
            <button type="button" class="ai-btn ai-cancel">Cancel</button>
            <button type="button" class="ai-btn ai-send">Open</button>
          </div>
        </div>`;
      d.body.appendChild(modal);

      selectEl  = modal.querySelector("#ai-service");
      sendBtn   = modal.querySelector(".ai-send");
      cancelBtn = modal.querySelector(".ai-cancel");

      // Interactions
      cancelBtn.addEventListener("click", closeModal);
      modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
      d.addEventListener("keydown", (e) => { if (modal.style.display === "flex" && e.key === "Escape") closeModal(); });

      sendBtn.addEventListener("click", () => {
        const key = selectEl.value;
        if (!key || !selectedPrompt) return;
        try { localStorage.setItem(LS_KEY, key); } catch {}
        const url = Registry.buildURL(key, selectedPrompt);
        w.open(url, "_blank", "noopener");
        closeModal();
      });
    }

    // Populate services if changed
    const same = currentKeys.length === keys.length && currentKeys.every((k,i)=>k===keys[i]);
    if (!same) {
      selectEl.innerHTML = keys.map(k => `<option value="${k}">${Registry.services[k].label}</option>`).join("");
      currentKeys = keys.slice();
    }

    // Preselect last used if present
    try {
      const last = localStorage.getItem(LS_KEY);
      if (last && keys.includes(last)) {
        selectEl.value = last;
      } else {
        selectEl.selectedIndex = 0;
      }
    } catch { /* ignore */ }
  }

  function openModal(keys, prompt) {
    selectedPrompt = prompt;
    ensureModal(keys);
    modal.style.display = "flex";
    // focus select (mobile-safe, no virtual keyboard)
    setTimeout(() => selectEl && selectEl.focus(), 0);
  }

  function closeModal() {
    modal.style.display = "none";
  }

  // --------- Public API ---------------------
  const API = {
    /** Show the modal for a prompt. options: { services?: string[] } */
    open(prompt, options) {
      const p = String(prompt || "").trim();
      if (!p) return console.warn("[AiShare] empty prompt");
      const keys = normalizeKeys(options?.services);
      if (!keys.length) return console.warn("[AiShare] no services configured");
      openModal(keys, p);
    },

    /** Attach behavior to an Ask AI button. */
    attach(buttonSelOrEl, promptOrFn, options) {
      const btn = $el(buttonSelOrEl);
      if (!btn) return console.warn("[AiShare] button not found:", buttonSelOrEl);
      const keys = normalizeKeys(options?.services);
      if (!keys.length) return console.warn("[AiShare] no services configured");
      btn.addEventListener("click", () => {
        const p = typeof promptOrFn === "function" ? promptOrFn() : promptOrFn;
        API.open(p, { services: keys });
      });
      return { button: btn, services: keys };
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
