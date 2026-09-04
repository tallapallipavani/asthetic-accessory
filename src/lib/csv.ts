/** CSV export helpers for the admin panel. */

function esc(value: string | number): string {
  const s = String(value ?? "")
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(header: string[], rows: (string | number)[][]): string {
  return [header, ...rows]
    .map((row) => row.map(esc).join(","))
    .join("\n")
}

/** Triggers a browser download of the given CSV content. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function dateStamp(): string {
  return new Date().toISOString().slice(0, 10)
}
