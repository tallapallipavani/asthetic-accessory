import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Reads the ADMIN_PASSWORD env var set on the deployment. Every admin
// function below requires the matching password on every call (the client
// keeps it in sessionStorage for the session).
function checkAdmin(password: string) {
  const expected = process.env.ADMIN_PASSWORD ?? ""
  if (!expected)
    throw new Error("ADMIN_PASSWORD is not configured on this deployment")
  if (password !== expected)
    throw new Error("Incorrect admin password")
}

/** Returns true when the submitted password is correct. */
export const login = mutation({
  args: { password: v.string() },
  handler: (_ctx, { password }) => {
    return process.env.ADMIN_PASSWORD !== undefined && password === process.env.ADMIN_PASSWORD
  },
})

/** Every product (active and archived), newest first — for the admin editor. */
export const listAll = query({
  args: { password: v.string() },
  handler: async (ctx, { password }) => {
    checkAdmin(password)
    const products = await ctx.db.query("products").order("desc").collect()
    return Promise.all(
      products.map(async (p) => ({
        ...p,
        image: p.imageStorageId
          ? (await ctx.storage.getUrl(p.imageStorageId)) ?? p.imageUrl ?? null
          : p.imageUrl ?? null,
      })),
    )
  },
})

/** Orders, newest first, for the admin dashboard. */
export const listOrders = query({
  args: { password: v.string() },
  handler: async (ctx, { password }) => {
    checkAdmin(password)
    return ctx.db.query("orders").order("desc").collect()
  },
})

/** Insert a new product or patch an existing one by id. */
export const upsertProduct = mutation({
  args: {
    password: v.string(),
    id: v.optional(v.id("products")),
    name: v.string(),
    price: v.number(),
    category: v.string(),
    tag: v.optional(v.string()),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    checkAdmin(args.password)
    const { id, password: _password, ...fields } = args

    if (id) {
      const existing = await ctx.db.get(id)
      if (!existing) throw new Error("Product not found")
      await ctx.db.patch(id, {
        ...fields,
        tag: fields.tag || undefined,
        description: fields.description || undefined,
        imageUrl: fields.imageUrl || undefined,
        imageStorageId: fields.imageStorageId || undefined,
      })
      return { id }
    }

    const inserted = await ctx.db.insert("products", {
      ...fields,
      createdAt: Date.now(),
    })
    return { id: inserted }
  },
})

/** Deletes a product and its stored photo. */
export const deleteProduct = mutation({
  args: { password: v.string(), id: v.id("products") },
  handler: async (ctx, { password, id }) => {
    checkAdmin(password)
    const product = await ctx.db.get(id)
    if (!product) return
    if (product.imageStorageId) await ctx.storage.delete(product.imageStorageId)
    await ctx.db.delete(id)
  },
})

/** URL the admin UI uploads a product photo to (returns a storage id). */
export const generateUploadUrl = mutation({
  args: { password: v.string() },
  handler: async (ctx, { password }) => {
    checkAdmin(password)
    return ctx.storage.generateUploadUrl()
  },
})

/**
 * One-off migration: moves the demo catalog to realistic INR prices
 * (matches src/data.ts). Safe to run repeatedly.
 */
export const applyInrPricing = mutation({
  args: { password: v.string() },
  handler: async (ctx, { password }) => {
    checkAdmin(password)
    const prices: Record<string, number> = {
      "Delicate Pearl Necklace": 4999,
      "18K Gold Twist Ring": 8999,
      "Crystal Drop Earrings": 3499,
      "Layered Chain Bracelet": 4499,
      "Minimalist Hoop Earrings": 2499,
      "Beaded Anklet": 1999,
      "Vintage Locket Necklace": 12999,
      "Diamond Tennis Bracelet": 28999,
      "Moonstone Pendant": 7999,
      "Twisted Gold Bangle": 15999,
      "Sapphire Stud Earrings": 18999,
      "Infinity Anklet": 2999,
    }
    const products = await ctx.db.query("products").collect()
    let updated = 0
    for (const p of products) {
      const price = prices[p.name]
      if (price !== undefined) {
        await ctx.db.patch(p._id, { price })
        updated++
      }
    }
    return { updated }
  },
})