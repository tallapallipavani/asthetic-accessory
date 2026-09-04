import { v } from "convex/values"
import { mutation } from "./_generated/server"

/**
 * Stores a newsletter subscription. Returns "subscribed" for a new email or
 * "already" when that address is already on the list.
 */
export const subscribe = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Invalid email")
    const existing = await ctx.db
      .query("subscribers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first()
    if (existing) return { status: "already" as const }
    await ctx.db.insert("subscribers", { email, createdAt: Date.now() })
    return { status: "subscribed" as const }
  },
})
