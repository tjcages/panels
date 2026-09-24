import { Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'

import { CANVAS, ZOOM, frameOn, inside, type CameraState } from './camera'
import { Footage, css, type CursorTrack } from './footage'
import { entrance } from './motion'
import type { Scene } from './scenes'
import { Card, INTER, INK, MONO, ORANGE, PAPER, Words } from './title'

import revealTrack from '../public/footage/reveal.cursor.json'
import slidersTrack from '../public/footage/sliders.cursor.json'
import colorTrack from '../public/footage/color.cursor.json'
import backdropTrack from '../public/footage/backdrop.cursor.json'
import collectionTrack from '../public/footage/collection.cursor.json'
import floatTrack from '../public/footage/float.cursor.json'


export const PARTS: string[] = []

/** On-screen lines, shared with the reading-hold check in Root. */
export const LINES = {
  hook: 'Tune any React state, live.',
  prod: 'Compiles out of production.',
  end: 'Panels npm install @tjcages/panels',
} as const

const SCREEN = { left: 0, top: 0, width: CANVAS.width, height: CANVAS.height }

/** Centre a CSS-pixel point of the recording at a tier, kept on screen. */
function on(x: number, y: number, scale: number): CameraState {
  const p = css(x, y)
  return frameOn(inside(p, scale, SCREEN), scale)
}

const tracks = {
  reveal: revealTrack as CursorTrack,
  sliders: slidersTrack as CursorTrack,
  color: colorTrack as CursorTrack,
  backdrop: backdropTrack as CursorTrack,
  collection: collectionTrack as CursorTrack,
  float: floatTrack as CursorTrack,
}

// ——— Text ———

function Hook() {
  return (
    <Card>
      <Words text={LINES.hook} size={104} accent="live" />
    </Card>
  )
}

function Prod() {
  return (
    <Card background="#0d0d0f">
      <Words text={LINES.prod} size={104} color="#f2f2f2" accent="production" />
    </Card>
  )
}

function End() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const mark = entrance(frame, fps, 0)
  const chip = entrance(frame, fps, 10)
  return (
    <Card background={PAPER} drift={[0, 110]}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 30,
          opacity: mark.opacity,
          transform: `translateY(${mark.translateY * 2}px)`,
        }}
      >
        <Img src={staticFile('logo.svg')} style={{ width: 118, height: 118 }} />
        <span
          style={{
            fontFamily: INTER,
            fontWeight: 600,
            fontSize: 132,
            letterSpacing: '-0.045em',
            color: INK,
          }}
        >
          Panels
        </span>
      </div>
      <div
        style={{
          marginTop: 18,
          opacity: chip.opacity,
          transform: `translateY(${chip.translateY * 1.5}px)`,
          fontFamily: MONO,
          fontWeight: 500,
          fontSize: 40,
          color: '#e8e8e8',
          background: '#1c1c1c',
          borderRadius: 16,
          padding: '22px 36px',
          boxShadow: '0 1px 2px rgb(0 0 0 / 0.28), 0 12px 32px rgb(0 0 0 / 0.22)',
        }}
      >
        <span style={{ color: ORANGE }}>$</span> npm install @tjcages/panels
      </div>
    </Card>
  )
}

// ——— Product footage ———
// Geometry is measured from the capture fixture at 1440x810 CSS pixels:
// panel 1064,182 360x447; Amplitude row y 289; Lines row y 315; Tint swatch
// 1088,418; popover 1076..1300 x 436..802; Backdrop toggle 1239..1412 x 452;
// Add Ribbon 1372,535.

// Footage frame each scene starts on, and the scene frame of its click.
const REVEAL_IN = 14
const AMP_IN = 22
const LINES_IN = 104
const COLOR_IN = 24
const BACKDROP_IN = 14
const BACKDROP_CLICK = 27
const COLLECTION_IN = 10
const COLLECTION_CLICK = 33
const FLOAT_IN = 10

/** Waves alone, then ⌘⌥D: the panel arrives with its own entrance. */
function Reveal() {
  return (
    <Footage
      clip="reveal"
      track={tracks.reveal}
      offset={REVEAL_IN}
      camera={on(720, 405, ZOOM.BASE)}
      moves={[{ start: 0, duration: 84, to: on(900, 405, 1.12), ease: 'drift' }]}
    />
  )
}

/** Amplitude drag, filmed close enough to read the value box. */
function Amplitude() {
  return (
    <Footage
      clip="sliders"
      track={tracks.sliders}
      offset={AMP_IN}
      camera={on(1130, 318, ZOOM.CLOSE * 0.94)}
      moves={[{ start: 0, duration: 64, to: on(1150, 312, ZOOM.CLOSE), ease: 'standard' }]}
    />
  )
}

