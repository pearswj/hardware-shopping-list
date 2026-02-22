// Content script injected into canadiantire.ca and homedepot.ca pages.
// Responds to messages from the popup requesting product info.

const SITES = {
  "canadiantire.ca": {
    store: "Canadian Tire",
    nameSelectors: ["h1.nl-product__title", "h1"],
    extractLocation: extractCanadianTireAisle,
  },
  "homedepot.ca": {
    store: "Home Depot",
    extractName: extractHomeDepotName,
    extractLocation: extractHomeDepotLocation,
  },
};

function currentSite() {
  const host = window.location.hostname;
  return Object.keys(SITES).find((key) => host.includes(key));
}

browser.runtime.onMessage.addListener((message) => {
  if (message.type !== "GET_PRODUCT_INFO") return;

  const siteKey = currentSite();
  if (!siteKey) return Promise.resolve(null);

  const config = SITES[siteKey];
  const name = config.extractName ? config.extractName() : extractName(config.nameSelectors);
  const url = window.location.origin + window.location.pathname;
  const location = config.extractLocation();
  const store = config.store;

  return Promise.resolve({ name, url, location, store });
});

function extractName(selectors) {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) {
      const text = el.textContent.trim();
      if (text) return text;
    }
  }
  // Fall back to page title, stripping site name suffix
  return document.title
    .replace(/\s*[|\-–]\s*(Canadian Tire|Home Depot).*$/i, "")
    .trim();
}

function extractCanadianTireAisle() {
  const el = document.querySelector(".nl-buy-box__find-in-store__aisle-label");
  return el ? el.textContent.trim() : "";
}

function extractHomeDepotName() {
  const h1 = document.querySelector("h1.hdca-product__description-title");
  if (!h1) return extractName(["h1"]);

  const manufacturer = h1.querySelector(".hdca-product__description-title-manufacturer");
  const productName  = h1.querySelector(".hdca-product__description-title-product-name");

  return [manufacturer, productName]
    .map((el) => el?.textContent.trim() ?? "")
    .filter(Boolean)
    .join(" ");
}

function extractHomeDepotLocation() {
  const container = document.querySelector(
    "product-aisle-and-bay .acl-weight--bold"
  );
  if (!container) return "";

  // Clone so we can remove the popover without mutating the page
  const clone = container.cloneNode(true);
  const popover = clone.querySelector("acl-popover");
  if (popover) popover.remove();

  // Collapse whitespace and fix " ," → ","
  return clone.textContent.replace(/\s+/g, " ").replace(/\s+,/g, ",").trim();
}
