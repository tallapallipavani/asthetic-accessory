import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { Product } from "../types"
import WishlistDrawer from "./WishlistDrawer"

const pearl: Product = {
  id: "1",
  name: "Delicate Pearl Necklace",
  price: 4999,
  category: "Necklaces",
  image: null,
  addedAt: "2026-04-12",
}

const ring: Product = {
  id: "2",
  name: "18K Gold Twist Ring",
  price: 8999,
  category: "Rings",
  image: null,
  addedAt: "2026-02-14",
}

function renderWishlist(overrides: Partial<Parameters<typeof WishlistDrawer>[0]> = {}) {
  const props = {
    items: [] as Product[],
    onClose: vi.fn(),
    onRemove: vi.fn(),
    onAddToCart: vi.fn(),
    onAddAll: vi.fn(),
    ...overrides,
  }
  render(<WishlistDrawer {...props} />)
  return props
}

describe("WishlistDrawer", () => {
  it("shows the empty state when nothing is saved", () => {
    renderWishlist()
    expect(screen.getByText("Your wishlist is empty")).toBeInTheDocument()
    expect(screen.getByText(/Tap the ♥/)).toBeInTheDocument()
  })

  it("renders each saved piece with name, category, and price", () => {
    renderWishlist({ items: [pearl, ring] })
    expect(screen.getByText("Delicate Pearl Necklace")).toBeInTheDocument()
    expect(screen.getByText("18K Gold Twist Ring")).toBeInTheDocument()
    expect(screen.getByText("₹4,999")).toBeInTheDocument()
    expect(screen.getByText("₹8,999")).toBeInTheDocument()
  })

  it("adds a single item to the bag", async () => {
    const user = userEvent.setup()
    const props = renderWishlist({ items: [pearl, ring] })
    const bagButtons = screen.getAllByRole("button", { name: "+ Bag" })
    await user.click(bagButtons[1])
    expect(props.onAddToCart).toHaveBeenCalledWith(ring)
  })

  it("removes an item through its remove button", async () => {
    const user = userEvent.setup()
    const props = renderWishlist({ items: [pearl, ring] })
    await user.click(
      screen.getByRole("button", {
        name: "Remove Delicate Pearl Necklace from wishlist",
      }),
    )
    expect(props.onRemove).toHaveBeenCalledWith("1")
  })

  it("adds everything to the bag via Add All", async () => {
    const user = userEvent.setup()
    const props = renderWishlist({ items: [pearl, ring] })
    await user.click(screen.getByRole("button", { name: /Add All to Bag/ }))
    expect(props.onAddAll).toHaveBeenCalled()
  })

  it("hides Add All when the wishlist is empty", () => {
    renderWishlist()
    expect(screen.queryByRole("button", { name: /Add All to Bag/ })).toBeNull()
  })

  it("closes via the drawer close button", async () => {
    const user = userEvent.setup()
    const props = renderWishlist()
    await user.click(screen.getByRole("button", { name: "Close wishlist" }))
    expect(props.onClose).toHaveBeenCalled()
  })

  it("closes on the Escape key and exposes it as a dialog", () => {
    const props = renderWishlist({ items: [pearl] })
    expect(
      screen.getByRole("dialog", { name: "Wishlist" }),
    ).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" })
    expect(props.onClose).toHaveBeenCalled()
  })
})
