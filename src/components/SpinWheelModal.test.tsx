import { act, render, screen } from "@testing-library/react"
import { fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import SpinWheelModal from "./SpinWheelModal"

/** jsdom has no canvas — stub a no-op 2D context so the wheel can draw. */
function stubCanvas() {
  const ctx = {
    createRadialGradient: () => ({ addColorStop: vi.fn() }),
    arc: vi.fn(),
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    fillText: vi.fn(),
    moveTo: vi.fn(),
    restore: vi.fn(),
    rotate: vi.fn(),
    save: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
  } as unknown as CanvasRenderingContext2D
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx)
}

describe("SpinWheelModal", () => {
  beforeEach(() => {
    stubCanvas()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("renders the wheel with a spin button", () => {
    render(<SpinWheelModal onClose={vi.fn()} onWin={vi.fn()} />)
    expect(screen.getByText("Spin & Win!")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "🎰 Spin the Wheel" }),
    ).toBeInTheDocument()
  })

  it("closes via the ✕ button", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<SpinWheelModal onClose={onClose} onWin={vi.fn()} />)
    await user.click(screen.getByRole("button", { name: "Close spin wheel" }))
    expect(onClose).toHaveBeenCalled()
  })

  it("closes on the Escape key", () => {
    const onClose = vi.fn()
    render(<SpinWheelModal onClose={onClose} onWin={vi.fn()} />)
    fireEvent.keyDown(screen.getByRole("dialog", { name: "Spin & Win" }), {
      key: "Escape",
    })
    expect(onClose).toHaveBeenCalled()
  })

  it("disables the spin button while spinning", async () => {
    const user = userEvent.setup()
    const rafCallbacks: FrameRequestCallback[] = []
    vi.stubGlobal(
      "requestAnimationFrame",
      (cb: FrameRequestCallback) => {
        rafCallbacks.push(cb)
        return rafCallbacks.length
      },
    )
    render(<SpinWheelModal onClose={vi.fn()} onWin={vi.fn()} />)
    const button = screen.getByRole("button", { name: "🎰 Spin the Wheel" })
    await user.click(button)
    expect(button).toBeDisabled()
    expect(screen.getByText("Spinning…")).toBeInTheDocument()
  })

  it("awards a prize and reveals it after the spin finishes", async () => {
    const user = userEvent.setup()
    const rafCallbacks: FrameRequestCallback[] = []
    vi.stubGlobal(
      "requestAnimationFrame",
      (cb: FrameRequestCallback) => {
        rafCallbacks.push(cb)
        return rafCallbacks.length
      },
    )
    const onWin = vi.fn()
    render(<SpinWheelModal onClose={vi.fn()} onWin={onWin} />)
    await user.click(screen.getByRole("button", { name: "🎰 Spin the Wheel" }))
    expect(onWin).not.toHaveBeenCalled()

    // Complete the 4.5 s animation in a single frame far in the future.
    await act(async () => {
      rafCallbacks[0](performance.now() + 10000)
    })

    expect(onWin).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: expect.any(String),
        label: expect.any(String),
      }),
    )
    expect(screen.getByText(/You won:/)).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Continue Shopping/ }),
    ).toBeInTheDocument()
  })
})
