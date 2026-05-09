import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { sportValidator } from "./schema";

export const upsertSession = mutation({
  args: { athleteSlug: v.string(), day: v.string(), slot: v.string(), sport: sportValidator, title: v.string(), prescription: v.any() },
  handler: async (ctx, args) => {
    const athlete = await ctx.db.query("athletes").withIndex("by_slug", q => q.eq("slug", args.athleteSlug)).unique();
    if (!athlete) throw new Error("Athlete not found");
    const ts = Date.now();
    const existing = await ctx.db.query("plannedSessions").withIndex("by_athlete_day", q => q.eq("athleteId", athlete._id).eq("day", args.day)).filter(q => q.eq(q.field("slot"), args.slot)).unique();
    const doc = { athleteId: athlete._id, day: args.day, slot: args.slot, sport: args.sport, title: args.title, prescription: args.prescription, status: "planned" as const, updatedAt: ts };
    if (existing) { await ctx.db.patch(existing._id, doc); return existing._id; }
    return await ctx.db.insert("plannedSessions", { ...doc, createdAt: ts });
  },
});

export const removeSessionBySlot = mutation({
  args: { athleteSlug: v.string(), day: v.string(), slot: v.string() },
  handler: async (ctx, args) => {
    const athlete = await ctx.db.query("athletes").withIndex("by_slug", q => q.eq("slug", args.athleteSlug)).unique();
    if (!athlete) return false;
    const existing = await ctx.db.query("plannedSessions").withIndex("by_athlete_day", q => q.eq("athleteId", athlete._id).eq("day", args.day)).filter(q => q.eq(q.field("slot"), args.slot)).unique();
    if (!existing) return false;
    await ctx.db.delete(existing._id);
    return true;
  },
});

export const shiftSession = mutation({
  args: { sessionId: v.id("plannedSessions"), toDay: v.string() },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.sessionId);
    if (!source) throw new Error("Session not found");
    const ts = Date.now();
    await ctx.db.patch(source._id, { status: "shifted", updatedAt: ts });
    return await ctx.db.insert("plannedSessions", { athleteId: source.athleteId, day: args.toDay, slot: source.slot, sport: source.sport, title: source.title, prescription: source.prescription, status: "planned", shiftedFrom: source._id, createdAt: ts, updatedAt: ts });
  },
});

export const week = query({
  args: { athleteSlug: v.string(), fromDay: v.string(), toDay: v.string() },
  handler: async (ctx, args) => {
    const athlete = await ctx.db.query("athletes").withIndex("by_slug", q => q.eq("slug", args.athleteSlug)).unique();
    if (!athlete) return [];
    const rows = await ctx.db.query("plannedSessions").filter(q => q.eq(q.field("athleteId"), athlete._id)).collect();
    return rows.filter(r => r.day >= args.fromDay && r.day <= args.toDay).sort((a,b)=>(a.day+a.slot).localeCompare(b.day+b.slot));
  },
});
