import { v } from "convex/values"
import { mutation } from "../_generated/server"

const orderShape = {
  order: v.object({
    number: v.string(),
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
  }),
}

export const insertPendingOrder = mutation({
  args: orderShape,
  handler: async (ctx, { order }) => {
    return ctx.db.insert("orders", {
      number: order.number,
      customer: order.customer,
      items: order.items,
      subtotal: order.subtotal,
      discount: order.discount,
      shipping: order.shipping,
      total: order.total,
      status: "pending",
      createdAt: Date.now(),
    })
  },
})

export const cancelOrder = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    await ctx.db.delete(orderId)
  },
})

export const attachRazorpayOrder = mutation({
  args: { orderId: v.id("orders"), razorpayOrderId: v.string() },
  handler: async (ctx, { orderId, razorpayOrderId }) => {
    await ctx.db.patch(orderId, { razorpayOrderId })
  },
})

export const markPaid = mutation({
  args: { orderId: v.id("orders"), paymentId: v.string() },
  handler: async (ctx, { orderId, paymentId }) => {
    const order = await ctx.db.get(orderId)
    if (!order) return
    await ctx.db.patch(orderId, { status: "paid", paymentId })
  },
})

export const markPaidByRazorpayOrder = mutation({
  args: { razorpayOrderId: v.string(), paymentId: v.string() },
  handler: async (ctx, { razorpayOrderId, paymentId }) => {
    const order = await ctx.db
      .query("orders")
      .filter((q) => q.eq(q.field("razorpayOrderId"), razorpayOrderId))
      .first()
    if (!order) return
    await ctx.db.patch(order._id, { status: "paid", paymentId })
  },
})

export const markFailedByRazorpayOrder = mutation({
  args: { razorpayOrderId: v.string() },
  handler: async (ctx, { razorpayOrderId }) => {
    const order = await ctx.db
      .query("orders")
      .filter((q) => q.eq(q.field("razorpayOrderId"), razorpayOrderId))
      .first()
    if (!order) return
    await ctx.db.patch(order._id, { status: "failed" })
  },
})