// Content script injected into canadiantire.ca pages.
// Responds to messages from the popup requesting product info.

browser.runtime.onMessage.addListener((message) => {
  if (message.type !== "GET_PRODUCT_INFO") return;

  const name = extractProductName();
  const url = window.location.origin + window.location.pathname;
  const location = extractAisle();

  return Promise.resolve({ name, url, location });
});

function extractProductName() {
  // Try selectors likely to contain the product title on canadiantire.ca
  const selectors = [
    "h1.nl-product__title",
    "h1",
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) {
      const text = el.textContent.trim();
      if (text) return text;
    }
  }

  // Fall back to the page title, stripping the site name suffix if present
  return document.title.replace(/\s*[|\-–]\s*Canadian Tire.*$/i, "").trim();
}

function extractAisle() {
  const el = document.querySelector(".nl-buy-box__find-in-store__aisle-label");
  return el ? el.textContent.trim() : "";
}
