import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from 'remotion'

import { CANVAS, cameraAt, cameraTransform, type CameraMove, type CameraState } from './camera'
import { CURSOR_BOX, CURSOR_TIP, Cursor, type CursorKind } from './cursors'

/**
 * Primary UI is recorded, not rebuilt. Each clip in public/footage is the
 * real @tjcages/panels FloatingPanel captured from capture/ at a 1440x810
 * CSS viewport (3x device pixels), retimed to 30 fps. The canvas is that
 * viewport scaled to 1920x1080, so one CSS pixel is 4/3 canvas pixels.
 */
export const CSS_TO_CANVAS = CANVAS.width / 1440

type Sample = { f: number; x: number; y: number; down: boolean; kind: CursorKind }
export type CursorTrack = { frames: number; samples: Sample[] }

export function css(x: number, y: number) {
  return { x: x * CSS_TO_CANVAS, y: y * CSS_TO_CANVAS }
}

function cursorAt(track: CursorTrack, frame: number) {
  const s = track.samples
  let i = 0
  while (i + 1 < s.length && s[i + 1].f <= frame) i++
  const a = s[i]
  const b = s[Math.min(i + 1, s.length - 1)]
  const span = b.f - a.f
  const t = span > 0 ? Math.min(1, Math.max(0, (frame - a.f) / span)) : 0
  // Press: in over two frames before the recorded down, held at least three
  // frames (a recorded click is near-instant), then released over four.
  let press = 0
  let downAt: number | null = null
  for (const sample of s) {
    if (sample.down && downAt === null) downAt = sample.f
    if (!sample.down && downAt !== null) {
      const upAt = Math.max(sample.f, downAt + 3)
      const p =
        frame < downAt - 2 ? 0
        : frame < downAt ? (frame - (downAt - 2)) / 2
        : frame <= upAt ? 1
        : Math.max(0, 1 - (frame - upAt) / 4)
      press = Math.max(press, p)
      downAt = null
    }
  }
  if (downAt !== null && frame >= downAt) press = 1
  // One cursor family per film: the drag needs grab/grabbing, so the arrow is
  // the native default rather than the soft glyph.
  const kind: CursorKind = a.kind === 'soft' ? 'default' : a.kind
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, kind, press }
}

/** Recorded product footage under a camera, with the recorded pointer. */
export function Footage({
  clip,
  track,
  offset = 0,
  camera,
  moves = [],
  cursor = true,
}: {
  clip: string
  track?: CursorTrack
  /** Footage frame shown on scene frame 0. */
  offset?: number
  camera: CameraState
  moves?: CameraMove[]
  cursor?: boolean
}) {
  const frame = useCurrentFrame()
  const state = cameraAt(frame, camera, moves)
  const pointer = track && cursor ? cursorAt(track, frame + offset) : null
  const size = 24 * CSS_TO_CANVAS
  const tip = pointer ? CURSOR_TIP[pointer.kind] : undefined
  const k = size / CURSOR_BOX

  return (
    <AbsoluteFill style={{ background: '#f4f2ee', overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: cameraTransform(state), transformOrigin: 'center center' }}>
        <OffthreadVideo
          src={staticFile(`footage/${clip}.mp4`)}
          startFrom={offset}
          muted
          style={{ position: 'absolute', inset: 0, width: CANVAS.width, height: CANVAS.height }}
        />
        {pointer ? (
          <Cursor
            kind={pointer.kind}
            x={pointer.x * CSS_TO_CANVAS - (tip ? tip.x * k : 0)}
            y={pointer.y * CSS_TO_CANVAS - (tip ? tip.y * k : 0)}
            press={pointer.press}
            size={size}
          />
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
