/**
 * Owner partnership leads. Validates the submission and hands it on.
 * TODO(backend): forward to email + Google Sheet (brief §4) — set OWNER_LEADS_WEBHOOK_URL to a
 * Google Apps Script / backend endpoint and it will be posted there.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = (key: string, max = 500) => (typeof body[key] === "string" ? (body[key] as string).trim().slice(0, max) : "");
  const lead = {
    name: text("name", 120),
    phone: text("phone", 20),
    location: text("location", 200),
    rooms: Number(body.rooms) || 0,
    photos: text("photos", 500),
    note: text("note", 2000),
    source: text("source", 80),
    page: text("page", 200),
    receivedAt: new Date().toISOString(),
  };

  if (!lead.name || !lead.phone || !lead.location || lead.rooms < 1) {
    return Response.json({ error: "Missing required fields" }, { status: 422 });
  }

  const webhook = process.env.OWNER_LEADS_WEBHOOK_URL;
  if (webhook) {
    const res = await fetch(webhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lead) });
    if (!res.ok) return Response.json({ error: "Could not save the lead" }, { status: 502 });
  } else {
    console.info("[owner-lead]", lead);
  }

  return Response.json({ ok: true });
}