/** Lines drag at PUSH: the field packs denser beside the panel. */
function Lines() {
  return (
    <Footage
      clip="sliders"
      track={tracks.sliders}
      offset={LINES_IN}
      camera={on(930, 420, ZOOM.PUSH * 0.93)}
      moves={[{ start: 0, duration: 78, to: on(960, 400, ZOOM.PUSH), ease: 'standard' }]}
    />
  )
}

/** Tint swatch → library → pink. */
function Colour() {
  return (
    <Footage
      clip="color"
      track={tracks.color}
      offset={COLOR_IN}
      camera={on(1010, 540, ZOOM.PUSH * 0.94)}
      moves={[
        // The whole popover fits at PUSH; after the pick it closes, and the
        // camera closes in on the recoloured row and field.
        { start: 0, duration: 62, to: on(1060, 540, ZOOM.PUSH), ease: 'standard' },
        { start: 62, duration: 38, to: on(1113, 546, ZOOM.CLOSE), ease: 'standard' },
      ]}
    />
  )
}

/** Close on the Backdrop toggle, then pull out as the page goes dark. */
function Backdrop() {
  return (
    <Footage
      clip="backdrop"
      track={tracks.backdrop}
      offset={BACKDROP_IN}
      camera={on(1300, 487, ZOOM.MACRO)}
      moves={[{ start: BACKDROP_CLICK + 4, duration: 40, to: on(720, 405, ZOOM.BASE * 1.06), ease: 'standard' }]}
    />
  )
}

/** Add Ribbon: a new row in the panel, a new band in the field. */
function Collection() {
  return (
    <Footage
      clip="collection"
      track={tracks.collection}
      offset={COLLECTION_IN}
      camera={on(1270, 520, ZOOM.CLOSE * 1.08)}
      moves={[
        { start: 0, duration: COLLECTION_CLICK + 6, to: on(1250, 520, ZOOM.CLOSE), ease: 'drift' },
        { start: COLLECTION_CLICK + 6, duration: 40, to: on(900, 480, ZOOM.PUSH * 0.9), ease: 'standard' },
      ]}
    />
  )
}

/** Grab the header and throw the panel to the far edge. */
function Float() {
  return (
    <Footage
      clip="float"
      track={tracks.float}
      offset={FLOAT_IN}
      camera={on(900, 405, 1.16)}
      moves={[{ start: 0, duration: 92, to: on(720, 405, ZOOM.BASE), ease: 'standard' }]}
    />
  )
}

export const SCENES: Scene[] = [
  { id: 'hook', beat: 'context', duration: 110, activity: 'reveal', tier: 'BASE', subject: 'title',
    motion: { from: 0, to: 90, tag: 'push-in' }, component: Hook },
  { id: 'reveal', beat: 'context', duration: 96, activity: 'entrance', tier: 'BASE', subject: 'page',
    motion: { from: 0, to: 84, tag: 'push-in' }, component: Reveal },
  { id: 'amplitude', beat: 'action', duration: 76, activity: 'interaction', tier: 'CLOSE', subject: 'sliders',
    motion: { from: 0, to: 64, tag: 'push-in' }, component: Amplitude },
  { id: 'lines', beat: 'action', duration: 84, activity: 'interaction', tier: 'PUSH', subject: 'field',
    motion: { from: 0, to: 78, tag: 'push-in' }, component: Lines },
  { id: 'color', beat: 'action', duration: 100, activity: 'interaction', tier: 'CLOSE', subject: 'color',
    motion: { from: 0, to: 100, tag: 'push-in' }, component: Colour },
  { id: 'backdrop', beat: 'action', duration: 74, activity: 'interaction', tier: 'MACRO', subject: 'toggle',
    motion: { from: BACKDROP_CLICK + 4, to: BACKDROP_CLICK + 44, tag: 'pull-out' }, component: Backdrop },
  { id: 'collection', beat: 'action', duration: 86, activity: 'interaction', tier: 'CLOSE', subject: 'ribbons',
    motion: { from: 0, to: COLLECTION_CLICK + 46, tag: 'pull-out' }, component: Collection },
  { id: 'float', beat: 'action', duration: 104, activity: 'interaction', tier: 'BASE', subject: 'panel',
    motion: { from: 0, to: 92, tag: 'pull-out' }, component: Float },
  { id: 'prod', beat: 'consequence', duration: 100, activity: 'reveal', tier: 'BASE', subject: 'title-prod',
    motion: { from: 0, to: 90, tag: 'push-in' }, component: Prod },
  { id: 'end', beat: 'consequence', duration: 120, activity: 'reveal', tier: 'BASE', subject: 'brand',
    motion: { from: 0, to: 110, tag: 'push-in' }, component: End },
]

export { CANVAS }
