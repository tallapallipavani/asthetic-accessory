import { describe, expect, it, vi } from "vitest"
import { dateStamp, downloadCsv, toCsv } from "./csv"

describe("toCsv", () => {
  it("joins headers and rows with commas and newlines", () => {
    expect(
      toCsv(["Name", "Total"], [["A", 5], ["B", 10]]),
    ).toBe("Name,Total\nA,5\nB,10")
  })

  it("quotes fields containing commas, quotes, or newlines", () => {
    const csv = toCsv(["Note"], [["hi, there"], ['say "hi"'], ["two\nlines"]])
    expect(csv).toBe(
      'Note\n"hi, there"\n"say ""hi"""\n"two\nlines"',
    )
  })

  it("treats null/undefined as empty cells", () => {
    expect(toCsv(["A", "B"], [["x", undefined as unknown as string]])).toBe(
      "A,B\nx,",
    )
  })
})

describe("downloadCsv", () => {
  it("creates a blob download with a UTF-8 BOM and revokes the URL", () => {
    const create = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:fake")
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {})
    const click = vi.fn()
    HTMLAnchorElement.prototype.click = click

    downloadCsv("test.csv", "a,b")

    const blob = create.mock.calls[0][0] as Blob
    expect(blob.type).toBe("text/csv;charset=utf-8")
    expect(click).toHaveBeenCalledOnce()
    expect(revoke).toHaveBeenCalledWith("blob:fake")

    create.mockRestore()
    revoke.mockRestore()
  })
})

describe("dateStamp", () => {
  it("returns an ISO date like YYYY-MM-DD", () => {
    expect(dateStamp()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
