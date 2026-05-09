import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const sourceValidator = v.union(
  v.literal("manual"), v.literal("telegram"), v.literal("garmin"),
  v.literal("peloton"), v.literal("intervals"), v.literal("api"),
  v.literal("scrape"), v.literal("image"), v.literal("coach")
);

export const sportValidator = v.union(
  v.literal("strength"), v.literal("run"), v.literal("bike"), v.literal("swim"),
  v.literal("nutrition"), v.literal("recovery"), v.literal("body"), v.literal("coach")
);

export default defineSchema({
  athletes: defineTable({
    slug: v.string(),
    name: v.string(),
    timezone: v.optional(v.string()),
    goals: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"]),

  activityRecords: defineTable({
    athleteId: v.id("athletes"),
    source: sourceValidator,
    sourceId: v.optional(v.string()),
    locked: v.boolean(),
    deletable: v.boolean(),
    sport: sportValidator,
    type: v.string(),
    day: v.string(),
    t: v.string(),
    title: v.string(),
    value: v.optional(v.string()),
    note: v.optional(v.string()),
    payload: v.any(),
    excludedFromAnalytics: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_athlete_day", ["athleteId", "day"]).index("by_source", ["source", "sourceId"]),

  plannedSessions: defineTable({
    athleteId: v.id("athletes"),
    day: v.string(),
    slot: v.string(),
    sport: sportValidator,
    title: v.string(),
    prescription: v.any(),
    status: v.union(v.literal("planned"), v.literal("approved"), v.literal("shifted"), v.literal("completed"), v.literal("skipped")),
    shiftedFrom: v.optional(v.id("plannedSessions")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_athlete_day", ["athleteId", "day"]),

  mealPrescriptions: defineTable({
    athleteId: v.id("athletes"),
    day: v.string(),
    slot: v.string(),
    title: v.string(),
    kcal: v.number(),
    protein: v.number(),
    carbs: v.number(),
    fat: v.number(),
    items: v.string(),
    coachNote: v.optional(v.string()),
    status: v.union(v.literal("proposed"), v.literal("approved"), v.literal("edited"), v.literal("skipped")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_athlete_day", ["athleteId", "day"]),

  deviceConnections: defineTable({
    athleteId: v.id("athletes"),
    provider: v.union(v.literal("garmin"), v.literal("peloton"), v.literal("intervals"), v.literal("telegram")),
    status: v.union(v.literal("requested"), v.literal("connected"), v.literal("paused"), v.literal("error")),
    secretRef: v.optional(v.string()),
    lastSyncAt: v.optional(v.number()),
    metadata: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_athlete_provider", ["athleteId", "provider"]),

  sourceSyncRuns: defineTable({
    athleteId: v.id("athletes"),
    provider: v.string(),
    status: v.string(),
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
    stats: v.any(),
    error: v.optional(v.string()),
  }).index("by_athlete_provider", ["athleteId", "provider"]),

  bodyMetrics: defineTable({
    athleteId: v.id("athletes"),
    day: v.string(),
    t: v.string(),
    bodyWeightKg: v.optional(v.number()),
    bodyFatPct: v.optional(v.number()),
    waistCm: v.optional(v.number()),
    source: sourceValidator,
    note: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_athlete_day", ["athleteId", "day"]),

  activityMetricSnapshots: defineTable({
    athleteId: v.id("athletes"),
    activityRecordId: v.optional(v.id("activityRecords")),
    day: v.string(),
    sport: sportValidator,
    source: sourceValidator,
    sourceId: v.optional(v.string()),
    metrics: v.any(),
    rawText: v.optional(v.string()),
    imageRef: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_athlete_day", ["athleteId", "day"]).index("by_source", ["source", "sourceId"]),

  feedbackSessions: defineTable({
    athleteId: v.id("athletes"),
    day: v.string(),
    sessionTitle: v.string(),
    bodyWeightKg: v.optional(v.number()),
    athleteClass: v.optional(v.number()),
    summary: v.string(),
    coachFeedback: v.string(),
    nutritionRecommendation: v.any(),
    inputs: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_athlete_day", ["athleteId", "day"]),

  coachDecisions: defineTable({
    athleteId: v.id("athletes"),
    day: v.string(),
    kind: v.string(),
    recommendation: v.string(),
    rationale: v.string(),
    inputs: v.any(),
    createdAt: v.number(),
  }).index("by_athlete_day", ["athleteId", "day"]),
});
