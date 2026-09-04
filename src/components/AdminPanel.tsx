import { useEffect, useState } from "react"
import { CATEGORIES } from "../data"
import {
  ADMIN_SESSION_KEY,
  adminLogin,
  deleteProduct,
  listAllProducts,
  listOrders,
  saveProduct,
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
  createdAt: number
}

const TAGS = ["", "New", "Bestseller", "Premium"]

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
                        {p.tag ? ` · ${p.tag}` : ""}
                        {!p.active && <span style={{ color: colors.successDeep }}> · archived</span>}
                      </p>
                    </div>
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
                {orders.map((o) => (
                  <div
                    key={o._id}
                    className="p-4 rounded-2xl"
                    style={{ background: "white", border: "1px solid rgba(200,151,58,0.1)" }}
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <p className="text-sm font-semibold" style={{ color: colors.ink, fontFamily: fonts.sans }}>
                        {o.number}
                      </p>
                      <span
                        className="text-[10px] uppercase px-2.5 py-1 rounded-full"
                        style={{
                          background:
                            o.status === "paid"
                              ? "rgba(109,186,90,0.15)"
                              : "rgba(200,151,58,0.15)",
                          color: o.status === "paid" ? colors.successDeep : colors.goldDark,
                          fontFamily: fonts.sans,
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                        }}
                      >
                        {o.status}
                      </span>
                    </div>
                    <p className="text-xs mt-1.5" style={{ color: colors.tan, fontFamily: fonts.sans }}>
                      {o.customer.name} · {o.customer.email}
                      {o.items.reduce((s, i) => s + i.quantity, 0)} item(s) ·{" "}
                      {new Date(o.createdAt).toLocaleString()}
                    </p>
                    <p className="text-sm mt-2 font-semibold" style={{ color: colors.gold, fontFamily: fonts.sans }}>
                      Total {formatPrice(o.total)}
                    </p>
                  </div>
                ))}
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
    onSave({
      id: product?._id,
      name: name.trim(),
      price: Math.round(parsed * 100) / 100,
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
            <label style={labelStyle}>Price</label>
            <input value={price} onChange={(e) => setPrice(e.target.value)} style={inputStyle} inputMode="decimal" placeholder="1499" />
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