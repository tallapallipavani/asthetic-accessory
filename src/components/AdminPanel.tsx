import { useEffect, useState } from "react"
import { CATEGORIES } from "../data"
import {
  ADMIN_SESSION_KEY,
  adminLogin,
  deleteProduct,
  listAllProducts,
  listOrders,
  saveProduct,
  updateOrderStatus,
  uploadProductPhoto,
} from "../lib/adminApi"
import type { AdminProductInput } from "../lib/adminApi"
import { formatPrice } from "../lib/currency"
import { colors, fonts, gradients } from "../lib/theme"
import GoldLogoMark from "./GoldLogoMark"

interface AdminProduct {
  _id: string
  name: string
  price: number
  sku?: string
  stock?: number
  category: string
  tag?: string
  description?: string
  imageUrl?: string
  imageStorageId?: string
  image: string | null
  active: boolean
  createdAt: number
}

interface OrderRow {
  _id: string
  number: string
  customer: { name: string; email: string; phone?: string; address?: string }
  items: { name: string; price: number; quantity: number }[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  status: string
  paymentMethod?: string
  paymentId?: string
  razorpayOrderId?: string
  createdAt: number
}

const TAGS = ["", "New", "Bestseller", "Premium"]

/** Next step for each status along the fulfillment flow. */
const ORDER_FLOW: { from: string; to: string; label: string }[] = [
  { from: "paid", to: "processing", label: "Start processing" },
  { from: "processing", to: "shipped", label: "Mark shipped" },
  { from: "shipped", to: "delivered", label: "Mark delivered" },
]

/**
 * Payment facts for the admin order card.
 * - Demo orders: friendly method stored in `paymentMethod`; the payment id
 *   is a synthetic "demo:<channel>:<ts>" id, so there's no real gateway ref.
 * - Real (Razorpay) orders: `razorpayOrderId` ("rzp_...") is the gateway
 *   reference and `paymentId` is the captured payment's transaction id.
 */
function paymentInfo(order: OrderRow): {
  method: string
  isDemo: boolean
  reference: string | null
} {
  const isDemo = (order.paymentId ?? "").startsWith("demo:")
  const method = order.paymentMethod ?? (isDemo ? "UPI (demo)" : "Online payment")
  const reference = order.razorpayOrderId ?? order.paymentId ?? null
  return { method, isDemo, reference }
}

export default function AdminPanel() {
  const [password, setPassword] = useState(
    () => sessionStorage.getItem(ADMIN_SESSION_KEY) ?? "",
  )
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(!!sessionStorage.getItem(ADMIN_SESSION_KEY))
  const [error, setError] = useState("")
  const [view, setView] = useState<"products" | "orders">("products")
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [busyOrder, setBusyOrder] = useState<string | null>(null)
  const [editor, setEditor] = useState<AdminProduct | "new" | null>(null)
  const [saving, setSaving] = useState(false)

  const refreshProducts = async () => {
    const list = await listAllProducts(password)
    setProducts(list as AdminProduct[])
  }

  const refreshOrders = async () => {
    const list = await listOrders(password)
    setOrders(list as OrderRow[])
  }

  const changeStatus = async (o: OrderRow, next: string) => {
    setBusyOrder(o._id)
    try {
      await updateOrderStatus(password, o._id, next)
      await refreshOrders()
    } catch {
      /* keep the current status; a refresh will resync */
    } finally {
      setBusyOrder(null)
    }
  }

  // Silent re-auth when a session already exists in sessionStorage.
  useEffect(() => {
    if (!password) return
    let cancelled = false
    refreshProducts()
      .then(() => {
        if (!cancelled) {
          setAuthed(true)
          setChecking(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          sessionStorage.removeItem(ADMIN_SESSION_KEY)
          setPassword("")
          setAuthed(false)
          setChecking(false)
        }
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      const ok = await adminLogin(password)
      if (!ok) {
        setError("Incorrect password — try again.")
        return
      }
      sessionStorage.setItem(ADMIN_SESSION_KEY, password)
      setAuthed(true)
      await refreshProducts()
    } catch {
      setError("Could not reach the backend. Is Convex configured?")
    }
  }

  const logout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY)
    setAuthed(false)
    setPassword("")
    setProducts([])
  }

  const openTab = async (tab: "products" | "orders") => {
    setView(tab)
    try {
      if (tab === "products") await refreshProducts()
      else await refreshOrders()
    } catch {
      /* session likely expired — handled on next action */
    }
  }

  const handleSave = async (input: AdminProductInput) => {
    setSaving(true)
    try {
      await saveProduct(password, input)
      setEditor(null)
      await refreshProducts()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (p: AdminProduct) => {
    if (!window.confirm(`Delete "${p.name}" permanently?`)) return
    await deleteProduct(password, p._id)
    await refreshProducts()
  }

  const toggleActive = async (p: AdminProduct) => {
    await saveProduct(password, {
      id: p._id,
      name: p.name,
      price: p.price,
      sku: p.sku,
      stock: p.stock,
      category: p.category,
      tag: p.tag,
      description: p.description,
      imageUrl: p.imageUrl,
      imageStorageId: p.imageStorageId,
      active: !p.active,
    })
    await refreshProducts()
  }

  if (checking)
    return <Shell>Checking session…</Shell>

  if (!authed)
    return (
      <Shell>
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm mx-auto p-8 rounded-3xl"
          style={{ background: "white", border: "1px solid rgba(200,151,58,0.15)" }}
        >
          <div className="flex flex-col items-center text-center mb-6">
            <GoldLogoMark size={40} className="mb-3" />
            <h1 style={{ fontFamily: fonts.serif, color: colors.ink, fontSize: "1.4rem" }}>
              Client Admin
            </h1>
            <p className="text-xs mt-1" style={{ color: colors.tan, fontFamily: fonts.sans }}>
              Sign in to manage products and orders
            </p>
          </div>
          <label className="block text-xs mb-1" style={{ color: colors.brown, fontFamily: fonts.sans }}>
            Admin password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoFocus
            className="w-full px-4 py-3 rounded-full text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            style={{
              border: "1px solid rgba(200,151,58,0.3)",
              fontFamily: fonts.sans,
              color: colors.ink,
              background: colors.cream,
            }}
          />
          {error && (
            <p className="text-xs mt-3" style={{ color: colors.successDeep, fontFamily: fonts.sans }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full mt-4 py-3.5 rounded-full text-sm font-semibold transition-all hover:brightness-110"
            style={{ background: gradients.gold, color: colors.ink, fontFamily: fonts.sans }}
          >
            Sign in
          </button>
          <p className="text-[11px] mt-4 text-center" style={{ color: colors.tanFaint, fontFamily: fonts.sans }}>
            Ask the site owner for the admin password.
          </p>
        </form>
      </Shell>
    )

  return (
    <div className="min-h-full" style={{ background: colors.cream, fontFamily: fonts.body }}>
      {/* top bar */}
      <div
        className="sticky top-0 z-30"
        style={{ background: gradients.dark, borderBottom: "1px solid rgba(200,151,58,0.2)" }}
      >
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <GoldLogoMark size={26} />
            <div>
              <p className="text-sm leading-none" style={{ fontFamily: fonts.serif, color: colors.gold }}>
                Asthetic Accessory
              </p>
              <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: colors.brownMid, fontFamily: fonts.sans }}>
                Admin
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="#/"
              className="text-xs px-4 py-2 rounded-full"
              style={{ color: colors.gold, border: "1px solid rgba(200,151,58,0.35)", fontFamily: fonts.sans, textDecoration: "none" }}
            >
              View store
            </a>
            <button
              onClick={logout}
              className="text-xs px-4 py-2 rounded-full"
              style={{ color: colors.brownMid, fontFamily: fonts.sans }}
            >
              Log out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-6">
        {/* tabs */}
        <div className="flex gap-2 mb-6">
          {(["products", "orders"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => openTab(tab)}
              className="px-5 py-2 rounded-full text-sm capitalize transition-colors"
              style={{
                background: view === tab ? colors.ink : "white",
                color: view === tab ? colors.gold : colors.tan,
                fontFamily: fonts.sans,
                border: view === tab ? "none" : `1px solid ${colors.line}`,
              }}
            >
              {tab}
              {tab === "orders" && orders.length > 0 ? ` (${orders.length})` : ""}
            </button>
          ))}
        </div>

        {view === "products" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontFamily: fonts.serif, color: colors.ink, fontSize: "1.2rem" }}>
                Products
              </h2>
              <button
                onClick={() => setEditor("new")}
                className="px-5 py-2.5 rounded-full text-sm font-semibold"
                style={{ background: gradients.gold, color: colors.ink, fontFamily: fonts.sans }}
              >
                + Add Product
              </button>
            </div>

            {products.length === 0 ? (
              <Empty text="No products yet — add your first one." />
            ) : (
              <div className="space-y-2.5">
                {products.map((p) => (
                  <div
                    key={p._id}
                    className="flex items-center gap-4 p-3 rounded-2xl"
                    style={{ background: "white", border: "1px solid rgba(200,151,58,0.1)" }}
                  >
                    <div
                      className="rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                      style={{ width: 56, height: 56, background: colors.creamMuted }}
                    >
                      {p.image ? (
                        <img src={p.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span style={{ fontSize: "1.3rem" }}>💎</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: colors.ink, fontFamily: fonts.sans }}>
                        {p.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: colors.tan, fontFamily: fonts.sans }}>
                        {p.category}
                        {p.sku ? ` · ${p.sku}` : ""}
                        {p.tag ? ` · ${p.tag}` : ""}
                        {!p.active && <span style={{ color: colors.successDeep }}> · archived</span>}
                      </p>
                    </div>
                    <StockBadge stock={p.stock} />
                    <span className="text-sm font-semibold whitespace-nowrap" style={{ color: colors.gold, fontFamily: fonts.sans }}>
                      {formatPrice(p.price)}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <ActionButton onClick={() => setEditor(p)}>Edit</ActionButton>
                      <ActionButton onClick={() => toggleActive(p)}>
                        {p.active ? "Archive" : "Restore"}
                      </ActionButton>
                      <ActionButton danger onClick={() => handleDelete(p)}>
                        Delete
                      </ActionButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === "orders" && (
          <div>
            <h2 className="mb-4" style={{ fontFamily: fonts.serif, color: colors.ink, fontSize: "1.2rem" }}>
              Orders
            </h2>
            {orders.length === 0 ? (
              <Empty text="No orders yet — they'll appear here once checkout is live." />
            ) : (
              <div className="space-y-2.5">
                {orders.map((o) => {
                  const open = expandedOrder === o._id
                  const info = paymentInfo(o)
                  const itemCount = o.items.reduce((s, i) => s + i.quantity, 0)
                  const step =
                    ORDER_FLOW.find((f) => f.from === o.status) ?? null
                  return (
                    <div
                      key={o._id}
                      className="rounded-2xl"
                      style={{ background: "white", border: "1px solid rgba(200,151,58,0.1)" }}
                    >
                      {/* collapsed header — click to expand */}
                      <button
                        onClick={() => setExpandedOrder(open ? null : o._id)}
                        className="w-full text-left p-4 flex items-center gap-3"
                        aria-expanded={open}
                        style={{ fontFamily: fonts.sans }}
                      >
                        <span
                          className="text-xs shrink-0"
                          style={{ color: colors.tan, fontWeight: 700, letterSpacing: "0.05em" }}
                        >
                          {o.number}
                        </span>
                        <StatusChip status={o.status} />
                        <span className="flex-1 text-xs truncate" style={{ color: colors.tan }}>
                          {o.customer.name} · {itemCount} item{itemCount === 1 ? "" : "s"} ·{" "}
                          {new Date(o.createdAt).toLocaleString()}
                        </span>
                        <span className="text-sm font-semibold shrink-0" style={{ color: colors.gold }}>
                          {formatPrice(o.total)}
                        </span>
                        <span
                          className="text-xs shrink-0 transition-transform"
                          style={{ color: colors.tan, transform: open ? "rotate(180deg)" : "none" }}
                        >
                          ▾
                        </span>
                      </button>

                      {/* expanded details */}
                      {open && (
                        <div
                          className="px-4 pb-4 pt-1 border-t"
                          style={{ borderColor: "rgba(200,151,58,0.08)" }}
                        >
                          <div className="grid sm:grid-cols-2 gap-4 mb-4">
                            {/* customer */}
                            <div>
                              <DetailLabel>Customer</DetailLabel>
                              <DetailLine>{o.customer.name}</DetailLine>
                              <DetailLine>{o.customer.email}</DetailLine>
                              {o.customer.phone && <DetailLine>📞 {o.customer.phone}</DetailLine>}
                              {o.customer.address && (
                                <DetailLine>📍 {o.customer.address}</DetailLine>
                              )}
                            </div>
                            {/* payment + order meta */}
                            <div>
                              <DetailLabel>Order</DetailLabel>
                              <DetailLine>
                                Placed: {new Date(o.createdAt).toLocaleString()}
                              </DetailLine>
                              <DetailLine>
                                Status: <StatusChip status={o.status} />
                              </DetailLine>
                              <div className="mt-3">
                                <DetailLabel>Payment</DetailLabel>
                                <DetailLine>
                                  {info.isDemo ? "🧪 " : "💳 "}
                                  {info.method}
                                </DetailLine>
                                {info.isDemo && (
                                  <DetailLine style={{ color: colors.tanFaint }}>
                                    Demo payment — no real charge
                                  </DetailLine>
                                )}
                                {info.reference && (
                                  <DetailLine
                                    title={info.reference}
                                    style={{ color: colors.tanFaint, fontFamily: "monospace" }}
                                  >
                                    Ref: {info.reference.slice(0, 28)}
                                    {info.reference.length > 28 ? "…" : ""}
                                  </DetailLine>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* items */}
                          <DetailLabel>Items</DetailLabel>
                          <div className="mb-4 space-y-1">
                            {o.items.map((i, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between text-xs"
                                style={{ color: colors.brown, fontFamily: fonts.sans }}
                              >
                                <span className="truncate pr-3">
                                  {i.quantity} × {i.name}
                                </span>
                                <span style={{ color: colors.ink }}>
                                  {formatPrice(i.price * i.quantity)}
                                </span>
                              </div>
                            ))}
                            <div
                              className="border-t pt-1.5 mt-1.5 space-y-0.5"
                              style={{ borderColor: "rgba(200,151,58,0.1)" }}
                            >
                              <MoneyLine label="Subtotal" value={formatPrice(o.subtotal)} />
                              {o.discount > 0 && (
                                <MoneyLine
                                  label="Discount"
                                  value={`−${formatPrice(o.discount)}`}
                                />
                              )}
                              <MoneyLine
                                label="Shipping"
                                value={
                                  o.shipping === 0 ? "Free" : formatPrice(o.shipping)
                                }
                              />
                              <MoneyLine
                                label="Total"
                                value={formatPrice(o.total)}
                                strong
                              />
                            </div>
                          </div>

                          {/* fulfillment controls */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {step && (
                              <button
                                onClick={() => changeStatus(o, step.to)}
                                disabled={busyOrder === o._id}
                                className="px-4 py-2 rounded-full text-xs font-semibold transition-all hover:brightness-105 disabled:opacity-50"
                                style={{ background: gradients.gold, color: colors.ink, fontFamily: fonts.sans }}
                              >
                                {busyOrder === o._id ? "Updating…" : `✓ ${step.label}`}
                              </button>
                            )}
                            {o.status === "delivered" && (
                              <span
                                className="text-xs"
                                style={{ color: colors.successDeep, fontFamily: fonts.sans }}
                              >
                                ✅ Delivered — order complete
                              </span>
                            )}
                            {o.status === "pending" && (
                              <span
                                className="text-xs"
                                style={{ color: colors.goldDark, fontFamily: fonts.sans }}
                              >
                                ⏳ Awaiting payment confirmation
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {editor && (
        <ProductForm
          product={editor === "new" ? null : editor}
          password={password}
          saving={saving}
          onCancel={() => setEditor(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex items-center px-4" style={{ background: colors.cream, fontFamily: fonts.body }}>
      {children}
    </div>
  )
}

function StockBadge({ stock }: { stock?: number }) {
  if (stock === undefined) return null
  const soldOut = stock <= 0
  const low = !soldOut && stock <= 5
  return (
    <span
      className="text-[10px] uppercase px-2 py-1 rounded-full shrink-0 whitespace-nowrap"
      style={{
        background: soldOut
          ? "rgba(179,38,30,0.12)"
          : low
            ? "rgba(200,151,58,0.15)"
            : "rgba(109,186,90,0.15)",
        color: soldOut ? colors.danger : low ? colors.goldDark : colors.successDeep,
        fontFamily: fonts.sans,
        fontWeight: 700,
        letterSpacing: "0.05em",
      }}
    >
      {soldOut ? "Sold out" : `${stock} left`}
    </span>
  )
}

function StatusChip({ status }: { status: string }) {
  const palette: Record<string, { bg: string; fg: string }> = {
    paid: { bg: "rgba(109,186,90,0.15)", fg: colors.successDeep },
    processing: { bg: "rgba(200,151,58,0.18)", fg: colors.goldDark },
    shipped: { bg: "rgba(122,149,216,0.15)", fg: colors.blue },
    delivered: { bg: "rgba(109,186,90,0.22)", fg: colors.successDeep },
    pending: { bg: "rgba(200,151,58,0.12)", fg: colors.goldDark },
    failed: { bg: "rgba(179,38,30,0.12)", fg: colors.danger },
  }
  const tone = palette[status] ?? palette.pending
  return (
    <span
      className="text-[10px] uppercase px-2.5 py-1 rounded-full shrink-0"
      style={{
        background: tone.bg,
        color: tone.fg,
        fontFamily: fonts.sans,
        fontWeight: 700,
        letterSpacing: "0.06em",
      }}
    >
      {status}
    </span>
  )
}

function DetailLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] uppercase mb-1"
      style={{
        color: colors.tanFaint,
        fontFamily: fonts.sans,
        fontWeight: 700,
        letterSpacing: "0.12em",
      }}
    >
      {children}
    </p>
  )
}

function DetailLine({
  children,
  style,
  title,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
  title?: string
}) {
  return (
    <p
      className="text-xs mb-0.5 break-words"
      style={{ color: colors.brown, fontFamily: fonts.sans, ...style }}
      title={title}
    >
      {children}
    </p>
  )
}

function MoneyLine({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div
      className="flex justify-between text-xs"
      style={{
        color: strong ? colors.ink : colors.tan,
        fontFamily: fonts.sans,
        fontWeight: strong ? 700 : 400,
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="py-20 text-center">
      <p style={{ fontFamily: fonts.serif, color: colors.gold, fontSize: "1.1rem" }}>{text}</p>
    </div>
  )
}

function ActionButton({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-3 py-1.5 rounded-full transition-colors"
      style={{
        color: danger ? colors.danger : colors.brown,
        border: `1px solid ${danger ? "rgba(179,38,30,0.35)" : colors.line}`,
        fontFamily: fonts.sans,
      }}
    >
      {children}
    </button>
  )
}

function ProductForm({
  product,
  password,
  saving,
  onCancel,
  onSave,
}: {
  product: AdminProduct | null
  password: string
  saving: boolean
  onCancel: () => void
  onSave: (input: AdminProductInput) => void
}) {
  const [name, setName] = useState(product?.name ?? "")
  const [price, setPrice] = useState(product ? String(product.price) : "")
  const [sku, setSku] = useState(product?.sku ?? "")
  const [stock, setStock] = useState(
    product?.stock === undefined ? "" : String(product.stock),
  )
  const [category, setCategory] = useState(product?.category ?? "Necklaces")
  const [tag, setTag] = useState(product?.tag ?? "")
  const [description, setDescription] = useState(product?.description ?? "")
  const [active, setActive] = useState(product?.active ?? true)
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "")
  const [storageId, setStorageId] = useState(product?.imageStorageId ?? "")
  const [preview, setPreview] = useState<string | null>(product?.image ?? null)
  const [uploading, setUploading] = useState(false)
  const [formError, setFormError] = useState("")

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    setUploading(true)
    setFormError("")
    try {
      const id = await uploadProductPhoto(password, file)
      setStorageId(id)
      setPreview(URL.createObjectURL(file))
    } catch {
      setFormError("Photo upload failed — try again.")
    } finally {
      setUploading(false)
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = parseFloat(price)
    if (!name.trim() || isNaN(parsed) || parsed <= 0) {
      setFormError("Enter a name and a price greater than 0.")
      return
    }
    const parsedStock = stock.trim() === "" ? undefined : Math.round(Number(stock))
    if (stock.trim() !== "" && (isNaN(parsedStock!) || parsedStock! < 0)) {
      setFormError("Stock must be a whole number of 0 or more (or blank to not track it).")
      return
    }
    onSave({
      id: product?._id,
      name: name.trim(),
      price: Math.round(parsed * 100) / 100,
      sku: sku.trim() || undefined,
      stock: parsedStock,
      category,
      tag: tag || undefined,
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      imageStorageId: storageId || undefined,
      active,
    })
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.72rem",
    marginBottom: 4,
    color: colors.brown,
    fontFamily: fonts.sans,
    letterSpacing: "0.04em",
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,6,4,0.6)", backdropFilter: "blur(6px)" }}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-lg rounded-3xl p-7 max-h-[90vh] overflow-y-auto"
        style={{ background: colors.cream, border: "1px solid rgba(200,151,58,0.2)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 style={{ fontFamily: fonts.serif, color: colors.ink, fontSize: "1.25rem" }}>
            {product ? "Edit product" : "Add product"}
          </h3>
          <button type="button" onClick={onCancel} aria-label="Close editor" style={{ color: colors.tan }}>
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label style={labelStyle}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="Gold Hoop Earrings" />
          </div>
          <div>
            <label style={labelStyle}>Price (₹)</label>
            <input value={price} onChange={(e) => setPrice(e.target.value)} style={inputStyle} inputMode="decimal" placeholder="1499" />
          </div>
          <div>
            <label style={labelStyle}>SKU</label>
            <input value={sku} onChange={(e) => setSku(e.target.value)} style={inputStyle} placeholder="AA-N-001" />
          </div>
          <div>
            <label style={labelStyle}>Stock (units)</label>
            <input
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              style={inputStyle}
              inputMode="numeric"
              placeholder="e.g. 10 — blank = not tracked"
            />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
              {CATEGORIES.filter((c) => c !== "All").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Tag</label>
            <select value={tag} onChange={(e) => setTag(e.target.value)} style={inputStyle}>
              {TAGS.map((t) => (
                <option key={t || "none"} value={t}>
                  {t || "None"}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm" style={{ color: colors.brown, fontFamily: fonts.sans }}>
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              Visible in store
            </label>
          </div>
          <div className="col-span-2">
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
              placeholder="Short description for the product"
            />
          </div>
        </div>

        <div className="mt-5">
          <label style={labelStyle}>Photo</label>
          <div className="flex items-center gap-3">
            <div
              className="rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
              style={{ width: 72, height: 72, background: colors.creamMuted, border: `1px dashed ${colors.line}` }}
            >
              {preview ? (
                <img src={preview} alt="" className="w-full h-full object-cover" />
              ) : (
                <span style={{ fontSize: "1.6rem" }}>📷</span>
              )}
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label
                className="text-xs px-4 py-2 rounded-full text-center cursor-pointer"
                style={{ background: gradients.gold, color: colors.ink, fontFamily: fonts.sans, fontWeight: 600 }}
              >
                {uploading ? "Uploading…" : "Upload photo"}
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
              </label>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                style={{ ...inputStyle, fontSize: "0.75rem" }}
                placeholder="…or paste an image URL"
              />
            </div>
          </div>
        </div>

        {formError && (
          <p className="text-xs mt-3"            style={{ color: colors.danger, fontFamily: fonts.sans }}>
            {formError}
          </p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-full text-sm"
            style={{ border: `1px solid ${colors.line}`, color: colors.brown, fontFamily: fonts.sans }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 rounded-full text-sm font-semibold"
            style={{ background: gradients.gold, color: colors.ink, fontFamily: fonts.sans, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Saving…" : product ? "Save changes" : "Add product"}
          </button>
        </div>
      </form>
    </div>
  )
}