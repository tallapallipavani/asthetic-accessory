import { v } from "convex/values"
import { mutation } from "./_generated/server"

/**
 * Demo checkout: records the order as paid without touching a payment
 * gateway, so the client can experience the full flow before Razorpay
 * keys are added. Replace the frontend call with checkout:createOrder +
 * checkout:verifyPayment once RAZORPAY_KEY_ID/SECRET are configured.
 * Payment ids carry a "demo:" prefix so real orders are distinguishable.
 */
export const demoPay = mutation({
  args: {
    items: v.array(
      v.object({
        name: v.string(),
        price: v.number(),
        quantity: v.number(),
      }),
    ),
    subtotal: v.number(),
    discount: v.number(),
    shipping: v.number(),
    total: v.number(),
    customer: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
      address: v.optional(v.string()),
    }),
    method: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.total <= 0 || args.items.length === 0)
      throw new Error("Nothing to pay for")
    const number = `AA-${Math.floor(1000 + Math.random() * 9000)}`
    const orderId = await ctx.db.insert("orders", {
      number,
      customer: args.customer,
      items: args.items,
      subtotal: args.subtotal,
      discount: args.discount,
      shipping: args.shipping,
      total: args.total,
      status: "paid",
      paymentId: `demo:${args.method ?? "upi"}:${Date.now()}`,
      createdAt: Date.now(),
    })
    return { id: orderId, number }
  },
})