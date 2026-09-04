import { useEffect, useMemo, useRef, useState } from "react"
import logoUrl from "./assets/logo.png"
import AdminPanel from "./components/AdminPanel"
import CartDrawer from "./components/CartDrawer"
import CheckoutModal from "./components/CheckoutModal"
import GoldLogoMark from "./components/GoldLogoMark"
import OrderConfirmation from "./components/OrderConfirmation"
import ProductCard from "./components/ProductCard"
import SpinWheelModal from "./components/SpinWheelModal"
import WishlistDrawer from "./components/WishlistDrawer"
import { CATEGORIES, NAV_LINKS, PRODUCTS } from "./data"
import { applyLocalOverrides, useCatalog } from "./lib/catalog"
import { subscribeToNewsletter } from "./lib/checkout"
import {
  addCartItem,
  cartItemCount,
  cartSubtotal,
  removeCartItem,
  updateCartQuantity,
} from "./lib/cart"
import { filterAndSortProducts, type SortOption } from "./lib/filter"
import { FREE_SHIPPING_MIN, formatPrice, SPIN_MIN } from "./lib/currency"
import { colors, fonts, gradients } from "./lib/theme"
import { useUrlFilterState, type FilterState } from "./lib/urlState"
import {
  LS_KEYS,
  downscaleImage,
  fileToDataUrl,
  loadLS,
  saveLS,
} from "./lib/persistence"
import {
  addFreeItems,
  applyPrize,
  discountTotal,
  grandTotal,
  shippingCost,
  type Prize,
} from "./lib/rewards"
import type { CartItem, Order, Product, Reward } from "./types"

