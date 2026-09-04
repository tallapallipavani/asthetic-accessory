import { useEffect, useRef, useState } from "react"
import { formatPrice } from "../lib/currency"
import { colors, fonts, gradients } from "../lib/theme"
import { isOutOfStock, type Product } from "../types"

export default function ProductCard({
  product,
  liked,
  onToggleWishlist,
  onImageUpload,
  onPriceChange,
  onAddToCart,
}: {
  product: Product
  liked: boolean
  onToggleWishlist: (id: string) => void
  onImageUpload: (id: string, file: File) => void
  onPriceChange: (id: string, price: number) => void
  onAddToCart: (p: Product) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [editingPrice, setEditingPrice] = useState(false)
  const [priceInput, setPriceInput] = useState(String(product.price))
  const [added, setAdded] = useState(false)
  const [imgError, setImgError] = useState(false)

  useEffect(() => setImgError(false), [product.image])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    onImageUpload(product.id, file)
    e.target.value = ""
  }

  const confirmPrice = () => {
    const n = parseFloat(priceInput)
    if (!isNaN(n) && n > 0) onPriceChange(product.id, Math.round(n * 100) / 100)
    else setPriceInput(String(product.price))
    setEditingPrice(false)
  }

  const outOfStock = isOutOfStock(product)

  const handleAdd = () => {
    onAddToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  const tagStyle =
    product.tag === "Premium"
      ? {
          background: gradients.gold,
          color: colors.ink,
        }
      : product.tag === "New"
        ? { background: colors.ink, color: colors.gold }
        : { background: "rgba(200,151,58,0.14)", color: colors.gold }

  return (
    <div
      className="group relative bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        boxShadow: "0 2px 16px rgba(28,18,8,0.06)",
        border: "1px solid rgba(200,151,58,0.09)",
      }}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {product.tag && !outOfStock && (
        <div
          className="absolute top-3 left-3 z-10 text-xs px-2.5 py-1 rounded-full font-semibold"
          style={{ ...tagStyle, fontFamily: fonts.sans, letterSpacing: "0.04em" }}
        >
          {product.tag}
        </div>
      )}

      {outOfStock && (
        <div
          className="absolute top-3 left-3 z-10 text-xs px-2.5 py-1 rounded-full font-semibold"
          style={{
            background: "rgba(179,38,30,0.92)",
            color: "#fff",
            fontFamily: fonts.sans,
            letterSpacing: "0.05em",
          }}
        >
          Sold Out
        </div>
      )}

      {/* wishlist */}
      <button
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
        style={{
          background: "rgba(250,248,244,0.92)",
          backdropFilter: "blur(4px)",
        }}
        onClick={() => onToggleWishlist(product.id)}
        aria-label={
          liked
            ? `Remove ${product.name} from wishlist`
            : `Add ${product.name} to wishlist`
        }
        aria-pressed={liked}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={liked ? colors.gold : "none"}
          stroke={liked ? colors.gold : colors.tan}
          strokeWidth="2"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>

      {/* image area */}
      <div
        className="relative aspect-square overflow-hidden cursor-pointer"
        style={{ background: colors.creamWarm }}
        onClick={() => (!product.image || imgError) && fileRef.current?.click()}
        role={!product.image || imgError ? "button" : undefined}
        tabIndex={!product.image || imgError ? 0 : undefined}
        aria-label={
          !product.image || imgError ? `Add photo for ${product.name}` : undefined
        }
        onKeyDown={
          !product.image || imgError
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  fileRef.current?.click()
                }
              }
            : undefined
        }
      >
        {product.image && !imgError ? (
          <>
            <img
              src={product.image}
              alt={product.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              style={outOfStock ? { filter: "grayscale(0.7) opacity(0.55)" } : undefined}
            />
            <button
              className="absolute bottom-3 right-3 text-xs px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity font-medium"
              style={{
                background: "rgba(250,248,244,0.92)",
                color: colors.ink,
                fontFamily: fonts.sans,
                backdropFilter: "blur(4px)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              }}
              onClick={(e) => {
                e.stopPropagation()
                fileRef.current?.click()
              }}
            >
              Change Photo
            </button>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2.5 transition-colors group-hover:bg-stone-100/40">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(200,151,58,0.1)",
                border: "1px dashed rgba(200,151,58,0.4)",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={colors.gold}
                strokeWidth="1.6"
              >
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: colors.gold, fontFamily: fonts.sans, fontWeight: 600 }}
            >
              Add Photo
            </span>
          </div>
        )}
      </div>

      {/* card body */}
      <div className="p-4">
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: colors.tanFaint, fontFamily: fonts.sans, fontWeight: 400 }}
        >
          {product.category}
        </span>
        <h3
          className="mt-1 leading-snug"
          style={{
            fontFamily: fonts.serif,
            fontSize: "0.93rem",
            color: colors.ink,
          }}
        >
          {product.name}
        </h3>

        <div className="mt-3 flex items-center justify-between gap-2">
          {/* editable price */}
          {editingPrice ? (
            <div className="flex items-center gap-1">
              <span
                style={{
                  color: colors.tan,
                  fontFamily: fonts.sans,
                  fontSize: "0.85rem",
                }}
              >
                ₹
              </span>
              <input
                autoFocus
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                onBlur={confirmPrice}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmPrice()
                  if (e.key === "Escape") {
                    setPriceInput(String(product.price))
                    setEditingPrice(false)
                  }
                }}
                className="w-16 text-sm outline-none rounded-lg border px-2 py-1 focus-visible:ring-2 focus-visible:ring-gold/60"
                style={{
                  borderColor: colors.gold,
                  fontFamily: fonts.sans,
                  color: colors.ink,
                  background: colors.cream,
                  boxShadow: "0 0 0 3px rgba(200,151,58,0.12)",
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span
                className="font-semibold"
                style={{
                  color: colors.ink,
                  fontFamily: fonts.sans,
                  fontSize: "0.95rem",
                }}
              >
                {formatPrice(product.price)}
              </span>
              <button
                onClick={() => {
                  setPriceInput(String(product.price))
                  setEditingPrice(true)
                }}
                className="opacity-30 hover:opacity-100 transition-opacity"
                title="Edit price"
                aria-label={`Edit price of ${product.name}`}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={colors.gold}
                  strokeWidth="2.2"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>
          )}

          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className="text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap disabled:cursor-not-allowed"
            style={{
              background: added
                ? "rgba(109,186,90,0.15)"
                : outOfStock
                  ? "rgba(180,160,140,0.25)"
                  : gradients.darkCta,
              color: added ? colors.success : outOfStock ? colors.tanFaint : colors.gold,
              fontFamily: fonts.sans,
              letterSpacing: "0.03em",
              border: added
                ? "1px solid rgba(109,186,90,0.3)"
                : "1px solid transparent",
            }}
          >
            {added ? "✓ Added" : outOfStock ? "Sold Out" : "+ Bag"}
          </button>
        </div>
      </div>
    </div>
  )
}