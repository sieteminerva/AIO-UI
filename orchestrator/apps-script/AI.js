/**
 * AI — provider-agnostic model call.
 *
 * The client composes the prompt (answers + `issueLines(issues)`); this file only
 * moves text to a provider and back. Adding a provider is one entry in `PROVIDERS`
 * and one `call*` function — nothing else changes.
 *
 * Script Properties:
 *   AI_PROVIDER       `gemini` | `deepseek` (default `gemini`)
 *   GEMINI_API_KEY    required for gemini
 *   DEEPSEEK_API_KEY  required for deepseek
 *   AI_MODEL          optional override; each provider has a default
 *
 * Contract: docs/generator/TASK-answers-contract.md §6 (the model writes content only).
 */

const PROVIDERS = {
  gemini: {
    key: "GEMINI_API_KEY",
    // 2.5-flash is closed to new keys; override with the AI_MODEL Script Property.
    defaultModel: "gemini-3.8-flash",
    call: callGemini,
  },
  deepseek: {
    key: "DEEPSEEK_API_KEY",
    defaultModel: "deepseek-chat",
    call: callDeepSeek,
  },
};

/** Providers that have a key stored, so the client can pick one without guessing. */
function availableProviders() {
  return Object.keys(PROVIDERS).filter((name) => PROPS.getProperty(PROVIDERS[name].key));
}

/**
 * One model call. `payload.provider` beats the Script Property, so a test can
 * exercise both providers without changing configuration.
 *
 * @param {{ provider?: string, model?: string, prompt: string }} payload
 * @returns {{ text: string, provider: string, model: string, ms: number }}
 */
function ask(payload) {
  const name = String(payload.provider || PROPS.getProperty("AI_PROVIDER") || "gemini").toLowerCase();
  const provider = PROVIDERS[name];
  if (!provider) throw new Error(`Unknown provider ${JSON.stringify(name)}.`);

  const key = PROPS.getProperty(provider.key);
  if (!key) throw new Error(`Missing Script Property ${provider.key}.`);

  const prompt = String(payload.prompt || "").trim();
  if (!prompt) throw new Error("`prompt` is required.");

  const model = String(payload.model || PROPS.getProperty("AI_MODEL") || provider.defaultModel);
  const started = Date.now();
  const text = provider.call(key, model, prompt);

  return { text, provider: name, model, ms: Date.now() - started };
}

/** Gemini `generateContent`; JSON mime type keeps the answer parseable. */
function callGemini(key, model, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
  };
  const data = fetchJson(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(body),
  });

  const candidate = data && data.candidates && data.candidates[0];
  const text =
    candidate &&
    candidate.content &&
    candidate.content.parts &&
    candidate.content.parts[0] &&
    candidate.content.parts[0].text;
  if (!text) throw new Error(`Gemini returned no text: ${brief(data)}`);
  return text;
}

/**
 * DeepSeek is OpenAI-compatible; `json_object` needs the word "json" in the prompt.
 *
 * `max_tokens` is explicit: the provider default (4096) cut a five-page preset off
 * mid-JSON, which the engine could only read as INVALID_SHAPE. 8192 is
 * `deepseek-chat`'s own ceiling.
 */
function callDeepSeek(key, model, prompt) {
  const body = {
    model,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 8192,
  };
  const data = fetchJson("https://api.deepseek.com/chat/completions", {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: `Bearer ${key}` },
    payload: JSON.stringify(body),
  });

  const choice = data && data.choices && data.choices[0];
  const text = choice && choice.message && choice.message.content;
  if (!text) throw new Error(`DeepSeek returned no text: ${brief(data)}`);
  return text;
}

/** Shared HTTP hop: never throws on status, so the error text reaches the caller. */
function fetchJson(url, options) {
  const response = UrlFetchApp.fetch(url, Object.assign({ muteHttpExceptions: true }, options));
  const code = response.getResponseCode();
  const text = response.getContentText();
  if (code < 200 || code >= 300) throw new Error(`HTTP ${code}: ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

function brief(value) {
  return JSON.stringify(value).slice(0, 400);
}
