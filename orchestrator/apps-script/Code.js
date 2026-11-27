/**
 * ORCHESTRATOR — the Apps Script web app the wizard calls.
 *
 * One endpoint, two things a browser cannot do itself:
 *   action: "ask"   → one model call (Gemini or DeepSeek) → the raw JSON text
 *   action: "sheet" → duplicate TEMPLATE_SHEET_ID for this generated site
 *
 * The pure chain (answersToBase → retry → assemblePreset) stays on the client for
 * now; this server owns the two secrets: the provider key and Drive custody.
 *
 * Contract: orchestrator/TASK.md §2 and §7.
 * Deploy:   docs/generator/GoogleSheets CMS/DEPLOYMENT.MD (Web App, execute as me).
 *
 * Request bodies are sent with `Content-Type: text/plain` on purpose: Apps Script
 * cannot answer a CORS preflight, so the browser must make a "simple request".
 */

const PROPS = PropertiesService.getScriptProperties();

function doGet() {
  return reply({
    status: "success",
    data: { ok: true, providers: availableProviders() },
  });
}

function doPost(e) {
  let payload;
  try {
    payload = parseBody(e);
  } catch (error) {
    return reply({ status: "error", data: { message: messageOf(error) } });
  }

  if (!authorized(payload)) {
    return reply({ status: "error", data: { message: "Unauthorized." } });
  }

  try {
    switch (payload.action) {
      case "ask":
        return reply({ status: "success", data: ask(payload) });
      case "sheet":
        return reply({ status: "success", data: copyTemplate(payload) });
      case "deploy":
        return reply({ status: "success", data: deploySite(payload) });
      default:
        return reply({
          status: "error",
          data: { message: `Unknown action ${JSON.stringify(payload.action)}.` },
        });
    }
  } catch (error) {
    return reply({ status: "error", data: { message: messageOf(error) } });
  }
}

function parseBody(e) {
  const raw = e && e.postData && e.postData.contents;
  if (!raw) throw new Error("Empty request body.");
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Request body must be a JSON object.");
  }
  return parsed;
}

/**
 * Optional shared token. It also ships in the client bundle, so it stops a crawler,
 * not an attacker; real identity arrives with the Google `idToken` (§2).
 */
function authorized(payload) {
  const expected = PROPS.getProperty("CLIENT_TOKEN");
  if (!expected) return true;
  return payload.token === expected;
}

/** Every response uses the same `{ status, meta?, data }` wrapper the wizard expects. */
function reply(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

function messageOf(error) {
  return String((error && error.message) || error);
}
