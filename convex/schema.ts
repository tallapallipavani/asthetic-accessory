import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  products: defineTable({
    name: v.string(),
    price: v.number(), // price in INR paise? No — plain INR number, e.g. 1499
    sku: v.optional(v.string()),
    stock: v.optional(v.number()), // units on hand; undefined = not tracked
    category: v.string(),
    tag: v.optional(v.string()),
    description: v.optional(v.string()),
    // Convex File Storage ID, or null until a photo is uploaded
    imageStorageId: v.optional(v.id("_storage")),
    // Legacy remote photo URL (unsplash/pexels) used for demo seed data
    imageUrl: v.optional(v.string()),
    active: v.boolean(), // false hides it from the storefront
    createdAt: v.number(), // epoch ms — drives "Newest First"
  }).index("by_active", ["active"]),
  orders: defineTable({
    number: v.string(),
    customer: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
      address: v.optional(v.string()),
    }),
    items: v.array(
      v.object({
        productId: v.optional(v.id("products")),
        name: v.string(),
        price: v.number(),
        quantity: v.number(),
      }),
    ),
    subtotal: v.number(),
    discount: v.number(),
    shipping: v.number(),
    total: v.number(),
    // "pending" until the payment webhook confirms it, then "paid"
    status: v.string(),
    // Friendly payment channel, e.g. "Google Pay", "PhonePe", "Card / Netbanking"
    paymentMethod: v.optional(v.string()),
    // Gateway transaction id — demo ids carry a "demo:" prefix; real Razorpay
    // captures store the Razorpay payment id here.
    paymentId: v.optional(v.string()),
    // Razorpay order id created server-side at checkout ("rzp_...").
    razorpayOrderId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_status", ["status"]).index("by_razorpay_order", ["razorpayOrderId"]),
  subscribers: defineTable({
    email: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),
})