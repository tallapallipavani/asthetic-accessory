/* Indian rupee formatting and the store's money thresholds. */

export const FREE_SHIPPING_MIN = 1000 // orders at/above this ship free
export const FLAT_SHIPPING = 99 // otherwise
export const SPIN_MIN = 10000 // cart total that unlocks the Spin & Win wheel

/** Formats a number as rupees, e.g. ₹4,999 or ₹1,234.5 */
export function formatPrice(value: number): string {
  const rounded = Math.round(value * 100) / 100
  const hasPaise = Math.abs(rounded - Math.round(rounded)) > 1e-9
  return `₹${rounded.toLocaleString("en-IN", {
    maximumFractionDigits: hasPaise ? 2 : 0,
  })}`
}