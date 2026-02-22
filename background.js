// Background script: handles Notion API calls on behalf of the popup.

browser.runtime.onMessage.addListener((message) => {
  if (message.type === "SAVE_TO_NOTION") {
    return saveToNotion(message.payload);
  }
});

async function saveToNotion({ name, url, location, store, token, databaseId }) {
  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": "2025-09-03",
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties: {
        // "name" is the Title property in the Notion database
        Name: {
          title: [{ text: { content: name } }],
        },
        // "url" is a URL property
        URL: {
          url: url,
        },
        // "location" is a Rich Text property
        Location: {
          rich_text: [{ text: { content: location } }],
        },
        // "Store" is a Select property
        Store: {
          select: { name: store },
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `Notion API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}
