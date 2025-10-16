(function() {
  const defaultConfig = {
    buttonText: "Ask AI",
    theme: "light",
    services: ["ChatGPT", "Claude", "Perplexity", "Gemini"]
  };

  const config = Object.assign({}, defaultConfig, window.aiShareConfig || {});

  const serviceURLs = {
    ChatGPT: "https://chat.openai.com/?q=",
    Claude: "https://claude.ai/new?q=",
    Perplexity: "https://www.perplexity.ai/search?q=",
    Gemini: "https://gemini.google.com/app?q="
  };

  const btn = document.createElement("button");
  btn.innerText = config.buttonText;
  Object.assign(btn.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    background: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 16px",
    cursor: "pointer",
    zIndex: 9999
  });
  document.body.appendChild(btn);

  const modal = document.createElement("div");
  modal.style.cssText = `
    display:none;position:fixed;top:0;left:0;width:100%;height:100%;
    background:rgba(0,0,0,0.5);z-index:10000;justify-content:center;align-items:center;
  `;
  modal.innerHTML = `
    <div style="background:#fff;padding:20px;border-radius:8px;max-width:400px;width:90%;">
      <h3>Send Prompt to AI</h3>
      <textarea id="aiPromptInput" rows="3" style="width:100%;padding:8px;"></textarea>
      <select id="aiServiceSelect" style="margin-top:10px;width:100%;padding:8px;">
        ${config.services.map(s => `<option value="${s}">${s}</option>`).join("")}
      </select>
      <div style="margin-top:15px;text-align:right;">
        <button id="aiCancelBtn" style="margin-right:8px;">Cancel</button>
        <button id="aiSendBtn">Send</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  btn.addEventListener("click", () => (modal.style.display = "flex"));
  modal.querySelector("#aiCancelBtn").addEventListener("click", () => (modal.style.display = "none"));
  modal.querySelector("#aiSendBtn").addEventListener("click", () => {
    const prompt = encodeURIComponent(document.getElementById("aiPromptInput").value);
    const service = document.getElementById("aiServiceSelect").value;
    if (!prompt) return alert("Please enter a prompt.");
    window.open(serviceURLs[service] + prompt, "_blank");
    modal.style.display = "none";
  });
})();
