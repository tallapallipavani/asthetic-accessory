"use node"

import { createHmac, timingSafeEqual } from "node:crypto"
import { v } from "convex/values"
import { action } from "./_generated/server"
import { internal as rawInternal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"

// The generated `internal` binding can't be fully type-resolved from within
// files that are themselves part of the generated API (circular reference),
// so it is re-typed here — the runtime value is correct.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const internal = rawInternal as any

const RAZORPAY_API = "https://api.razorpay.com/v1"

function razorpayAuth(): { id: string; secret: string } {
  const id = process.env.RAZORPAY_KEY_ID
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!id || !secret)
    throw new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the Convex dashboard (test keys are fine).",
    )
  return { id, secret }
}

const orderShape = {
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
}

/**
 * Records a pending order in the database, asks Razorpay for a payment
 * order, and returns everything the checkout page needs to open the
 * Razorpay payment sheet (which deep-links into UPI apps like GPay/PhonePe).
 */
export const createOrder = action({
  args: orderShape,
  handler: async (ctx, args) => {
    const { id: keyId, secret } = razorpayAuth()
    const totalPaise = Math.round(args.total * 100)

    // Persist the order first so we have a stable id. If anything fails
    // before payment it is deleted — the customer can always retry.
    const orderId = (await ctx.runMutation(
      internal.checkout.insertPendingOrder,
      { order: args },
    )) as Id<"orders">

    try {
      const response = await fetch(`${RAZORPAY_API}/orders`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${keyId}:${secret}`).toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: totalPaise,
          currency: "INR",
          receipt: args.number,
          notes: { orderNumber: args.number },
        }),
      })
      const data = (await response.json()) as {
        id?: string
        error?: { description?: string }
      }
      if (!response.ok || !data.id) {
        await ctx.runMutation(internal.checkout.cancelOrder, { orderId })
        throw new Error(data.error?.description ?? "Razorpay order creation failed")
      }
      await ctx.runMutation(internal.checkout.attachRazorpayOrder, {
        orderId,
        razorpayOrderId: data.id,
      })
      return {
        orderId,
        razorpayOrderId: data.id,
        amountPaise: totalPaise,
        currency: "INR",
      }
    } catch (err) {
      await ctx.runMutation(internal.checkout.cancelOrder, { orderId }).catch(() => {})
      throw err
    }
  },
})

/**
 * Called from the checkout page's success handler. Verifies the payment
 * signature Razorpay returned (HMAC of orderId|paymentId with the key
 * secret) before marking the order paid. The webhook is the source of
 * truth; this just gives the customer instant confirmation.
 */
export const verifyPayment = action({
  args: {
    orderId: v.id("orders"),
    razorpayPaymentId: v.string(),
    razorpayOrderId: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, args: { orderId: Id<"orders">; razorpayPaymentId: string; razorpayOrderId: string; signature: string }) => {
    const { secret } = razorpayAuth()
    const expected = createHmac("sha256", secret)
      .update(`${args.razorpayOrderId}|${args.razorpayPaymentId}`)
      .digest()
    const received = Buffer.from(args.signature, "hex")
    if (
      received.length !== expected.length ||
      !timingSafeEqual(received, expected)
    ) {
      return { ok: false }
    }
    await ctx.runMutation(internal.checkout.markPaid, {
      orderId: args.orderId,
      paymentId: args.razorpayPaymentId,
    })
    return { ok: true }
  },
})