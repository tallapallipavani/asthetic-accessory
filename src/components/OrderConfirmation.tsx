import { formatPrice } from "../lib/currency"
import { colors, fonts, gradients } from "../lib/theme"
import { useOverlay } from "../lib/useOverlay"
import type { Order } from "../types"
import GoldLogoMark from "./GoldLogoMark"

export default function OrderConfirmation({
  order,
  onClose,
}: {
  order: Order
  onClose: () => void
}) {
  const overlayRef = useOverlay(onClose)
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,6,4,0.9)", backdropFilter: "blur(12px)" }}
    >
      <div
        ref={overlayRef}
        role="dialog"
        aria-modal="true"
        aria-label="Order confirmation"
        className="relative w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: gradients.modal,
          border: "1px solid rgba(200,151,58,0.22)",
          boxShadow:
            "0 0 80px rgba(200,151,58,0.1), 0 30px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            background:
              gradients.goldBar,
            height: 3,
          }}
        />
        <div className="p-7">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 transition-opacity hover:opacity-60"
            style={{ color: colors.gold }}
            aria-label="Close"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="text-center mb-5">
            <GoldLogoMark size={44} className="mx-auto mb-3" />
            <p
              className="text-xs uppercase mb-2"
              style={{
                color: colors.gold,
                fontFamily: fonts.sans,
                fontWeight: 700,
                letterSpacing: "0.22em",
              }}
            >
              ✦ Order Confirmed ✦
            </p>
            <h3
              style={{
                fontFamily: fonts.serif,
                color: colors.cream,
                fontSize: "1.6rem",
                lineHeight: 1.15,
              }}
            >
              Thank you for your order!
            </h3>
            <p
              className="mt-1.5 text-xs"
              style={{ color: colors.brownMid, fontFamily: fonts.sans }}
            >
              Order #{order.number}
            </p>
          </div>

          {/* applied rewards */}
          {order.rewards.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-2 justify-center">
              {order.rewards.map((r) => (
                <span
                  key={r.id}
                  className="text-xs px-3 py-1.5 rounded-full"
                  style={{
                    background: "rgba(109,186,90,0.12)",
                    border: "1px solid rgba(109,186,90,0.3)",
                    color: colors.success,
                    fontFamily: fonts.sans,
                  }}
                >
                  {r.icon} {r.label}
                </span>
              ))}
            </div>
          )}

          {/* items */}
          <div className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-1">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-xs"
                style={{ color: colors.tanWarm, fontFamily: fonts.sans }}
              >
                <span className="truncate pr-3">
                  {item.quantity} × {item.name}
                </span>
                <span style={{ color: colors.goldLight }}>
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* totals */}
          <div className="space-y-1.5 mb-5">
            <div
              className="flex justify-between text-sm"
              style={{ fontFamily: fonts.sans, color: colors.tan }}
            >
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div
                className="flex justify-between text-sm"
                style={{ fontFamily: fonts.sans, color: colors.success }}
              >
                <span>Reward discount</span>
                <span>−{formatPrice(order.discount)}</span>
              </div>
            )}
            <div
              className="flex justify-between text-sm"
              style={{ fontFamily: fonts.sans, color: colors.tan }}
            >
              <span>Shipping</span>
              <span>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</span>
            </div>
            <div
              className="flex justify-between font-semibold pt-3"
              style={{
                fontFamily: fonts.sans,
                color: colors.cream,
                borderTop: "1px solid rgba(200,151,58,0.15)",
                fontSize: "1.05rem",
              }}
            >
              <span>Total</span>
              <span style={{ color: colors.goldLight }}>{formatPrice(order.total)}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-full text-sm font-semibold transition-all hover:brightness-110"
            style={{
              background: gradients.gold,
              color: colors.ink,
              fontFamily: fonts.sans,
              letterSpacing: "0.07em",
              boxShadow: "0 4px 20px rgba(200,151,58,0.4)",
            }}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  )
}