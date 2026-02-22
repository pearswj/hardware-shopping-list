const tokenInput = document.getElementById("token");
const dbInput = document.getElementById("database-id");
const saveBtn = document.getElementById("save-btn");
const statusEl = document.getElementById("status");

// Load saved values on open
browser.storage.local
  .get(["notionToken", "notionDatabaseId"])
  .then(({ notionToken, notionDatabaseId }) => {
    if (notionToken) tokenInput.value = notionToken;
    if (notionDatabaseId) dbInput.value = notionDatabaseId;
  });

saveBtn.addEventListener("click", async () => {
  const token = tokenInput.value.trim();
  const databaseId = dbInput.value.trim().replace(/-/g, ""); // strip dashes if pasted with them

  if (!token) { setStatus("Token is required.", "error"); return; }
  if (!databaseId) { setStatus("Database ID is required.", "error"); return; }

  await browser.storage.local.set({ notionToken: token, notionDatabaseId: databaseId });
  setStatus("Saved!", "success");
  setTimeout(() => setStatus("", ""), 2500);
});

function setStatus(text, type) {
  statusEl.textContent = text;
  statusEl.className = type;
}
