import logoUrl from "../assets/logo.png"
import { formatPrice, FREE_SHIPPING_MIN, SPIN_MIN } from "../lib/currency"
import {
  discountTotal,
  grandTotal as computeGrandTotal,
  hasFreeShipping,
  shippingCost,
} from "../lib/rewards"
import { colors, fonts, gradients } from "../lib/theme"
import { useOverlay } from "../lib/useOverlay"
import type { CartItem, Reward } from "../types"

export default function CartDrawer({
  cart,
  rewards,
  onClose,
  onRemove,
  onQty,
  total,
  onCheckout,
}: {
  cart: CartItem[]
  rewards: Reward[]
  onClose: () => void
  onRemove: (id: string) => void
  onQty: (id: string, qty: number) => void
  total: number
  onCheckout: () => void
}) {
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0)
  const discount = discountTotal(rewards)
  const freeShipping = hasFreeShipping(rewards)
  const shipping = shippingCost(total, rewards)
  const grandTotal = computeGrandTotal(total, rewards)
  const overlayRef = useOverlay(onClose)

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(10,6,4,0.55)" }}
        onClick={onClose}
      />
      <div
        ref={overlayRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        className="fixed right-0 top-0 h-full z-50 flex flex-col"
        style={{
          width: "min(420px, 100vw)",
          background: colors.cream,
          boxShadow: "-8px 0 40px rgba(0,0,0,0.18)",
        }}
      >
        {/* drawer top bar */}
        <div
          style={{
            background:
              gradients.goldBar,
            height: 3,
          }}
        />

        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(200,151,58,0.12)" }}
        >
          <div>
            <h2
              style={{
                fontFamily: fonts.serif,
                color: colors.ink,
                fontSize: "1.2rem",
              }}
            >
              Shopping Bag
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: colors.tan, fontFamily: fonts.sans }}
            >
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ color: colors.tan }}
            aria-label="Close shopping bag"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* applied rewards */}
        {rewards.length > 0 && (
          <div
            className="mx-4 mt-3 px-4 py-3 rounded-xl"
            style={{
              background: "rgba(109,186,90,0.08)",
              border: "1px solid rgba(109,186,90,0.25)",
            }}
          >
            <p
              className="text-xs font-semibold"
              style={{ color: colors.successDeep, fontFamily: fonts.sans }}
            >
              🎁 Rewards applied to this order
            </p>
            <div className="mt-2 space-y-1.5">
              {rewards.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2 text-xs"
                  style={{ color: colors.successInk, fontFamily: fonts.sans }}
                >
                  <span>{r.icon}</span>
                  <span>{r.label}</span>
                  {r.kind === "points" && r.value && (
                    <span className="ml-auto font-semibold">
                      +{r.value.toLocaleString()} pts
                    </span>
                  )}
                  {r.kind === "discount" && r.value && (
                    <span className="ml-auto font-semibold">
                      −{formatPrice(r.value)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* spin promo banner */}
        {rewards.length === 0 && total > 0 && total < SPIN_MIN && (
          <div
            className="mx-4 mt-3 px-4 py-3 rounded-xl text-xs"
            style={{
              background: gradients.promo,
              color: colors.gold,
              fontFamily: fonts.sans,
            }}
          >
            🎰 Spend{" "}
            <strong style={{ color: colors.goldLight }}>
              {formatPrice(SPIN_MIN - total)}
            </strong>{" "}
            more to unlock the <strong>Spin &amp; Win</strong> wheel!
          </div>
        )}
        {rewards.length === 0 && total >= SPIN_MIN && (
          <div
            className="mx-4 mt-3 px-4 py-3 rounded-xl text-xs"
            style={{
              background: gradients.promoSuccess,
              color: colors.success,
              fontFamily: fonts.sans,
            }}
          >
            🎉 You unlocked the <strong>Spin &amp; Win</strong> reward — spin at
            checkout!
          </div>
        )}

        {/* items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <img
                src={logoUrl}
                alt=""
                className="w-16 opacity-30 mb-4"
              />
              <p
                style={{
                  fontFamily: fonts.serif,
                  color: colors.ink,
                  fontSize: "1.1rem",
                }}
              >
                Your bag is empty
              </p>
              <p
                className="text-sm mt-1"
                style={{ color: colors.tan, fontFamily: fonts.sans }}
              >
                Add something beautiful
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-4 items-start">
                <div
                  className="rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                  style={{ width: 72, height: 72, background: colors.creamMuted }}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">💎</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium leading-tight"
                    style={{ color: colors.ink, fontFamily: fonts.sans }}
                  >
                    {item.name}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: colors.tan, fontFamily: fonts.sans }}
                  >
                    {item.category}
                  </p>
                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onQty(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-sm transition-colors hover:bg-stone-100"
                        style={{
                          border: `1px solid ${colors.line}`,
                          color: colors.brown,
                        }}
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        −
                      </button>
                      <span
                        className="text-sm"
                        style={{
                          fontFamily: fonts.sans,
                          color: colors.ink,
                          minWidth: 20,
                          textAlign: "center",
                        }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onQty(item.id, item.quantity + 1)}
                        disabled={
                          typeof item.stock === "number" &&
                          item.quantity >= item.stock
                        }
                        className="w-6 h-6 rounded-full flex items-center justify-center text-sm transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                          border: `1px solid ${colors.line}`,
                          color: colors.brown,
                        }}
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: colors.gold, fontFamily: fonts.sans }}
                    >
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(item.id)}
                  className="shrink-0 mt-0.5 transition-colors hover:text-red-400"
                  style={{ color: colors.lineSoft }}
                  aria-label={`Remove ${item.name} from bag`}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* footer totals */}
        {cart.length > 0 && (
          <div
            className="px-6 py-5"
            style={{ borderTop: "1px solid rgba(200,151,58,0.12)" }}
          >
            <div className="space-y-1.5 mb-3">
              <div
                className="flex justify-between text-sm"
                style={{ fontFamily: fonts.sans, color: colors.tan }}
              >
                <span>Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              {discount > 0 && (
                <div
                  className="flex justify-between text-sm"
                  style={{ fontFamily: fonts.sans, color: colors.success }}
                >
                  <span>Reward discount</span>
                  <span>−{formatPrice(discount)}</span>
                </div>
              )}
              <div
                className="flex justify-between text-sm"
                style={{ fontFamily: fonts.sans, color: colors.tan }}
              >
                <span>Shipping</span>
                <span style={{ color: shipping === 0 ? colors.success : colors.tan }}>
                  {freeShipping
                    ? "Free (reward)"
                    : shipping === 0
                      ? "Free"
                      : formatPrice(shipping)}
                </span>
              </div>
            </div>
            <div
              className="flex justify-between font-semibold pt-3"
              style={{
                fontFamily: fonts.sans,
                color: colors.ink,
                borderTop: "1px solid rgba(200,151,58,0.12)",
                fontSize: "1.05rem",
              }}
            >
              <span>Total</span>
              <span>{formatPrice(grandTotal)}</span>
            </div>
            <button
              onClick={onCheckout}
              className="mt-4 w-full py-4 rounded-full text-sm font-semibold transition-all hover:brightness-105"
              style={{
                background:
                  total >= SPIN_MIN
                    ? gradients.gold
                    : gradients.darkCta,
                color: total >= SPIN_MIN ? colors.ink : colors.gold,
                fontFamily: fonts.sans,
                letterSpacing: "0.08em",
                boxShadow:
                  total >= SPIN_MIN
                    ? "0 4px 24px rgba(200,151,58,0.4)"
                    : "0 4px 20px rgba(28,18,8,0.25)",
              }}
            >
              {rewards.length > 0
                ? "✅ Complete Order"
                : total >= SPIN_MIN
                  ? "🎰 Checkout & Spin to Win"
                  : "Proceed to Checkout →"}
            </button>
            <p
              className="text-xs text-center mt-2"
              style={{ color: colors.tanFaint, fontFamily: fonts.sans }}
            >
              🔒 Secure &amp; encrypted checkout
            </p>
          </div>
        )}
      </div>
    </>
  )
}