import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const setConnectionStatus = mutation({
  args: { athleteSlug: v.string(), provider: v.union(v.literal("garmin"), v.literal("peloton"), v.literal("intervals"), v.literal("telegram")), status: v.union(v.literal("requested"), v.literal("connected"), v.literal("paused"), v.literal("error")), secretRef: v.optional(v.string()), metadata: v.optional(v.any()) },
  handler: async (ctx, args) => {
    const athlete = await ctx.db.query("athletes").withIndex("by_slug", q => q.eq("slug", args.athleteSlug)).unique();
    if (!athlete) throw new Error("Athlete not found");
    const ts = Date.now();
    const existing = await ctx.db.query("deviceConnections").withIndex("by_athlete_provider", q => q.eq("athleteId", athlete._id).eq("provider", args.provider)).unique();
    const doc = { athleteId: athlete._id, provider: args.provider, status: args.status, secretRef: args.secretRef, metadata: args.metadata ?? {}, updatedAt: ts };
    if (existing) { await ctx.db.patch(existing._id, doc); return existing._id; }
    return await ctx.db.insert("deviceConnections", { ...doc, createdAt: ts });
  },
});
