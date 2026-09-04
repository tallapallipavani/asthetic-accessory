import { query } from "./_generated/server"
import { v } from "convex/values"

/** Every active product, newest first — feeds the storefront grid. */
export const list = query({
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("active"), true))
      .order("desc")
      .collect()
    return Promise.all(
      products.map(async (p) => ({
        ...p,
        // Stored photo wins; fall back to the legacy remote URL for demo data.
        image: p.imageStorageId
          ? (await ctx.storage.getUrl(p.imageStorageId)) ?? p.imageUrl ?? null
          : p.imageUrl ?? null,
      })),
    )
  },
})

/** A single product by id (used by admin editing and detail views). */
export const get = query({
  args: { id: v.id("products") },
  handler: async (ctx, { id }) => {
    const p = await ctx.db.get(id)
    if (!p) return null
    return {
      ...p,
      image: p.imageStorageId
        ? (await ctx.storage.getUrl(p.imageStorageId)) ?? null
        : null,
    }
  },
})