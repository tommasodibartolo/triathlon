import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { sourceValidator, sportValidator } from "./schema";
import { normalizeDay, normalizeTime, now, sourcePolicy } from "./services/sourcePolicy";

export const ensureAthlete = mutation({
  args: { slug: v.string(), name: v.optional(v.string()), timezone: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("athletes").withIndex("by_slug", q => q.eq("slug", args.slug)).unique();
    const ts = now();
    if (existing) {
      await ctx.db.patch(existing._id, { name: args.name ?? existing.name, timezone: args.timezone ?? existing.timezone, updatedAt: ts });
      return existing._id;
    }
    return await ctx.db.insert("athletes", { slug: args.slug, name: args.name ?? args.slug, timezone: args.timezone, createdAt: ts, updatedAt: ts });
  },
});

export const listActivity = query({
  args: { athleteSlug: v.string(), day: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const athlete = await ctx.db.query("athletes").withIndex("by_slug", q => q.eq("slug", args.athleteSlug)).unique();
    if (!athlete) return [];
    const rows = args.day
      ? await ctx.db.query("activityRecords").withIndex("by_athlete_day", q => q.eq("athleteId", athlete._id).eq("day", args.day!)).collect()
      : await ctx.db.query("activityRecords").filter(q => q.eq(q.field("athleteId"), athlete._id)).take(args.limit ?? 100);
    return rows.sort((a, b) => (b.day + b.t).localeCompare(a.day + a.t));
  },
});

export const upsertActivity = mutation({
  args: {
    athleteSlug: v.string(), source: sourceValidator, sourceId: v.optional(v.string()), sport: sportValidator,
    type: v.string(), day: v.optional(v.string()), t: v.optional(v.string()), title: v.string(), value: v.optional(v.string()), note: v.optional(v.string()), payload: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    const athlete = await ctx.db.query("athletes").withIndex("by_slug", q => q.eq("slug", args.athleteSlug)).unique();
    if (!athlete) throw new Error("Athlete not found; call ensureAthlete first");
    const ts = now();
    const policy = sourcePolicy(args.source);
    const sourceId = args.sourceId ?? `${args.source}:${args.day ?? normalizeDay()}:${args.title}`;
    const existing = await ctx.db.query("activityRecords").withIndex("by_source", q => q.eq("source", args.source).eq("sourceId", sourceId)).unique();
    const doc = { athleteId: athlete._id, source: args.source, sourceId, locked: policy.locked, deletable: policy.deletable, sport: args.sport, type: args.type, day: normalizeDay(args.day), t: normalizeTime(args.t), title: args.title, value: args.value, note: args.note, payload: args.payload ?? {}, updatedAt: ts };
    if (existing) { await ctx.db.patch(existing._id, doc); return existing._id; }
    return await ctx.db.insert("activityRecords", { ...doc, createdAt: ts });
  },
});

export const deleteActivity = mutation({
  args: { id: v.id("activityRecords") },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row) return { ok: true, deleted: false };
    if (row.locked || !row.deletable) throw new Error("Locked device/import records cannot be deleted; add a correction or exclude flag instead.");
    await ctx.db.delete(args.id);
    return { ok: true, deleted: true };
  },
});
