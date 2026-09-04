import { PRODUCTS } from "../src/data"
import { mutation } from "./_generated/server"

/** Idempotent: seeds the demo catalog only if the products table is empty. */
export const run = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("products").first()
    if (existing) return { inserted: 0 }

    for (const p of PRODUCTS) {
      await ctx.db.insert("products", {
        name: p.name,
        price: p.price,
        category: p.category,
        tag: p.tag,
        imageUrl: p.image ?? undefined,
        active: true,
        sku: p.sku,
        stock: p.stock,
        createdAt: Date.parse(p.addedAt),
      })
    }
    return { inserted: PRODUCTS.length }
  },
})