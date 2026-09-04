import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { PRIZES } from "../data"
import { colors, fonts, gradients } from "../lib/theme"
import { useOverlay } from "../lib/useOverlay"
import GoldLogoMark from "./GoldLogoMark"

const CONFETTI_COLORS = [
  colors.gold,
  colors.goldLight,
  colors.cream,
  colors.success,
  colors.goldDark,
  colors.goldMuted,
]

function Confetti({ count = 80 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.7,
        duration: 2.2 + Math.random() * 1.8,
        size: 6 + Math.random() * 7,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        round: Math.random() < 0.3,
      })),
    [count],
  )

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 1.8,
            borderRadius: p.round ? "50%" : 2,
            background: p.color,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  )
}

export default function SpinWheelModal({
  onClose,
  onWin,
}: {
  onClose: () => void
  onWin: (prize: { icon: string; label: string }) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotRef = useRef(0)
  const rafRef = useRef(0)
  const [spinning, setSpinning] = useState(false)
  const [won, setWon] = useState<{ icon: string; label: string } | null>(null)

  const N = PRIZES.length
  const SEG = (2 * Math.PI) / N

  const drawWheel = useCallback(
    (rot: number) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")!
      const W = canvas.width
      const H = canvas.height
      const cx = W / 2
      const cy = H / 2
      const R = Math.min(cx, cy) - 8

      ctx.clearRect(0, 0, W, H)

      // subtle outer glow
      const glow = ctx.createRadialGradient(cx, cy, R - 10, cx, cy, R + 16)
      glow.addColorStop(0, "rgba(200,151,58,0.25)")
      glow.addColorStop(1, "rgba(200,151,58,0)")
      ctx.beginPath()
      ctx.arc(cx, cy, R + 14, 0, Math.PI * 2)
      ctx.fillStyle = glow
      ctx.fill()

      // segments
      PRIZES.forEach((p, i) => {
        const a0 = rot + i * SEG - Math.PI / 2
        const a1 = a0 + SEG
        const mid = a0 + SEG / 2

        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, R, a0, a1)
        ctx.closePath()
        ctx.fillStyle = p.color
        ctx.fill()
        ctx.strokeStyle = "rgba(250,248,244,0.5)"
        ctx.lineWidth = 1.5
        ctx.stroke()

        // icon + label text
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(mid)

        ctx.font = "16px serif"
        ctx.textAlign = "center"
        ctx.fillStyle = p.textColor
        ctx.fillText(p.icon, R * 0.68, 5)

        ctx.font = `600 10px ${fonts.sans}, sans-serif`
        ctx.fillStyle = p.textColor
        ctx.textAlign = "center"
        ctx.fillText(p.label, R * 0.38, 21)

        ctx.restore()
      })

      // outer ring
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.strokeStyle = "rgba(200,151,58,0.5)"
      ctx.lineWidth = 2.5
      ctx.stroke()

      // center medallion gradient
      const cg = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, 26)
      cg.addColorStop(0, colors.goldPale)
      cg.addColorStop(1, colors.goldDark)
      ctx.beginPath()
      ctx.arc(cx, cy, 26, 0, Math.PI * 2)
      ctx.fillStyle = cg
      ctx.fill()
      ctx.strokeStyle = "rgba(250,248,244,0.7)"
      ctx.lineWidth = 2
      ctx.stroke()

      // center dot
      ctx.beginPath()
      ctx.arc(cx, cy, 6, 0, Math.PI * 2)
      ctx.fillStyle = colors.inkSoft
      ctx.fill()
    },
    [SEG],
  )

  useEffect(() => {
    drawWheel(0)
  }, [drawWheel])

  const doSpin = () => {
    if (spinning || won) return
    setSpinning(true)
    const start = rotRef.current
    const extraRot = (Math.floor(Math.random() * 4) + 5) * Math.PI * 2
    const randOffset = Math.random() * Math.PI * 2
    const total = extraRot + randOffset
    const t0 = performance.now()
    const duration = 4500

    const tick = (now: number) => {
      const t = Math.min((now - t0) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 4)
      const cur = start + total * ease
      rotRef.current = cur
      drawWheel(cur)

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rotRef.current = start + total
        drawWheel(start + total)
        const finalRot =
          ((rotRef.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
        const pointerAngle =
          (Math.PI * 2 - finalRot + Math.PI * 2) % (Math.PI * 2)
        const idx = Math.floor(pointerAngle / SEG) % N
        const prize = PRIZES[idx]
        setWon(prize)
        setSpinning(false)
        onWin(prize)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  const overlayRef = useOverlay(onClose)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,6,4,0.9)", backdropFilter: "blur(12px)" }}
    >
      <div
        ref={overlayRef}
        role="dialog"
        aria-modal="true"
        aria-label="Spin & Win"
        className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: gradients.modal,
          border: "1px solid rgba(200,151,58,0.22)",
          boxShadow:
            "0 0 80px rgba(200,151,58,0.1), 0 30px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            background:
              gradients.goldBar,
            height: 3,
          }}
        />
        <div className="p-7">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 transition-opacity hover:opacity-60"
            style={{ color: colors.gold }}
            aria-label="Close spin wheel"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="text-center mb-5">
            <GoldLogoMark size={34} className="mb-3" />
            <p
              className="text-xs uppercase mb-2"
              style={{
                color: colors.gold,
                fontFamily: fonts.sans,
                fontWeight: 700,
                letterSpacing: "0.22em",
              }}
            >
              ✦ Exclusive Reward ✦
            </p>
            <h3
              style={{
                fontFamily: fonts.serif,
                color: colors.cream,
                fontSize: "1.7rem",
                lineHeight: 1.15,
              }}
            >
              Spin &amp; Win!
            </h3>
            <p
              className="mt-1.5 text-xs"
              style={{ color: colors.brownMid, fontFamily: fonts.sans, fontWeight: 300 }}
            >
              Your order qualifies — spin for an exclusive gift
            </p>
          </div>

          {/* pointer */}
          <div className="flex justify-center mb-0.5">
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "11px solid transparent",
                borderRight: "11px solid transparent",
                borderTop: `20px solid ${colors.gold}`,
                filter: "drop-shadow(0 4px 8px rgba(200,151,58,0.6))",
              }}
            />
          </div>

          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              width={280}
              height={280}
              onClick={doSpin}
              role="button"
              tabIndex={won ? -1 : 0}
              aria-label="Spin the wheel"
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !spinning && !won) {
                  e.preventDefault()
                  doSpin()
                }
              }}
              style={{
                cursor: spinning || won ? "default" : "pointer",
                borderRadius: "50%",
                display: "block",
              }}
            />
          </div>

          {won && <Confetti />}

          {won ? (
            <div className="mt-6 text-center pop-in">
              <div className="text-5xl mb-3">{won.icon}</div>
              <p
                style={{
                  color: colors.cream,
                  fontFamily: fonts.serif,
                  fontSize: "1.3rem",
                }}
              >
                You won: <span style={{ color: colors.gold }}>{won.label}</span>!
              </p>
              <p
                className="mt-1.5 text-xs"
                style={{ color: colors.brownMid, fontFamily: fonts.sans }}
              >
                Reward applied to your order automatically
              </p>
              <button
                onClick={onClose}
                className="mt-5 w-full py-3.5 rounded-full text-sm font-semibold"
                style={{
                  background: gradients.gold,
                  color: colors.ink,
                  fontFamily: fonts.sans,
                  letterSpacing: "0.07em",
                  boxShadow: "0 4px 20px rgba(200,151,58,0.4)",
                }}
              >
                🎉 Continue Shopping
              </button>
            </div>
          ) : (
            <div className="mt-5 text-center">
              <button
                onClick={doSpin}
                disabled={spinning}
                className="w-full py-3.5 rounded-full text-sm font-semibold transition-all"
                style={{
                  background: spinning
                    ? "rgba(200,151,58,0.15)"
                    : gradients.gold,
                  color: spinning ? colors.brownMid : colors.ink,
                  fontFamily: fonts.sans,
                  letterSpacing: "0.07em",
                  cursor: spinning ? "not-allowed" : "pointer",
                  boxShadow: spinning
                    ? "none"
                    : "0 4px 20px rgba(200,151,58,0.35)",
                }}
              >
                {spinning ? "Spinning…" : "🎰 Spin the Wheel"}
              </button>
              <p
                className="mt-2 text-xs"
                style={{ color: colors.brownDim, fontFamily: fonts.sans }}
              >
                Tap the wheel or button to spin
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}