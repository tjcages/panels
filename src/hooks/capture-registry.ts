"use client"

/**
 * Optional high-resolution capture hook. The export panel has no handle on a
 * host / render surface, so a page (e.g. an r3f `<Canvas>`) can register a
 * function that re-renders the current frame at an arbitrary pixel size and
 * returns it as a PNG blob. When none is registered, the panel falls back to
 * reading the visible canvas at screen resolution.
 *
 * `maxEdge` is the requested longest-edge pixel count; the registrant is
 * expected to clamp it to the GPU's real limit and preserve aspect ratio.
 */
export type PanelCaptureFn = (opts: { maxEdge: number }) => Promise<Blob>
/** @deprecated Use PanelCaptureFn */
export type ShaderCaptureFn = PanelCaptureFn

export type PanelGifExportOptions = {
  durationSec: number
  fps: number
  maxEdge: number
  onProgress?: (progress: number) => void
}
/** @deprecated Use PanelGifExportOptions */
export type ShaderGifExportOptions = PanelGifExportOptions

export type PanelGifExportFn = (opts: PanelGifExportOptions) => Promise<Blob>
/** @deprecated Use PanelGifExportFn */
export type ShaderGifExportFn = PanelGifExportFn

/**
 * Host-owned video recording. The panel only starts/stops — capture + encode
 * live entirely in the host (same model as GIF export).
 */
export type PanelVideoSession = {
  stop: () => Promise<Blob>
}
/** @deprecated Use PanelVideoSession */
export type ShaderVideoSession = PanelVideoSession

export type PanelVideoExportFn = () => Promise<PanelVideoSession>
/** @deprecated Use PanelVideoExportFn */
export type ShaderVideoExportFn = PanelVideoExportFn

type PanelRecordCanvasGetter = () => HTMLCanvasElement | null
type PanelRecordPrepareFn = () => Promise<void>
/**
 * Host paints one composite frame into the record canvas. Called by the
 * WebCodecs recorder immediately before each encode so capture stays in sync
 * with the live scene (same idea as GIF frame capture).
 */
export type PanelRecordFrameFn = () => void | Promise<void>
/** @deprecated Use PanelRecordFrameFn */
export type ShaderRecordFrameFn = PanelRecordFrameFn

export type PanelRecordingOptions = {
  /**
   * When true, the host should continuously composite (MediaRecorder /
   * captureStream). WebCodecs uses per-frame `registerPanelRecordFrame`
   * instead and should leave this false.
   */
  continuous?: boolean
}
/** @deprecated Use PanelRecordingOptions */
export type ShaderRecordingOptions = PanelRecordingOptions

let current: PanelCaptureFn | null = null
let gifExport: PanelGifExportFn | null = null
let videoExport: PanelVideoExportFn | null = null
let recordCanvasGetter: PanelRecordCanvasGetter | null = null
let recordPrepare: PanelRecordPrepareFn | null = null
let recordFrame: PanelRecordFrameFn | null = null
let recording = false
let recordingContinuous = false
const captureListeners = new Set<() => void>()
const recordingListeners = new Set<
  (recording: boolean, opts: { continuous: boolean }) => void
>()

function notifyCaptureListeners() {
  for (const listener of captureListeners) listener()
}

function notifyRecordingListeners(next: boolean) {
  recording = next
  if (!next) recordingContinuous = false
  const opts = { continuous: recordingContinuous }
  for (const listener of recordingListeners) listener(next, opts)
}

export function registerPanelCapture(fn: PanelCaptureFn | null): () => void {
  current = fn
  notifyCaptureListeners()
  return () => {
    if (current === fn) {
      current = null
      notifyCaptureListeners()
    }
  }
}
/** @deprecated Use registerPanelCapture */
export const registerShaderCapture = registerPanelCapture

export function getPanelCapture(): PanelCaptureFn | null {
  return current
}
/** @deprecated Use getPanelCapture */
export const getShaderCapture = getPanelCapture

export function subscribePanelCapture(listener: () => void): () => void {
  captureListeners.add(listener)
  return () => captureListeners.delete(listener)
}
/** @deprecated Use subscribePanelCapture */
export const subscribeShaderCapture = subscribePanelCapture

export function registerPanelRecordCanvas(
  getter: PanelRecordCanvasGetter | null,
): () => void {
  recordCanvasGetter = getter
  return () => {
    if (recordCanvasGetter === getter) recordCanvasGetter = null
  }
}
/** @deprecated Use registerPanelRecordCanvas */
export const registerShaderRecordCanvas = registerPanelRecordCanvas

export function getPanelRecordCanvas(): HTMLCanvasElement | null {
  return recordCanvasGetter?.() ?? null
}
/** @deprecated Use getPanelRecordCanvas */
export const getShaderRecordCanvas = getPanelRecordCanvas

export function registerPanelRecordPrepare(
  fn: PanelRecordPrepareFn | null,
): () => void {
  recordPrepare = fn
  return () => {
    if (recordPrepare === fn) recordPrepare = null
  }
}
/** @deprecated Use registerPanelRecordPrepare */
export const registerShaderRecordPrepare = registerPanelRecordPrepare

export function getPanelRecordPrepare(): PanelRecordPrepareFn | null {
  return recordPrepare
}
/** @deprecated Use getPanelRecordPrepare */
export const getShaderRecordPrepare = getPanelRecordPrepare

export function registerPanelGifExport(
  fn: PanelGifExportFn | null,
): () => void {
  gifExport = fn
  return () => {
    if (gifExport === fn) gifExport = null
  }
}
/** @deprecated Use registerPanelGifExport */
export const registerShaderGifExport = registerPanelGifExport

export function getPanelGifExport(): PanelGifExportFn | null {
  return gifExport
}
/** @deprecated Use getPanelGifExport */
export const getShaderGifExport = getPanelGifExport

export function registerPanelVideoExport(
  fn: PanelVideoExportFn | null,
): () => void {
  videoExport = fn
  return () => {
    if (videoExport === fn) videoExport = null
  }
}
/** @deprecated Use registerPanelVideoExport */
export const registerShaderVideoExport = registerPanelVideoExport

export function getPanelVideoExport(): PanelVideoExportFn | null {
  return videoExport
}
/** @deprecated Use getPanelVideoExport */
export const getShaderVideoExport = getPanelVideoExport

export function registerPanelRecordFrame(
  fn: PanelRecordFrameFn | null,
): () => void {
  recordFrame = fn
  return () => {
    if (recordFrame === fn) recordFrame = null
  }
}
/** @deprecated Use registerPanelRecordFrame */
export const registerShaderRecordFrame = registerPanelRecordFrame

export function getPanelRecordFrame(): PanelRecordFrameFn | null {
  return recordFrame
}
/** @deprecated Use getPanelRecordFrame */
export const getShaderRecordFrame = getPanelRecordFrame

export function subscribePanelRecording(
  listener: (
    recording: boolean,
    opts: { continuous: boolean },
  ) => void,
): () => void {
  recordingListeners.add(listener)
  listener(recording, { continuous: recordingContinuous })
  return () => recordingListeners.delete(listener)
}
/** @deprecated Use subscribePanelRecording */
export const subscribeShaderRecording = subscribePanelRecording

export function setPanelRecording(
  active: boolean,
  opts?: PanelRecordingOptions,
): void {
  const nextContinuous = active ? !!opts?.continuous : false
  if (recording === active && recordingContinuous === nextContinuous) return
  recordingContinuous = nextContinuous
  notifyRecordingListeners(active)
}
/** @deprecated Use setPanelRecording */
export const setShaderRecording = setPanelRecording
