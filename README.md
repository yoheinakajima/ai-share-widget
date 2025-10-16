# AI Share Widget

A tiny, zero‑dependency JavaScript widget that renders a **row of buttons**—one per AI service—and opens your **prompt** in the chosen tool (ChatGPT, Claude, Perplexity, Gemini). No backend, no tracking, just a clean redirect with your prompt in the URL.

> **Why?** Give users a one‑click way to continue what they’re doing (summarize, ideate, translate, compare, draft) in their preferred AI.

---

## Features
- **Drop‑in**: one script tag, one mount call
- **Zero deps**: framework‑agnostic (vanilla JS)
- **Mobile‑friendly**: large, accessible buttons
- **Extensible**: add/override services at runtime
- **Private by default**: no network calls, no analytics

---

## Quick Start (via jsDelivr)

> Use `@main` while you’re developing. After you publish a tag (e.g. `v1`), switch to a pinned version for stability.

~~~html
<!-- 1) Import the widget -->
<script src="https://cdn.jsdelivr.net/gh/yoheinakajima/ai-share-widget@main/ai-share.js"></script>

<!-- 2) Add a container where the row of buttons should appear -->
<div id="ai-buttons"></div>

<!-- 3) Mount the widget with your prompt (string or function) -->
<script>
  AiShare.mountButtons('#ai-buttons', () => {
    const text = document.body.innerText.replace(/\s+/g,' ').trim().slice(0, 1800);
    return [
      "Brainstorm 12 distinct, concrete ways to integrate this 'Ask AI' widget into different websites and apps.",
      "Vary by product type (docs, blogs, ecommerce, dashboards, SaaS), user intent, and placement.",
      "For each idea: provide a short title and one sentence rationale.",
      "Use the following site content as context when relevant:",
      text
    ].join("\n");
  }, { services: ['chatgpt','claude','gemini','perplexity'] });
</script>
~~~

**After tagging a release:**

~~~html
<script src="https://cdn.jsdelivr.net/gh/yoheinakajima/ai-share-widget@v1/ai-share.js"></script>
~~~

---

## Live Demo / Project Page
- **GitHub**: https://github.com/yoheinakajima/ai-share-widget
- **Demo (index.html)**: uses the widget to generate use‑case ideas by passing the page content as context.

---

## API

### `AiShare.mountButtons(container, promptOrFn, options?)`
Render the row of service buttons and wire their click behavior.

**Params**
- `container` — CSS selector or DOM element where the buttons should render
- `promptOrFn` — a string *or* a function returning a string (evaluated on click)
- `options` (optional)
  - `services?: string[]` — subset of services, e.g. `["chatgpt","claude"]`; default is **all**
  - `size?: 'md' | 'sm'` — button sizing (default `'md'`)

**Returns**: `{ element: HTMLElement, services: string[] } | null`

**Example**
~~~js
AiShare.mountButtons('#share', () => `Summarize ${document.title} (${location.href}) in 3 bullets.`);
~~~

---

### `AiShare.openDirect(serviceKey, prompt)`
Skip the UI and open a specific service immediately.

~~~js
AiShare.openDirect('chatgpt', 'Hello from AI Share');
~~~

---

### `AiShare.registerService(key, { label, url, param })`
Add or override a destination. Useful if a site changes its URL/param, or to add a new one.

~~~js
AiShare.registerService('poe', {
  label: 'Poe',
  url: 'https://poe.com/search',
  param: 'q'
});
~~~

---

### `AiShare.registry`
Access the service registry and helper utilities.

~~~js
console.log(AiShare.registry.services);
// { chatgpt: { label, url, param }, ... }
~~~

---

## Supported Services (default)
- **ChatGPT** — `https://chat.openai.com/?q=<prompt>`
- **Claude** — `https://claude.ai/new?q=<prompt>`
- **Perplexity** — `https://www.perplexity.ai/search?q=<prompt>`
- **Gemini** — `https://gemini.google.com/app?q=<prompt>`

You can remove, reorder, or limit via `options.services`, and extend via `AiShare.registerService(...)`.

---

## Prompt Patterns (practical tips)
- **Keep it short**: these are URL params; shorter prompts are faster and safer
- **Context on demand**: build prompts with page context only when needed (e.g., selected text or a specific container’s text)
- **Structure lightly**: ask for bullet points, counts (e.g., “give 7 ideas”), or simple formats
- **Be explicit about intent**: “summarize”, “compare”, “rewrite”, “generate X variants”, etc.

**Use selected text when available**
~~~js
const selection = String(window.getSelection() || '').trim();
const prompt = selection
  ? `Summarize the following:\n\n${selection}`
  : `Summarize ${document.title} (${location.href}) in 5 bullets.`;
AiShare.openDirect('perplexity', prompt);
~~~

**Use a div’s text as context**
~~~js
function fromDivText(sel, max=1800){
  const el = document.querySelector(sel);
  if(!el) return '';
  return el.innerText.replace(/\s+/g,' ').trim().slice(0, max);
}
AiShare.mountButtons('#ai-buttons', () => `Draft a concise summary:\n\n${fromDivText('#content')}`);
~~~

---

## Accessibility
- **Keyboard**: buttons are native `<button>` elements
- **Contrast & sizing**: large hit‑targets and high‑contrast default styles
- **No focus traps**: simple DOM, no modals by default

---

## Performance & Privacy
- **No network calls**: the widget only opens a new tab to the chosen AI
- **No cookies, no storage**: no tracking; all state is in the DOM
- **Lightweight**: tiny, inline CSS injection; no frameworks

---

## Versioning & CDN
- **Development**: `@main` (latest commit) — fastest iteration
- **Production**: pin a tag like `@v1` to avoid unexpected changes

~~~html
<script src="https://cdn.jsdelivr.net/gh/yoheinakajima/ai-share-widget@v1/ai-share.js"></script>
~~~

You can also host from GitHub Pages if you prefer a fixed origin.

---

## Troubleshooting
- **`AiShare is not defined`**
  - Ensure the script URL is correct and loaded **before** you call `AiShare.*`
  - If using a module bundler, import after DOM mounts or wrap in `DOMContentLoaded`
- **Buttons don’t appear**
  - The container selector may not exist yet; render after the container is in the DOM
  - Check `options.services` keys (must match registry keys, e.g., `chatgpt`)
- **Long prompts get truncated**
  - Keep prompts under a few thousand characters; some destinations have URL length limits

---

## Contributing
1. Fork the repo and create a feature branch
2. Keep changes minimal and dependency‑free
3. Update `index.html` demo if UX changes
4. Open a PR with a concise description and before/after screenshots or GIFs

---

## License
MIT © Yohei Nakajima

---

## Changelog (high level)
- **0.1.0** — Initial buttons widget; default services: ChatGPT, Claude, Perplexity, Gemini
