const nameInput = document.getElementById("name");
const urlInput = document.getElementById("url");
const locationInput = document.getElementById("location");
const saveBtn = document.getElementById("save-btn");
const statusEl = document.getElementById("status");
const formEl = document.getElementById("form");
const notOnPageEl = document.getElementById("not-on-page");

document.getElementById("settings-link").addEventListener("click", () => {
  browser.runtime.openOptionsPage();
});

async function init() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

  const isSupportedSite =
    tab.url && (tab.url.includes("canadiantire.ca") || tab.url.includes("homedepot.ca"));

  if (!isSupportedSite) {
    formEl.style.display = "none";
    notOnPageEl.style.display = "block";
    return;
  }

  // Ask the content script for product info
  let info;
  try {
    info = await browser.tabs.sendMessage(tab.id, { type: "GET_PRODUCT_INFO" });
  } catch {
    setStatus("Could not read page info. Try reloading the tab.", "error");
    saveBtn.disabled = true;
    return;
  }

  nameInput.value = info.name;
  urlInput.value = info.url;
  if (info.location) locationInput.value = info.location;
  locationInput.focus();

  // Stash store name for use when saving
  saveBtn.dataset.store = info.store || "";
}

saveBtn.addEventListener("click", async () => {
  setStatus("", "");
  const name = nameInput.value.trim();
  const url = urlInput.value.trim();
  const location = locationInput.value.trim();

  if (!name) { setStatus("Name is required.", "error"); return; }
  if (!url)  { setStatus("URL is missing.", "error"); return; }

  const { notionToken, notionDatabaseId } = await browser.storage.local.get([
    "notionToken",
    "notionDatabaseId",
  ]);

  if (!notionToken || !notionDatabaseId) {
    setStatus("Configure your Notion credentials in Settings.", "error");
    return;
  }

  saveBtn.disabled = true;
  setStatus("Saving…", "");

  try {
    await browser.runtime.sendMessage({
      type: "SAVE_TO_NOTION",
      payload: { name, url, location, store: saveBtn.dataset.store, token: notionToken, databaseId: notionDatabaseId },
    });
    setStatus("Saved!", "success");
  } catch (err) {
    setStatus(err.message || "Failed to save.", "error");
  } finally {
    saveBtn.disabled = false;
  }
});

function setStatus(text, type) {
  statusEl.textContent = text;
  statusEl.className = type;
}

init();
