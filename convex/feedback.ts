import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { sourceValidator, sportValidator } from "./schema";

const now = () => Date.now();

async function getAthlete(ctx: any, athleteSlug: string) {
  const athlete = await ctx.db.query("athletes").withIndex("by_slug", (q: any) => q.eq("slug", athleteSlug)).unique();
  if (!athlete) throw new Error("Athlete not found; call ledger:ensureAthlete first");
  return athlete;
}

export const recordBodyMetric = mutation({
  args: {
    athleteSlug: v.string(),
    day: v.string(),
    t: v.optional(v.string()),
    bodyWeightKg: v.optional(v.number()),
    bodyFatPct: v.optional(v.number()),
    waistCm: v.optional(v.number()),
    source: sourceValidator,
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const athlete = await getAthlete(ctx, args.athleteSlug);
    const ts = now();
    return await ctx.db.insert("bodyMetrics", {
      athleteId: athlete._id,
      day: args.day,
      t: args.t ?? new Date(ts).toISOString().slice(11, 16),
      bodyWeightKg: args.bodyWeightKg,
      bodyFatPct: args.bodyFatPct,
      waistCm: args.waistCm,
      source: args.source,
      note: args.note,
      createdAt: ts,
      updatedAt: ts,
    });
  },
});

export const recordActivityMetricSnapshot = mutation({
  args: {
    athleteSlug: v.string(),
    activityRecordId: v.optional(v.id("activityRecords")),
    day: v.string(),
    sport: sportValidator,
    source: sourceValidator,
    sourceId: v.optional(v.string()),
    metrics: v.any(),
    rawText: v.optional(v.string()),
    imageRef: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const athlete = await getAthlete(ctx, args.athleteSlug);
    const ts = now();
    const sourceId = args.sourceId ?? `${args.source}:${args.day}:${args.sport}:snapshot`;
    const existing = await ctx.db.query("activityMetricSnapshots").withIndex("by_source", (q: any) => q.eq("source", args.source).eq("sourceId", sourceId)).unique();
    const doc = {
      athleteId: athlete._id,
      activityRecordId: args.activityRecordId,
      day: args.day,
      sport: args.sport,
      source: args.source,
      sourceId,
      metrics: args.metrics,
      rawText: args.rawText,
      imageRef: args.imageRef,
      updatedAt: ts,
    };
    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return existing._id;
    }
    return await ctx.db.insert("activityMetricSnapshots", { ...doc, createdAt: ts });
  },
});

export const createFeedbackSession = mutation({
  args: {
    athleteSlug: v.string(),
    day: v.string(),
    sessionTitle: v.string(),
    bodyWeightKg: v.optional(v.number()),
    athleteClass: v.optional(v.number()),
    summary: v.string(),
    coachFeedback: v.string(),
    nutritionRecommendation: v.any(),
    inputs: v.any(),
  },
  handler: async (ctx, args) => {
    const athlete = await getAthlete(ctx, args.athleteSlug);
    const ts = now();
    return await ctx.db.insert("feedbackSessions", {
      athleteId: athlete._id,
      day: args.day,
      sessionTitle: args.sessionTitle,
      bodyWeightKg: args.bodyWeightKg,
      athleteClass: args.athleteClass,
      summary: args.summary,
      coachFeedback: args.coachFeedback,
      nutritionRecommendation: args.nutritionRecommendation,
      inputs: args.inputs,
      createdAt: ts,
      updatedAt: ts,
    });
  },
});

export const listFeedback = query({
  args: { athleteSlug: v.string(), day: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const athlete = await ctx.db.query("athletes").withIndex("by_slug", (q: any) => q.eq("slug", args.athleteSlug)).unique();
    if (!athlete) return [];
    const rows = args.day
      ? await ctx.db.query("feedbackSessions").withIndex("by_athlete_day", (q: any) => q.eq("athleteId", athlete._id).eq("day", args.day!)).collect()
      : await ctx.db.query("feedbackSessions").filter((q: any) => q.eq(q.field("athleteId"), athlete._id)).take(50);
    return rows.sort((a: any, b: any) => b.createdAt - a.createdAt);
  },
});
