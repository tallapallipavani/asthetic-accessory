import type { CSSProperties } from "react"
import logoUrl from "../assets/logo.png"
import { gradients } from "../lib/theme"

/* Gold logo mark (CSS mask over a gold gradient) for dark sections. */
export default function GoldLogoMark({
  size = 44,
  className,
  style,
}: {
  size?: number
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      aria-hidden
      className={className}
      style={{
        background: gradients.gold,
        WebkitMaskImage: `url(${logoUrl})`,
        maskImage: `url(${logoUrl})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        aspectRatio: "215 / 144",
        width: size,
        ...style,
      }}
    />
  )
}