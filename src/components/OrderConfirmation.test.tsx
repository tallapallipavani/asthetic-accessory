import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { Order } from "../types"
import OrderConfirmation from "./OrderConfirmation"

const order: Order = {
  number: "AA-1234",
  items: [
    {
      id: "1",
      name: "Delicate Pearl Necklace",
      price: 4999,
      category: "Necklaces",
      image: null,
      addedAt: "2026-04-12",
      quantity: 2,
    },
    {
      id: "2",
      name: "18K Gold Twist Ring",
      price: 8999,
      category: "Rings",
      image: null,
      addedAt: "2026-02-14",
      quantity: 1,
    },
  ],
  rewards: [
    { id: "r1", kind: "discount", label: "10% Off Next", icon: "💫", value: 1899.7 },
    { id: "r2", kind: "gift-wrapping", label: "Gift Wrapping", icon: "🎁" },
  ],
  subtotal: 18997,
  discount: 1899.7,
  shipping: 0,
  total: 17097.3,
}

describe("OrderConfirmation", () => {
  it("shows the confirmation header and order number", () => {
    render(<OrderConfirmation order={order} onClose={vi.fn()} />)
    expect(screen.getByText("✦ Order Confirmed ✦")).toBeInTheDocument()
    expect(screen.getByText("Thank you for your order!")).toBeInTheDocument()
    expect(screen.getByText("Order #AA-1234")).toBeInTheDocument()
  })

  it("lists each ordered item with quantity and line total", () => {
    render(<OrderConfirmation order={order} onClose={vi.fn()} />)
    expect(screen.getByText("2 × Delicate Pearl Necklace")).toBeInTheDocument()
    expect(screen.getByText("₹9,998")).toBeInTheDocument()
    expect(screen.getByText("1 × 18K Gold Twist Ring")).toBeInTheDocument()
    expect(screen.getByText("₹8,999")).toBeInTheDocument()
  })

  it("shows applied reward chips", () => {
    render(<OrderConfirmation order={order} onClose={vi.fn()} />)
    expect(screen.getByText(/10% Off Next/)).toBeInTheDocument()
    expect(screen.getByText(/Gift Wrapping/)).toBeInTheDocument()
  })

  it("shows the totals including the reward discount and free shipping", () => {
    render(<OrderConfirmation order={order} onClose={vi.fn()} />)
    expect(screen.getByText("₹18,997")).toBeInTheDocument()
    expect(screen.getByText("−₹1,899.7")).toBeInTheDocument()
    expect(screen.getByText("Free")).toBeInTheDocument()
    expect(screen.getByText("₹17,097.3")).toBeInTheDocument()
  })

  it("omits the reward discount row when there is no discount", () => {
    render(
      <OrderConfirmation
        order={{ ...order, discount: 0, total: order.subtotal }}
        onClose={vi.fn()}
      />,
    )
    expect(screen.queryByText("Reward discount")).toBeNull()
  })

  it("closes via Continue Shopping", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<OrderConfirmation order={order} onClose={onClose} />)
    await user.click(screen.getByRole("button", { name: /Continue Shopping/ }))
    expect(onClose).toHaveBeenCalled()
  })

  it("closes via the ✕ button", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<OrderConfirmation order={order} onClose={onClose} />)
    await user.click(screen.getByRole("button", { name: "Close" }))
    expect(onClose).toHaveBeenCalled()
  })

  it("closes on the Escape key and exposes it as a dialog", () => {
    const onClose = vi.fn()
    render(<OrderConfirmation order={order} onClose={onClose} />)
    expect(
      screen.getByRole("dialog", { name: "Order confirmation" }),
    ).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" })
    expect(onClose).toHaveBeenCalled()
  })
})
