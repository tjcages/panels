import { loadFont } from '@remotion/fonts'
import type { ReactNode } from 'react'
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'

import { entrance, move, staggerDelay } from './motion'

// The panel's own face (its stylesheet asks for Inter first), self-hosted:
// the same @fontsource files the capture fixture renders with.
export const INTER = 'Inter'
export const MONO = 'JetBrains Mono'
for (const weight of ['400', '500', '600']) {
  loadFont({ family: INTER, url: staticFile(`fonts/inter-latin-${weight}-normal.woff2`), weight })
}
loadFont({ family: MONO, url: staticFile('fonts/jetbrains-mono-latin-500-normal.woff2'), weight: '500' })

export const INK = '#141414'
export const PAPER = '#f4f2ee'
export const ORANGE = '#ff5e1f'

/**
 * The film's one text treatment: words rise in on the entrance spring while
 * the whole card drifts in slightly, the same slow push the camera uses.
 */
export function Words({
  text,
  size = 96,
  color = INK,
  delay = 0,
  weight = 600,
  accent,
}: {
  text: string
  size?: number
  color?: string
  delay?: number
  weight?: number
  /** A word drawn in the accent colour. */
  accent?: string
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return (
    <div
      style={{
        fontFamily: INTER,
        fontSize: size,
        fontWeight: weight,
        letterSpacing: '-0.035em',
        lineHeight: 1.05,
        color,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: `0 ${size * 0.26}px`,
      }}
    >
      {text.split(' ').map((word, i) => {
        const e = entrance(frame, fps, delay + staggerDelay(i))
        return (
          <span
            key={`${word}-${i}`}
            style={{
              display: 'inline-block',
              opacity: e.opacity,
              transform: `translateY(${e.translateY * (size / 40)}px)`,
              color: accent && word.replace(/[.,]/g, '') === accent ? ORANGE : undefined,
            }}
          >
            {word}
          </span>
        )
      })}
    </div>
  )
}

export function Card({
  background = PAPER,
  children,
  drift = [0, 90],
}: {
  background?: string
  children: ReactNode
  drift?: [number, number]
}) {
  const frame = useCurrentFrame()
  const scale = move(frame, drift, [1, 1.045], 'drift')
  return (
    <AbsoluteFill style={{ background, alignItems: 'center', justifyContent: 'center' }}>
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 28,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
