import { httpRouter } from "convex/server"
import { httpAction } from "./_generated/server"
import { internal as rawInternal } from "./_generated/api"

// See note in checkout.ts — generated internal binding is accessed untyped.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const internal = rawInternal as any

const http = httpRouter()

async function hmacSha256(secret: string, data: string): Promise<Uint8Array> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(data))
  return new Uint8Array(signature)
}

function buffersEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

/**
 * Razorpay webhook receiver. Configure the dashboard webhook to POST to
 * https://<deployment>.convex.site/razorpay-webhook with the
 * RAZORPAY_WEBHOOK_SECRET set on the deployment.
 */
http.route({
  path: "/razorpay-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET
    const signature = request.headers.get("X-Razorpay-Signature")
    const raw = await request.text()

    if (!secret || !signature) return new Response("ignored", { status: 200 })

    const expected = await hmacSha256(secret, raw)
    const received = Buffer.from(signature, "hex")
    if (!buffersEqual(expected, received)) {
      return new Response("invalid signature", { status: 400 })
    }

    const payload = JSON.parse(raw) as {
      event: string
      payload?: {
        payment?: { entity?: { id: string; order_id: string } }
        order?: { entity?: { id: string } }
      }
    }
    const entity = payload.payload?.payment?.entity
    const orderEntity = payload.payload?.order?.entity
    const razorpayOrderId = entity?.order_id ?? orderEntity?.id

    if (eventIs(payload.event, "payment.captured") && razorpayOrderId) {
      await ctx.runMutation(internal.checkout.markPaidByRazorpayOrder, {
        razorpayOrderId,
        paymentId: entity?.id ?? "",
      })
    } else if (eventIs(payload.event, "payment.failed") && razorpayOrderId) {
      await ctx.runMutation(internal.checkout.markFailedByRazorpayOrder, {
        razorpayOrderId,
      })
    }
    return new Response("ok", { status: 200 })
  }),
})

function eventIs(event: string, expected: string): boolean {
  return event === expected || event.endsWith(`.${expected}`)
}

export default http