import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";

const http = httpRouter();
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type,x-athlete-os-secret" } });

function has(s: string, token: string) { return s.indexOf(token) >= 0; }
function sportFrom(value: unknown): Doc<"plannedSessions">["sport"] {
  const s = String(value ?? "").toLowerCase();
  if (has(s, "run")) return "run";
  if (has(s, "ride") || has(s, "bike") || has(s, "cycling") || has(s, "bik")) return "bike";
  if (has(s, "swim")) return "swim";
  if (has(s, "strength") || has(s, "gym") || has(s, "weights")) return "strength";
  if (has(s, "recover") || has(s, "rest") || has(s, "mobility")) return "recovery";
  return "coach";
}

function dayFrom(x: Record<string, unknown>) {
  const raw = String(x.day ?? x.date ?? x.start_date ?? x.startDate ?? x.start_time ?? x.startTime ?? "");
  return raw.slice(0, 10);
}

function titleFrom(x: Record<string, unknown>) {
  const workoutDoc = (x.workout_doc ?? {}) as Record<string, unknown>;
  return String(x.title ?? x.name ?? workoutDoc.name ?? x.category ?? x.type ?? "Planned workout");
}

function slotFrom(x: Record<string, unknown>, index: number) {
  const raw = x.id ?? x.sourceId ?? x.source_id ?? x.event_id ?? x.uid;
  return raw ? String(raw) : `calendar-${dayFrom(x)}-${index}`;
}

async function validSecret(req: Request) {
  const env = ((globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env) ?? {};
  const expected = env.ATHLETE_OS_INGEST_SECRET;
  if (!expected) return true;
  return req.headers.get("x-athlete-os-secret") === expected;
}

http.route({ path: "/health", method: "GET", handler: httpAction(async () => json({ ok: true, service: "athlete-os-convex", version: "0.6.0" })) });
http.route({ path: "/health", method: "OPTIONS", handler: httpAction(async () => json({ ok: true })) });

http.route({ path: "/telegram/intake", method: "POST", handler: httpAction(async (ctx, req) => {
  const body = await req.json();
  await ctx.runMutation(api.ledger.upsertActivity, { athleteSlug: body.athleteSlug ?? "tommaso", source: "telegram", sourceId: body.messageId ? String(body.messageId) : undefined, sport: body.sport ?? "coach", type: body.type ?? "coach_note", day: body.day, t: body.t, title: body.title ?? "Telegram update", value: body.value, note: body.note ?? body.text, payload: body });
  return json({ ok: true });
}) });

http.route({ path: "/planner/intake", method: "OPTIONS", handler: httpAction(async () => json({ ok: true })) });
http.route({ path: "/planner/intake", method: "POST", handler: httpAction(async (ctx, req) => {
  if (!(await validSecret(req))) return json({ ok: false, error: "unauthorized" }, 401);
  const body = await req.json();
  const athleteSlug = body.athleteSlug ?? "tommaso";
  const source = body.source ?? "intervals";
  const rows = Array.isArray(body.sessions) ? body.sessions : Array.isArray(body.events) ? body.events : [];
  let upserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const [index, raw] of rows.entries()) {
    const row = raw as Record<string, unknown>;
    const day = dayFrom(row);
    if (!day) { skipped += 1; continue; }
    const title = titleFrom(row);
    try {
      await ctx.runMutation(api.planner.upsertSession, {
        athleteSlug,
        day,
        slot: `${source}:${slotFrom(row, index)}`,
        sport: sportFrom(row.sport ?? row.type ?? row.category ?? title),
        title,
        prescription: { source, sourceId: slotFrom(row, index), importedAt: Date.now(), raw: row },
      });
      upserted += 1;
    } catch (err) {
      skipped += 1;
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  return json({ ok: errors.length === 0, source, upserted, skipped, errors: errors.slice(0, 5) }, errors.length ? 207 : 200);
}) });

export default http;
