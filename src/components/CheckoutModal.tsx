import { useState } from "react"
import type { CartItem, Order, Reward } from "../types"
import { placeDemoOrder } from "../lib/checkout"
import { formatPrice } from "../lib/currency"
import { colors, fonts, gradients } from "../lib/theme"
import { useOverlay } from "../lib/useOverlay"
import GoldLogoMark from "./GoldLogoMark"

const UPI_APPS = [
  { id: "gpay", name: "Google Pay", icon: "🟢", note: "GPay" },
  { id: "phonepe", name: "PhonePe", icon: "🟣", note: "PhonePe" },
  { id: "paytm", name: "Paytm", icon: "🔵", note: "Paytm" },
  { id: "card", name: "Card / Netbanking", icon: "💳", note: "Other methods" },
]


export default function CheckoutModal({
  items,
  rewards,
  subtotal,
  discount,
  shipping,
  total,
  onClose,
  onComplete,
}: {
  items: CartItem[]
  rewards: Reward[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  onClose: () => void
  onComplete: (order: Order) => void
}) {
  const overlayRef = useOverlay(onClose)
  const [step, setStep] = useState<"details" | "pay" | "processing">("details")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [formError, setFormError] = useState("")
  const [payError, setPayError] = useState("")

  const continueToPay = () => {
    if (!name.trim() || !email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setFormError("Please enter your name and a valid email address.")
      return
    }
    setFormError("")
    setStep("pay")
  }

  const pay = async (method: string) => {
    setPayError("")
    setStep("processing")
    // Simulate the UPI app redirect + approval round-trip.
    await new Promise((r) => setTimeout(r, 1800))
    try {
      const placed = await placeDemoOrder(
        {
          items: items.map((i) => ({
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
          subtotal,
          discount,
          shipping,
          total,
          customer: { name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, address: address.trim() || undefined },
        },
        method,
      )
      onComplete({
        number: placed.number,
        items,
        rewards,
        subtotal,
        discount,
        shipping,
        total,
      })
    } catch {
      setStep("pay")
      setPayError("Payment failed to record — please try again.")
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${colors.line}`,
    background: "white",
    color: colors.ink,
    fontFamily: fonts.sans,
    fontSize: "0.85rem",
    outline: "none",
  }
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.72rem",
    marginBottom: 4,
    color: colors.brown,
    fontFamily: fonts.sans,
    letterSpacing: "0.04em",
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,6,4,0.65)", backdropFilter: "blur(8px)" }}
    >
      <div
        ref={overlayRef}
        role="dialog"
        aria-modal="true"
        aria-label="Checkout"
        className="w-full max-w-md rounded-3xl overflow-hidden max-h-[92vh] flex flex-col"
        style={{
          background: colors.cream,
          border: "1px solid rgba(200,151,58,0.22)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ background: gradients.goldBar, height: 3 }} />
        <div className="relative px-7 py-6 overflow-y-auto">
          <button
            onClick={onClose}
            aria-label="Close checkout"
            className="absolute top-5 right-6 transition-opacity hover:opacity-60"
            style={{ color: colors.tan }}
          >
            ✕
          </button>

          {step === "details" && (
            <>
              <Header icon="🛍️" title="Checkout" subtitle="Where should we send your order?" />
              <div className="space-y-3 mt-5">
                <div>
                  <label style={labelStyle}>Full name *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="Priya Sharma" />
                </div>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="priya@example.com" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={labelStyle}>Phone</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} placeholder="+91 98…" />
                  </div>
                  <div>
                    <label style={labelStyle}>Pincode</label>
                    <input value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} placeholder="400001" inputMode="numeric" />
                  </div>
                </div>
                <Summary items={items} subtotal={subtotal} discount={discount} shipping={shipping} total={total} />
                {formError && <FormError text={formError} />}
                <button
                  onClick={continueToPay}
                  className="w-full py-3.5 rounded-full text-sm font-semibold transition-all hover:brightness-110"
                  style={{ background: gradients.gold, color: colors.ink, fontFamily: fonts.sans }}
                >
                  Continue to Payment
                </button>
              </div>
            </>
          )}

          {step === "pay" && (
            <>
              <Header icon="🔒" title="Choose payment method" subtitle="UPI redirects to your payment app, then returns here" />
              <div className="mt-5 space-y-2.5">
                {UPI_APPS.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => pay(app.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm transition-all hover:brightness-105"
                    style={{
                      background: "white",
                      border: `1px solid ${colors.line}`,
                      color: colors.ink,
                      fontFamily: fonts.sans,
                      textAlign: "left",
                    }}
                  >
                    <span className="text-xl">{app.icon}</span>
                    <span className="flex-1">
                      <span className="block font-medium">{app.name}</span>
                      <span className="block text-xs" style={{ color: colors.tan }}>
                        {app.note}
                      </span>
                    </span>
                    <span style={{ color: colors.gold, fontWeight: 600 }}>{formatPrice(total)}</span>
                  </button>
                ))}
              </div>
              {payError && <FormError text={payError} />}
              <p className="text-[11px] text-center mt-4" style={{ color: colors.tanFaint, fontFamily: fonts.sans }}>
                ⚠️ Demo mode — no real payment happens. Real UPI/card payments switch on when Razorpay keys are added.
              </p>
            </>
          )}

          {step === "processing" && (
            <div className="py-16 flex flex-col items-center text-center">
              <GoldLogoMark size={44} className="mb-5" />
              <p style={{ fontFamily: fonts.serif, color: colors.ink, fontSize: "1.15rem" }}>
                Processing payment…
              </p>
              <p className="text-sm mt-1" style={{ color: colors.tan, fontFamily: fonts.sans }}>
                (Demo — approving your payment now)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Header({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl mb-2">{icon}</p>
      <h3 style={{ fontFamily: fonts.serif, color: colors.ink, fontSize: "1.4rem" }}>{title}</h3>
      <p className="text-xs mt-1" style={{ color: colors.tan, fontFamily: fonts.sans }}>
        {subtitle}
      </p>
    </div>
  )
}

function Summary({
  items,
  subtotal,
  discount,
  shipping,
  total,
}: {
  items: CartItem[]
  subtotal: number
  discount: number
  shipping: number
  total: number
}) {
  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{ background: colors.creamMuted, border: `1px solid ${colors.line}` }}
    >
      {items.map((i) => (
        <div key={i.id} className="flex justify-between text-xs py-0.5" style={{ color: colors.brown, fontFamily: fonts.sans }}>
          <span className="truncate pr-3">
            {i.quantity} × {i.name}
          </span>
          <span style={{ color: colors.ink }}>{formatPrice(i.price * i.quantity)}</span>
        </div>
      ))}
      <div className="border-t mt-2 pt-2 space-y-0.5 text-xs" style={{ borderColor: colors.line, fontFamily: fonts.sans }}>
        <Row label="Subtotal" value={formatPrice(subtotal)} color={colors.tan} />
        {discount > 0 && <Row label="Reward discount" value={`−${formatPrice(discount)}`} color={colors.success} />}
        <Row label="Shipping" value={shipping === 0 ? "Free" : formatPrice(shipping)} color={colors.tan} />
        <Row label="Total" value={formatPrice(total)} color={colors.ink} bold />
      </div>
    </div>
  )
}

function Row({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  return (
    <div className="flex justify-between" style={{ color, fontWeight: bold ? 700 : 400 }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

function FormError({ text }: { text: string }) {
  return (
    <p className="text-xs mt-3" style={{ color: colors.danger, fontFamily: fonts.sans }}>
      {text}
    </p>
  )
}