export default function App() {
  const [products, setProducts] = useState<Product[]>(() =>
    applyLocalOverrides(PRODUCTS),
  )
  const liveProducts = useCatalog()

  // Once the live Convex catalog arrives, make it the source of truth
  // (still re-applying any user photo/price overrides on top).
  useEffect(() => {
    if (liveProducts.length > 0) setProducts(applyLocalOverrides(liveProducts))
  }, [liveProducts])
  const [filters, setFilters] = useUrlFilterState()
  const { category: activeCategory, search, sort: sortBy } = filters
  const updateFilters = (patch: Partial<FilterState>) =>
    setFilters((prev) => ({ ...prev, ...patch }))

  const [cart, setCart] = useState<CartItem[]>(() =>
    loadLS<CartItem[]>(LS_KEYS.cart, []),
  )
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [spinOpen, setSpinOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  // Normalise legacy numeric ids to strings on load.
  const [wishlist, setWishlist] = useState<string[]>(() =>
    loadLS<string[]>(LS_KEYS.wishlist, []).map((x) => String(x)),
  )
  const [newsletterEmail, setNewsletterEmail] = useState("")
  const [rewards, setRewards] = useState<Reward[]>(() =>
    loadLS<Reward[]>(LS_KEYS.rewards, []),
  )
  const [order, setOrder] = useState<Order | null>(null)
  const [wishlistOpen, setWishlistOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [hash, setHash] = useState(() => window.location.hash)

  // Hash routing: #/admin shows the client admin panel.
  useEffect(() => {
    const onChange = () => {
      setHash(window.location.hash)
      if (window.location.hash.startsWith("#/admin")) window.scrollTo(0, 0)
    }
    window.addEventListener("hashchange", onChange)
    return () => window.removeEventListener("hashchange", onChange)
  }, [])

  useEffect(() => {
    document.title = "Asthetic Accessory"
  }, [])

  useEffect(() => {
    saveLS(LS_KEYS.cart, cart)
  }, [cart])

  useEffect(() => {
    saveLS(LS_KEYS.rewards, rewards)
  }, [rewards])

  useEffect(() => {
    saveLS(LS_KEYS.wishlist, wishlist)
  }, [wishlist])

  useEffect(() => {
    // Persist uploaded photos and any prices edited away from the catalog
    // default, so both survive a refresh.
    const images: Record<string, string> = {}
    const priceOverrides: Record<string, number> = {}
    const basePrices = new Map(PRODUCTS.map((p) => [p.id, p.price]))
    for (const p of products) {
      if (p.image) images[p.id] = p.image
      if (p.price !== basePrices.get(p.id)) priceOverrides[p.id] = p.price
    }
    saveLS(LS_KEYS.productImages, images)
    saveLS(LS_KEYS.productPrices, priceOverrides)
  }, [products])

  const cartCount = cartItemCount(cart)
  const cartTotal = cartSubtotal(cart)
  const wishlistProducts = useMemo(
    () => products.filter((p) => wishlist.includes(p.id)),
    [products, wishlist],
  )

  const filtered = useMemo(
    () => filterAndSortProducts(products, activeCategory, search, sortBy),
    [products, activeCategory, search, sortBy],
  )

  const toggleWishlist = (id: string) =>
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )

  const showToast = (msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2800)
  }

  // Clear any pending toast timer on unmount.
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  const addToCart = (product: Product) => {
    setCart((prev) => addCartItem(prev, product))
    showToast(`"${product.name}" added to bag`)
  }

  const removeFromCart = (id: string) =>
    setCart((prev) => removeCartItem(prev, id))

  const updateQty = (id: string, qty: number) =>
    setCart((prev) => updateCartQuantity(prev, id, qty))

  const handleImageUpload = async (id: string, file: File) => {
    try {
      const dataUrl = await downscaleImage(await fileToDataUrl(file))
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, image: dataUrl } : p)),
      )
      showToast("📷 Photo added")
    } catch {
      showToast("Couldn't load that image")
    }
  }

  const handlePriceChange = (id: string, price: number) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, price } : p)))
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, price } : i)))
    showToast("Price updated")
  }

  const handleSpinWin = (prize: Prize) => {
    const { rewards: newRewards, freeItems } = applyPrize(prize, cartTotal)
    setCart((prev) => addFreeItems(prev, freeItems, products))
    setRewards((prev) => [...prev, ...newRewards])
    showToast(`🎉 You won: ${prize.label}!`)
  }

  const handleCheckout = () => {
    if (cartTotal >= SPIN_MIN && rewards.length === 0) {
      setCartOpen(false)
      setSpinOpen(true)
    } else {
      setCartOpen(false)
      setCheckoutOpen(true)
    }
  }

  const handleOrderPlaced = (placed: Order) => {
    setOrder(placed)
    setCart([])
    setRewards([])
    setCartOpen(false)
    setCheckoutOpen(false)
  }

  if (hash.startsWith("#/admin")) return <AdminPanel />

  return (
    <div
      className="min-h-full"
      style={{ background: colors.cream, fontFamily: fonts.body }}
    >
      {/* ambient bg glows */}
      <div
        className="fixed top-0 right-0 pointer-events-none"
        style={{
          width: 600,
          height: 600,
          background:
            "radial-gradient(ellipse at top right, rgba(200,151,58,0.05) 0%, transparent 65%)",
        }}
      />
      <div
        className="fixed bottom-0 left-0 pointer-events-none"
        style={{
          width: 500,
          height: 500,
          background:
            "radial-gradient(ellipse at bottom left, rgba(200,151,58,0.04) 0%, transparent 65%)",
        }}
      />

      {/* toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-50 px-6 py-3 rounded-full text-sm shadow-2xl"
          style={{
            transform: "translateX(-50%)",
            background: colors.ink,
            color: colors.gold,
            fontFamily: fonts.sans,
            letterSpacing: "0.03em",
            boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
            maxWidth: "min(90vw, 480px)",
            textAlign: "center",
          }}
        >
          {toast}
        </div>
      )}

      {spinOpen && (
        <SpinWheelModal onClose={() => setSpinOpen(false)} onWin={handleSpinWin} />
      )}

      {order && (
        <OrderConfirmation order={order} onClose={() => setOrder(null)} />
      )}

      {wishlistOpen && (
        <WishlistDrawer
          items={wishlistProducts}
          onClose={() => setWishlistOpen(false)}
          onRemove={toggleWishlist}
          onAddToCart={addToCart}
          onAddAll={() => {
            for (const p of wishlistProducts) setCart((prev) => addCartItem(prev, p))
            showToast(`🛍️ ${wishlistProducts.length} item${wishlistProducts.length !== 1 ? "s" : ""} added to bag`)
          }}
        />
      )}

      {cartOpen && (
        <CartDrawer
          cart={cart}
          rewards={rewards}
          onClose={() => setCartOpen(false)}
          onRemove={removeFromCart}
          onQty={updateQty}
          total={cartTotal}
          onCheckout={handleCheckout}
        />
      )}

      {checkoutOpen && cart.length > 0 && (
        <CheckoutModal
          items={cart}
          rewards={rewards}
          subtotal={cartTotal}
          discount={discountTotal(rewards)}
          shipping={shippingCost(cartTotal, rewards)}
          total={grandTotal(cartTotal, rewards)}
          onClose={() => setCheckoutOpen(false)}
          onComplete={handleOrderPlaced}
        />
      )}

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-30 backdrop-blur-md"
        style={{
          background: "rgba(250,248,244,0.93)",
          borderBottom: "1px solid rgba(200,151,58,0.12)",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* logo */}
            <div className="flex items-center gap-2.5">
              <img
                src={logoUrl}
                alt="Asthetic Accessory"
                className="h-9 w-auto shrink-0"
              />
              <div>
                <h1
                  style={{
                    fontFamily: fonts.serif,
                    fontSize: "1.2rem",
                    color: colors.ink,
                    letterSpacing: "0.01em",
                    lineHeight: 1,
                  }}
                >
                  Asthetic Accessory
                </h1>
                <p
                  className="hidden sm:block text-xs mt-0.5"
                  style={{
                    color: colors.tanFaint,
                    letterSpacing: "0.14em",
                    fontWeight: 300,
                  }}
                >
                  CURATED FINE JEWELLERY
                </p>
              </div>
            </div>

            {/* nav */}
            <nav className="hidden lg:flex items-center gap-7">
              {NAV_LINKS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-sm transition-colors"
                  style={{
                    color: colors.brown,
                    letterSpacing: "0.02em",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = colors.ink)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = colors.brown)
                  }
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* icons */}
            <div className="flex items-center gap-1">
              <button
                className="lg:hidden p-2.5 rounded-full transition-colors hover:bg-stone-100"
                style={{ color: colors.tan }}
                title={mobileNavOpen ? "Close menu" : "Open menu"}
                aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileNavOpen}
                onClick={() => setMobileNavOpen((v) => !v)}
              >
                {mobileNavOpen ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                )}
              </button>
              <button
                className="p-2.5 rounded-full transition-colors hover:bg-stone-100"
                style={{ color: colors.tan }}
                title="Search"
                aria-label="Search"
                onClick={() => {
                  setMobileNavOpen(false)
                  searchRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  })
                  searchRef.current?.focus()
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
              <button
                className="relative p-2.5 rounded-full transition-colors hover:bg-stone-100"
                style={{ color: colors.tan }}
                title="Wishlist"
                aria-label="Open wishlist"
                onClick={() => setWishlistOpen(true)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {wishlist.length > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 rounded-full flex items-center justify-center text-white font-bold"
                    style={{
                      background: colors.gold,
                      width: 18,
                      height: 18,
                      fontSize: "0.6rem",
                    }}
                  >
                    {wishlist.length}
                  </span>
                )}
              </button>
              <button
                className="relative p-2.5 rounded-full transition-colors hover:bg-stone-100"
                style={{ color: colors.tan }}
                aria-label="Open cart"
                onClick={() => setCartOpen(true)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                {cartCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 rounded-full flex items-center justify-center text-white font-bold"
                    style={{
                      background: colors.gold,
                      width: 18,
                      height: 18,
                      fontSize: "0.6rem",
                    }}
                  >
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* mobile nav */}
        {mobileNavOpen && (
          <div
            className="lg:hidden border-t"
            style={{
              borderColor: "rgba(200,151,58,0.12)",
              background: "rgba(250,248,244,0.98)",
            }}
          >
            <nav className="max-w-7xl mx-auto px-5 py-2 flex flex-col">
              {NAV_LINKS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className="py-3 text-sm border-b last:border-0"
                  style={{
                    color: colors.brown,
                    fontFamily: fonts.sans,
                    letterSpacing: "0.02em",
                    textDecoration: "none",
                    borderColor: "rgba(200,151,58,0.08)",
                  }}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            gradients.hero,
          minHeight: 400,
        }}
      >
        {/* decorative diamond pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 4L76 40L40 76L4 40z' fill='none' stroke='%23C8973A' stroke-width='1'/%3E%3C/svg%3E\")",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 70% at 15% 50%, rgba(200,151,58,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 70% at 85% 50%, rgba(240,192,96,0.06) 0%, transparent 60%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 py-20 flex flex-col items-center text-center">
          <GoldLogoMark size={52} className="mb-6" />
          <p
            className="text-xs uppercase mb-4"
            style={{
              color: colors.gold,
              fontFamily: fonts.sans,
              fontWeight: 700,
              letterSpacing: "0.25em",
            }}
          >
            ✦ &nbsp;New Season 2026&nbsp; ✦
          </p>
          <h2
            style={{
              fontFamily: fonts.serif,
              fontSize: "clamp(2rem, 5vw, 3.8rem)",
              color: colors.cream,
              lineHeight: 1.1,
              maxWidth: 680,
            }}
          >
            Jewellery That Tells{" "}
            <em style={{ color: colors.gold, fontStyle: "italic" }}>
              Your Story
            </em>
          </h2>
          <p
            className="mt-4 max-w-lg leading-relaxed"
            style={{ color: colors.brownMid, fontSize: "1rem", fontWeight: 300 }}
          >
            Handcrafted pieces. Thoughtfully designed. Each accessory a quiet
            statement of who you are.
          </p>
          <div className="flex flex-wrap gap-4 mt-8 justify-center">
            <a
              href="#products"
              className="px-8 py-3.5 rounded-full text-sm font-semibold transition-all hover:brightness-110"
              style={{
                background: gradients.gold,
                color: colors.ink,
                fontFamily: fonts.sans,
                letterSpacing: "0.07em",
                boxShadow: "0 4px 24px rgba(200,151,58,0.4)",
                textDecoration: "none",
              }}
            >
              Shop Collection
            </a>
            <a
              href="#about"
              className="px-8 py-3.5 rounded-full text-sm font-medium transition-all hover:bg-white/5"
              style={{
                border: "1px solid rgba(200,151,58,0.4)",
                color: colors.gold,
                fontFamily: fonts.sans,
                letterSpacing: "0.07em",
                textDecoration: "none",
              }}
            >
              Our Story
            </a>
          </div>
          {/* spin teaser */}
          <div
            className="mt-9 flex items-center gap-3 px-5 py-2.5 rounded-full"
            style={{
              background: "rgba(200,151,58,0.08)",
              border: "1px solid rgba(200,151,58,0.18)",
            }}
          >
            <span className="text-lg">🎰</span>
            <p
              className="text-xs"
              style={{ color: colors.gold, fontFamily: fonts.sans }}
            >
              Orders over <strong style={{ color: colors.goldLight }}>{formatPrice(SPIN_MIN)}</strong>{" "}
              unlock the <strong>Spin &amp; Win</strong> wheel for exclusive
              gifts!
            </p>
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <div
        style={{
          background: "white",
          borderBottom: "1px solid rgba(200,151,58,0.1)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap gap-5 justify-center">
          {[
            { icon: "🚚", text: `Free shipping on orders over ${formatPrice(FREE_SHIPPING_MIN)}` },
            { icon: "↩️", text: "Easy 30-day returns" },
            { icon: "🔒", text: "100% secure checkout" },
            { icon: "💎", text: "Certified authentic pieces" },
          ].map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-2 text-xs"
              style={{ color: colors.tan, fontFamily: fonts.sans }}
            >
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Category filter ── */}
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-5">
        <div className="flex gap-2.5 flex-wrap justify-center">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              aria-pressed={activeCategory === cat}
              onClick={() => updateFilters({ category: cat })}
              className="px-5 py-2 rounded-full text-sm transition-all duration-200"
              style={{
                fontFamily: fonts.sans,
                fontWeight: activeCategory === cat ? 600 : 400,
                letterSpacing: "0.04em",
                background: activeCategory === cat ? colors.ink : "white",
                color: activeCategory === cat ? colors.gold : colors.tan,
                boxShadow:
                  activeCategory === cat
                    ? "0 4px 16px rgba(28,18,8,0.2)"
                    : "0 1px 4px rgba(0,0,0,0.06)",
                border:
                  activeCategory === cat
                    ? "1px solid transparent"
                    : "1px solid rgba(200,151,58,0.13)",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid header ── */}
      <div className="max-w-7xl mx-auto px-6 mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3
            style={{
              fontFamily: fonts.serif,
              color: colors.ink,
              fontSize: "1.25rem",
            }}
          >
            {activeCategory === "All" ? "All Pieces" : activeCategory}
          </h3>
          <p
            className="text-xs mt-0.5"
            style={{ color: colors.tanFaint, fontFamily: fonts.sans }}
          >
            {filtered.length} item{filtered.length !== 1 ? "s" : ""}
            {search.trim() !== "" && <> matching “{search.trim()}”</>}
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <div
            className="flex items-center gap-2 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-gold/60"
            style={{
              border: "1px solid rgba(200,151,58,0.18)",
              background: "white",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke={colors.tanFaint}
              strokeWidth="1.8"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              placeholder="Search pieces…"
            aria-label="Search products"
            className="text-xs outline-none w-36 md:w-44"
              style={{
                color: colors.ink,
                fontFamily: fonts.sans,
                background: "transparent",
              }}
            />
            {search !== "" && (
              <button
                onClick={() => updateFilters({ search: "" })}
                className="text-xs"
                style={{ color: colors.tanFaint }}
                title="Clear search"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <select
            value={sortBy}
            onChange={(e) => updateFilters({ sort: e.target.value as SortOption })}
            className="text-xs rounded-full px-4 py-2 outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            aria-label="Sort products"
            style={{
              border: "1px solid rgba(200,151,58,0.18)",
              color: colors.brown,
              fontFamily: fonts.sans,
              background: "white",
            }}
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      {/* ── Product grid ── */}
      <main id="products" className="max-w-7xl mx-auto px-6 pb-24 scroll-mt-24">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              liked={wishlist.includes(product.id)}
              onToggleWishlist={toggleWishlist}
              onImageUpload={handleImageUpload}
              onPriceChange={handlePriceChange}
              onAddToCart={addToCart}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="py-24 text-center">
            <p
              style={{
                fontFamily: fonts.serif,
                color: colors.gold,
                fontSize: "1.2rem",
              }}
            >
              {search.trim() !== ""
                ? `No pieces match “${search.trim()}”.`
                : "No items in this category yet."}
            </p>
          </div>
        )}
      </main>

      {/* ── Newsletter ── */}
      <section
        id="newsletter"
        className="py-16 px-6 scroll-mt-24"
        style={{
          background: gradients.dark,
        }}
      >
        <div className="max-w-xl mx-auto text-center">
          <GoldLogoMark size={44} className="mb-5" />
          <p
            className="text-xs uppercase mb-3"
            style={{
              color: colors.gold,
              fontFamily: fonts.sans,
              fontWeight: 700,
              letterSpacing: "0.22em",
            }}
          >
            Join the Inner Circle
          </p>
          <h3
            style={{
              fontFamily: fonts.serif,
              color: colors.cream,
              fontSize: "1.9rem",
            }}
          >
            Early Access &amp; Exclusive Offers
          </h3>
          <p
            className="mt-2 text-sm"
            style={{ color: colors.brownMid, fontFamily: fonts.sans, fontWeight: 300 }}
          >
            Be first to know about new arrivals, private sales, and style
            inspiration.
          </p>
          <form
            className="mt-6 flex flex-wrap gap-2 max-w-sm mx-auto"
            onSubmit={(e) => {
              e.preventDefault()
              const email = newsletterEmail.trim()
              if (!email) {
                showToast("Please enter your email address")
                return
              }
              // Record the signup in Convex when the backend is configured;
              // otherwise keep the local-only behavior (demo catalog mode).
              if (!import.meta.env.VITE_CONVEX_URL) {
                showToast("💌 Thanks for subscribing!")
                setNewsletterEmail("")
                return
              }
              subscribeToNewsletter(email)
                .then((status) => {
                  if (status === "already") {
                    showToast("You're already on the list — welcome back! 💌")
                  } else {
                    showToast("💌 Thanks for subscribing!")
                  }
                  setNewsletterEmail("")
                })
                .catch(() => {
                  showToast("Couldn't subscribe right now — try again in a moment")
                })
            }}
          >
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="your@email.com"
              aria-label="Email address for newsletter"
              className="flex-1 px-4 py-3 rounded-full text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
              style={{
                background: "rgba(200,151,58,0.08)",
                border: "1px solid rgba(200,151,58,0.2)",
                color: colors.cream,
                fontFamily: fonts.sans,
              }}
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-full text-sm font-semibold whitespace-nowrap transition-all hover:brightness-110"
              style={{
                background: gradients.gold,
                color: colors.ink,
                fontFamily: fonts.sans,
              }}
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        id="about"
        style={{
          background: colors.inkDarkest,
          borderTop: "1px solid rgba(200,151,58,0.08)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="rounded-lg shrink-0 overflow-hidden"
                  style={{
                    background: gradients.gold,
                    padding: 4,
                  }}
                >
                  <img src={logoUrl} alt="" className="h-5 w-auto block" />
                </div>
                <span
                  style={{
                    fontFamily: fonts.serif,
                    color: colors.gold,
                    fontSize: "0.95rem",
                  }}
                >
                  Asthetic Accessory
                </span>
              </div>
              <p
                className="text-xs leading-relaxed"
                style={{
                  color: colors.footerMuted,
                  maxWidth: 200,
                  fontFamily: fonts.sans,
                  fontWeight: 300,
                }}
              >
                Curated fine jewellery for the thoughtful collector.
              </p>
              <div className="flex gap-3 mt-4">
                {[
                  { code: "IG", name: "Instagram" },
                  { code: "PT", name: "Pinterest" },
                  { code: "TK", name: "TikTok" },
                  { code: "YT", name: "YouTube" },
                ].map((s) => (
                  <button
                    key={s.code}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer transition-colors"
                    style={{
                      border: "1px solid rgba(200,151,58,0.2)",
                      color: colors.footerFaint,
                      fontFamily: fonts.sans,
                      fontWeight: 700,
                    }}
                    aria-label={`${s.name} (coming soon)`}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = colors.gold)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = colors.footerFaint)
                    }
                  >
                    {s.code}
                  </button>
                ))}
              </div>
            </div>
            {[
              {
                title: "Shop",
                links: [
                  "All Pieces",
                  "Necklaces",
                  "Rings",
                  "Earrings",
                  "Bracelets",
                ],
              },
              {
                title: "Company",
                links: ["About Us", "Sustainability", "Careers", "Press"],
              },
              {
                title: "Support",
                links: ["FAQ", "Shipping Info", "Returns", "Contact Us"],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4
                  className="text-xs uppercase mb-4 font-semibold"
                  style={{
                    color: colors.gold,
                    fontFamily: fonts.sans,
                    letterSpacing: "0.16em",
                  }}
                >
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href={
                          col.title === "Shop"
                            ? "#products"
                            : link === "About Us" || link === "Contact Us"
                              ? "#about"
                              : "#"
                        }
                        onClick={
                          col.title === "Shop"
                            ? () =>
                                updateFilters({
                                  category: link === "All Pieces" ? "All" : link,
                                })
                            : undefined
                        }
                        className="text-xs transition-colors"
                        style={{ color: colors.footerMuted, fontFamily: fonts.sans }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = colors.gold)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = colors.footerMuted)
                        }
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div
            className="mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs"              style={{
                borderTop: "1px solid rgba(200,151,58,0.07)",
                color: colors.footerMuted,
                fontFamily: fonts.sans,
              }}
          >
            <p>© 2026 Asthetic Accessory. All rights reserved.</p>
            <div className="flex gap-5 flex-wrap">
              {["Privacy Policy", "Terms of Use", "Cookie Settings"].map(
                (l) => (
                  <a
                    key={l}
                    href="#"
                    className="transition-colors"
                    style={{ color: colors.footerMuted }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = colors.gold)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = colors.footerMuted)
                    }
                  >
                    {l}
                  </a>
                ),
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}