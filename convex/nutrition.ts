import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const slots = [
  ["pre", "espresso + banana if needed", 120, 5, 25, 1, "Use before endurance or low appetite mornings."],
  ["breakfast", "60g oats + 150g Greek yogurt + berries + honey + whey", 620, 48, 82, 12, "High-carb/high-protein recovery anchor."],
  ["lunch", "180g chicken/rice bowl + olive oil + vegetables", 780, 55, 90, 22, "Main post-training calorie block."],
  ["snack", "protein shake + fruit + nuts or bagel", 430, 35, 50, 12, "Protect bulk target without heavy digestion."],
  ["dinner", "salmon/lean beef + potatoes/pasta + vegetables", 820, 55, 85, 28, "Finish protein and micronutrients."],
] as const;

export const prescribeDay = mutation({
  args: { athleteSlug: v.string(), day: v.string(), baseBurn: v.optional(v.number()), trainingBurn: v.optional(v.number()), surplus: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const athlete = await ctx.db.query("athletes").withIndex("by_slug", q => q.eq("slug", args.athleteSlug)).unique();
    if (!athlete) throw new Error("Athlete not found");
    const total = (args.baseBurn ?? 2100) + (args.trainingBurn ?? 0) + (args.surplus ?? 250);
    const scale = Math.max(.85, Math.min(1.45, total / 2770));
    const ts = Date.now();
    const created = [];
    for (const [slot, items, kcal, protein, carbs, fat, coachNote] of slots) {
      const existing = await ctx.db.query("mealPrescriptions").withIndex("by_athlete_day", q => q.eq("athleteId", athlete._id).eq("day", args.day)).filter(q => q.eq(q.field("slot"), slot)).unique();
      const doc = { athleteId: athlete._id, day: args.day, slot, title: slot, kcal: Math.round(kcal * scale), protein: Math.round(protein * scale), carbs: Math.round(carbs * scale), fat: Math.round(fat * scale), items, coachNote, status: "proposed" as const, updatedAt: ts };
      if (existing) { await ctx.db.patch(existing._id, doc); created.push(existing._id); }
      else created.push(await ctx.db.insert("mealPrescriptions", { ...doc, createdAt: ts }));
    }
    return { totalKcal: Math.round(total), mealIds: created };
  },
});

export const listMeals = query({
  args: { athleteSlug: v.string(), day: v.string() },
  handler: async (ctx, args) => {
    const athlete = await ctx.db.query("athletes").withIndex("by_slug", q => q.eq("slug", args.athleteSlug)).unique();
    if (!athlete) return [];
    return await ctx.db.query("mealPrescriptions").withIndex("by_athlete_day", q => q.eq("athleteId", athlete._id).eq("day", args.day)).collect();
  },
});

export const approveMeal = mutation({
  args: { mealId: v.id("mealPrescriptions"), editedItems: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const meal = await ctx.db.get(args.mealId);
    if (!meal) throw new Error("Meal not found");
    const items = args.editedItems ?? meal.items;
    const status = args.editedItems ? "edited" as const : "approved" as const;
    await ctx.db.patch(meal._id, { items, status, updatedAt: Date.now() });
    await ctx.db.insert("activityRecords", { athleteId: meal.athleteId, source: "manual", locked: false, deletable: true, sport: "nutrition", type: "nutrition", day: meal.day, t: new Date().toISOString().slice(11,16), title: meal.slot, value: items, note: `meal ${status} from coach prescription`, payload: { mealId: meal._id, kcal: meal.kcal, protein: meal.protein, carbs: meal.carbs, fat: meal.fat }, createdAt: Date.now(), updatedAt: Date.now() });
    return { ok: true, status };
  },
});
