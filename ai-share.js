/*! AI Share Widget | MIT License
 *  Single-file library: registry + minimal modal + style injection
 *  Usage:
 *    <script src="ai-share.js"></script>
 *    AiShare.open("Summarize " + document.title + " (" + location.href + ")");
 */
(function (w, d) {
  // ---- Minimal service registry -------------------------------------------
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

  // ---- Style injection (one time) -----------------------------------------
  const STYLE_ID = "ai-share-style";
  const CSS = `
  .ai-modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;align-items:center;justify-content:center;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
  .ai-modal-content{width:min(92vw,420px);background:#fff;border-radius:12px;padding:20px;box-shadow:0 10px 30px rgba(0,0,0,.25)}
  .ai-modal-title{margin:0 0 10px;font-size:1.1rem}
  .ai-select{width:100%;padding:10px;border:1px solid #e5e7eb;border-radius:8px;margin:8px 0 16px;font-size:1rem}
  .ai-actions{display:flex;gap:10px;justify-content:flex-end}
  .ai-btn{border:0;border-radius:8px;padding:8px 14px;font-size:.95rem;cursor:pointer}
  .ai-cancel{background:#eee}
  .ai-send{background:#0b63f6;color:#fff}
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

  // ---- Modal (lazy-created + reused) --------------------------------------
  let modal, selectEl, sendBtn, cancelBtn, currentPrompt = "", currentKeys = [];

  function optionHTML(keys) {
    return keys.map(k => `<option value="${k}">${Registry.services[k].label}</option>`).join("");
  }
  function normalizeKeys(services) {
    if (Array.isArray(services) && services.length) {
      return services.map(s => String(s).toLowerCase()).filter(k => Registry.services[k]);
    }
    return Object.keys(Registry.services); // default: all
  }
  function ensureModal(keys) {
    if (!modal) {
      ensureStyle();
      modal = d.createElement("div");
      modal.className = "ai-modal";
      modal.setAttribute("data-ai-share-modal", "");
      modal.innerHTML = `
        <div class="ai-modal-content" role="dialog" aria-modal="true" aria-labelledby="ai-modal-title">
          <h3 class="ai-modal-title" id="ai-modal-title">Choose your AI</h3>
          <select class="ai-select" id="ai-service"></select>
          <div class="ai-actions">
            <button type="button" class="ai-btn ai-cancel">Cancel</button>
            <button type="button" class="ai-btn ai-send">Send</button>
          </div>
        </div>`;
      d.body.appendChild(modal);

      selectEl  = modal.querySelector("#ai-service");
      sendBtn   = modal.querySelector(".ai-send");
      cancelBtn = modal.querySelector(".ai-cancel");

      cancelBtn.addEventListener("click", () => modal.style.display = "none");
      modal.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });
      sendBtn.addEventListener("click", () => {
        const key = selectEl.value;
        if (!key || !currentPrompt) return;
        const url = Registry.buildURL(key, currentPrompt);
        w.open(url, "_blank", "noopener");
        modal.style.display = "none";
      });
    }
    const sameSet = currentKeys.length === keys.length && currentKeys.every((k,i)=>k===keys[i]);
    if (!sameSet) {
      selectEl.innerHTML = optionHTML(keys);
      currentKeys = keys.slice();
    }
  }

  // ---- Public API ----------------------------------------------------------
  const API = {
    /** Open model-chooser modal for a prompt. options: { services?: string[] } */
    open(prompt, options) {
      const p = String(prompt || "").trim();
      if (!p) return console.warn("[AiShare] empty prompt");
      const keys = normalizeKeys(options?.services);
      if (!keys.length) return console.warn("[AiShare] no services configured");
      currentPrompt = p;
      ensureModal(keys);
      modal.style.display = "flex";
      selectEl?.focus();
    },
    /** Skip modal: open a specific service directly */
    openDirect(serviceKey, prompt) {
      const p = String(prompt || "").trim();
      if (!p) return console.warn("[AiShare] empty prompt");
      const url = Registry.buildURL(serviceKey, p);
      w.open(url, "_blank", "noopener");
    },
    /** Extend/override services at runtime */
    registerService: Registry.register.bind(Registry),
    /** Access the registry */
    registry: Registry
  };

  w.AiShare = API;
})(window, document);
