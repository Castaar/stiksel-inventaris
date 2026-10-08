// Browser-side helper for the JSON API routes. Throws an Error with the server's message.
export async function postJson(url, data) {
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
  } catch {
    throw new Error("Geen verbinding met de server");
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || body.message || `Fout ${response.status}`);
  }
  return body;
}
