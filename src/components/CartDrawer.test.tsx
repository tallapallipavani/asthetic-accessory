import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { CartItem, Reward } from "../types"
import CartDrawer from "./CartDrawer"

const pearl: CartItem = {
  id: "1",
  name: "Delicate Pearl Necklace",
  price: 4999,
  category: "Necklaces",
  image: null,
  addedAt: "2026-04-12",
  quantity: 2,
}

const ring: CartItem = {
  id: "2",
  name: "18K Gold Twist Ring",
  price: 8999,
  category: "Rings",
  image: null,
  addedAt: "2026-02-14",
  quantity: 1,
}

const discount: Reward = {
  id: "r1",
  kind: "discount",
  label: "10% Off Next",
  icon: "💫",
  value: 52,
}

function renderCart(overrides: Partial<Parameters<typeof CartDrawer>[0]> = {}) {
  const props = {
    cart: [] as CartItem[],
    rewards: [] as Reward[],
    onClose: vi.fn(),
    onRemove: vi.fn(),
    onQty: vi.fn(),
    total: 0,
    onCheckout: vi.fn(),
    ...overrides,
  }
  render(<CartDrawer {...props} />)
  return props
}

describe("CartDrawer", () => {
  it("shows the empty state when the bag has no items", () => {
    renderCart()
    expect(screen.getByText("Your bag is empty")).toBeInTheDocument()
    expect(screen.getByText("Add something beautiful")).toBeInTheDocument()
  })

  it("renders each item with its name and quantity", () => {
    renderCart({ cart: [pearl, ring] })
    expect(screen.getByText("Delicate Pearl Necklace")).toBeInTheDocument()
    expect(screen.getByText("18K Gold Twist Ring")).toBeInTheDocument()
    expect(screen.getAllByText("2")[0]).toBeInTheDocument()
    expect(screen.getAllByText("1")[0]).toBeInTheDocument()
    // line totals: 2 × ₹4,999, 1 × ₹8,999
    expect(screen.getByText("₹9,998")).toBeInTheDocument()
    expect(screen.getByText("₹8,999")).toBeInTheDocument()
  })

  it("increments quantity through the + button", async () => {
    const user = userEvent.setup()
    const props = renderCart({ cart: [pearl] })
    await user.click(
      screen.getByRole("button", {
        name: "Increase quantity of Delicate Pearl Necklace",
      }),
    )
    expect(props.onQty).toHaveBeenCalledWith("1", 3)
  })

  it("decrements quantity through the − button", async () => {
    const user = userEvent.setup()
    const props = renderCart({ cart: [pearl] })
    await user.click(
      screen.getByRole("button", {
        name: "Decrease quantity of Delicate Pearl Necklace",
      }),
    )
    expect(props.onQty).toHaveBeenCalledWith("1", 1)
  })

  it("removes an item through its remove button", async () => {
    const user = userEvent.setup()
    const props = renderCart({ cart: [pearl, ring] })
    await user.click(
      screen.getByRole("button", { name: "Remove Delicate Pearl Necklace from bag" }),
    )
    expect(props.onRemove).toHaveBeenCalledWith("1")
  })

  it("closes via the drawer close button", async () => {
    const user = userEvent.setup()
    const props = renderCart()
    await user.click(screen.getByRole("button", { name: "Close shopping bag" }))
    expect(props.onClose).toHaveBeenCalled()
  })

  it("closes on the Escape key and exposes it as a dialog", () => {
    const props = renderCart({ cart: [pearl] })
    expect(
      screen.getByRole("dialog", { name: "Shopping bag" }),
    ).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" })
    expect(props.onClose).toHaveBeenCalled()
  })

  it("locks background scroll while open", () => {
    renderCart({ cart: [pearl] })
    expect(document.body.style.overflow).toBe("hidden")
  })

  it("runs checkout from the plain checkout button", async () => {
    const user = userEvent.setup()
    const props = renderCart({ cart: [pearl], total: 344 })
    await user.click(
      screen.getByRole("button", { name: /Proceed to Checkout/ }),
    )
    expect(props.onCheckout).toHaveBeenCalled()
  })

  it("waives shipping for a qualifying order and shows the discounted total", () => {
    // 1 × pearl (₹4,999) ≥ ₹1,000 free-shipping minimum
    // → shipping row "Free", grand total = ₹4,999 (no ₹99 fee added);
    // ₹4,999 appears twice: the item's line total and the grand total
    renderCart({ cart: [pearl], total: 4999 })
    expect(screen.getByText("Free")).toBeInTheDocument()
    expect(screen.getAllByText("₹4,999")).toHaveLength(2)
    expect(screen.queryByText("₹99")).toBeNull()
  })

  it("shows the spin-to-win checkout button when the subtotal qualifies", () => {
    renderCart({ cart: [ring], total: 20000 })
    expect(
      screen.getByRole("button", { name: /Checkout & Spin to Win/ }),
    ).toBeInTheDocument()
  })

  it("lists applied rewards and shows a complete-order button", () => {
    renderCart({ cart: [ring], rewards: [discount], total: 8999 })
    expect(
      screen.getByText("🎁 Rewards applied to this order"),
    ).toBeInTheDocument()
    expect(screen.getByText(/10% Off Next/)).toBeInTheDocument()
    // discount appears in both the reward row and the totals
    expect(screen.getAllByText("−₹52").length).toBeGreaterThan(0)
    expect(
      screen.getByRole("button", { name: /Complete Order/ }),
    ).toBeInTheDocument()
  })
})
