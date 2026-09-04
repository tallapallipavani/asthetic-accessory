import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { loadLS, saveLS } from "./persistence"

function createStorageMock() {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = String(value)
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
    get length() {
      return Object.keys(store).length
    },
  }
}

describe("loadLS / saveLS", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorageMock())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("round-trips a JSON value", () => {
    const value = { items: [1, 2, 3], name: "bag" }
    saveLS("cart", value)
    expect(loadLS("cart", null)).toEqual(value)
  })

  it("returns the fallback when the key is missing", () => {
    expect(loadLS("missing", [])).toEqual([])
  })

  it("returns the fallback on corrupt JSON", () => {
    localStorage.setItem("cart", "{not valid json")
    expect(loadLS("cart", [])).toEqual([])
  })

  it("does not throw when storage writes fail (quota/blocked)", () => {
    const mock = createStorageMock()
    mock.setItem.mockImplementation(() => {
      throw new Error("QuotaExceededError")
    })
    vi.stubGlobal("localStorage", mock)
    expect(() => saveLS("cart", { big: "data" })).not.toThrow()
  })

  it("does not throw when storage reads fail", () => {
    const mock = createStorageMock()
    mock.getItem.mockImplementation(() => {
      throw new Error("SecurityError")
    })
    vi.stubGlobal("localStorage", mock)
    expect(() => loadLS("cart", [])).not.toThrow()
    expect(loadLS("cart", [])).toEqual([])
  })
})