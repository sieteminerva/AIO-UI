/**
 * SHEET — duplicate the CMS template for one generated site.
 *
 * Every generated site owns its own copy of the template Spreadsheet, so its id is
 * new (and its data belongs to that site). The template stays read-only.
 *
 * Script Properties:
 *   TEMPLATE_SHEET_ID  the CMS template to copy
 *   SHEET_FOLDER_ID    optional: folder that receives every copy
 *
 * Caveat: Drive copies the file, not the bound project's Script Properties, so the
 * copy's own SETUP menu may still be required once. Verify on the first real run.
 */

/**
 * @param {{ name?: string, templateId?: string }} payload
 * @returns {{ sheet: { id: string, url: string, title: string } }}
 */
function copyTemplate(payload) {
  const templateId = String(payload.templateId || PROPS.getProperty("TEMPLATE_SHEET_ID") || "");
  if (!templateId) throw new Error("Missing Script Property TEMPLATE_SHEET_ID.");

  const name = safeName(payload.name || `rajutan-site-${Date.now()}`);
  const file = DriveApp.getFileById(templateId);
  const folderId = PROPS.getProperty("SHEET_FOLDER_ID");
  const copy = folderId ? file.makeCopy(name, DriveApp.getFolderById(folderId)) : file.makeCopy(name);

  return { sheet: { id: copy.getId(), url: copy.getUrl(), title: copy.getName() } };
}

/** Drive accepts almost anything, but a slug keeps the folder and the app id in step. */
function safeName(value) {
  const clean = String(value)
    .trim()
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return clean || "rajutan-site";
}
