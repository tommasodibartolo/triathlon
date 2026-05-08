import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type" } });
http.route({ path: "/health", method: "GET", handler: httpAction(async () => json({ ok: true, service: "athlete-os-convex", version: "0.6.0" })) });
http.route({ path: "/health", method: "OPTIONS", handler: httpAction(async () => json({ ok: true })) });
http.route({ path: "/telegram/intake", method: "POST", handler: httpAction(async (ctx, req) => {
  const body = await req.json();
  await ctx.runMutation(api.ledger.upsertActivity, { athleteSlug: body.athleteSlug ?? "tommaso", source: "telegram", sourceId: body.messageId ? String(body.messageId) : undefined, sport: body.sport ?? "coach", type: body.type ?? "coach_note", day: body.day, t: body.t, title: body.title ?? "Telegram update", value: body.value, note: body.note ?? body.text, payload: body });
  return json({ ok: true });
}) });
export default http;
