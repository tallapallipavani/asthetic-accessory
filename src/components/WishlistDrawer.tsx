import logoUrl from "../assets/logo.png"
import { formatPrice } from "../lib/currency"
import { colors, fonts, gradients } from "../lib/theme"
import { useOverlay } from "../lib/useOverlay"
import { isOutOfStock, type Product } from "../types"

export default function WishlistDrawer({
  items,
  onClose,
  onRemove,
  onAddToCart,
  onAddAll,
}: {
  items: Product[]
  onClose: () => void
  onRemove: (id: string) => void
  onAddToCart: (p: Product) => void
  onAddAll: () => void
}) {
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
        aria-label="Wishlist"
        className="fixed right-0 top-0 h-full z-50 flex flex-col"
        style={{
          width: "min(420px, 100vw)",
          background: colors.cream,
          boxShadow: "-8px 0 40px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ background: gradients.goldBar, height: 3 }} />

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
              Wishlist
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: colors.tan, fontFamily: fonts.sans }}
            >
              {items.length} item{items.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button onClick={onClose} style={{ color: colors.tan }} aria-label="Close wishlist">
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

        {/* items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <img src={logoUrl} alt="" className="w-16 opacity-30 mb-4" />
              <p
                style={{
                  fontFamily: fonts.serif,
                  color: colors.ink,
                  fontSize: "1.1rem",
                }}
              >
                Your wishlist is empty
              </p>
              <p
                className="text-sm mt-1"
                style={{ color: colors.tan, fontFamily: fonts.sans }}
              >
                Tap the ♥ on any piece to save it here
              </p>
            </div>
          ) : (
            items.map((p) => (
              <div key={p.id} className="flex gap-4 items-start">
                <div
                  className="rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                  style={{ width: 72, height: 72, background: colors.creamWarm }}
                >
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
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
                    {p.name}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: colors.tan, fontFamily: fonts.sans }}
                  >
                    {p.category}
                  </p>
                  <p
                    className="text-sm font-semibold mt-2.5"
                    style={{ color: colors.gold, fontFamily: fonts.sans }}
                  >
                    {formatPrice(p.price)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    onClick={() => onRemove(p.id)}
                    className="transition-opacity hover:opacity-60"
                    style={{ color: colors.gold }}
                    title="Remove from wishlist"
                    aria-label={`Remove ${p.name} from wishlist`}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onAddToCart(p)}
                    disabled={isOutOfStock(p)}
                    className="text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap disabled:cursor-not-allowed"
                    style={{
                      background: isOutOfStock(p)
                        ? "rgba(180,160,140,0.25)"
                        : gradients.gold,
                      color: isOutOfStock(p) ? colors.tanFaint : colors.ink,
                      fontFamily: fonts.sans,
                      letterSpacing: "0.03em",
                    }}
                  >
                    {isOutOfStock(p) ? "Sold Out" : "+ Bag"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* footer */}
        {items.length > 0 && (
          <div
            className="px-6 py-5"
            style={{ borderTop: "1px solid rgba(200,151,58,0.12)" }}
          >
            <button
              onClick={onAddAll}
              className="w-full py-3.5 rounded-full text-sm font-semibold transition-all hover:brightness-105"
              style={{
                background: gradients.gold,
                color: colors.ink,
                fontFamily: fonts.sans,
                letterSpacing: "0.08em",
                boxShadow: "0 4px 20px rgba(200,151,58,0.35)",
              }}
            >
              🛍️ Add All to Bag
            </button>
          </div>
        )}
      </div>
    </>
  )
}