"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "../lib/cn"
import { embedPngDpi, printMaxEdgePx } from "../lib/png-dpi"
import {
  canRecordWebCodecsMp4,
  startWebCodecsMp4Recording,
  type WebCodecsMp4Recorder,
} from "../lib/webcodecs-mp4-recorder"
import {
  getShaderCapture,
  getShaderGifExport,
  getShaderRecordCanvas,
  getShaderRecordFrame,
  getShaderRecordPrepare,
  getShaderVideoExport,
  setShaderRecording,
  type ShaderVideoSession,
} from "../hooks/capture-registry"

const EXPORT_DPI = 300

const GIF_DURATION_OPTIONS = [2, 3, 5, 8] as const
const GIF_FPS_OPTIONS = [10, 12, 15] as const
const GIF_DEFAULT_DURATION_SEC = 3
const GIF_DEFAULT_FPS = 12

type ResPreset = {
  label: string
  maxEdge: number
  /** When set, included in export status / filename hints. */
  printHint?: string
}

/** GIF targets — longest edge. Kept well below PNG presets; GIFs grow fast. */
const GIF_RES_PRESETS: ResPreset[] = [
  { label: "720", maxEdge: 720 },
  { label: "1080", maxEdge: 1080 },
  { label: "1440", maxEdge: 1440 },
]
const GIF_DEFAULT_RES_INDEX = 0

/** Screen targets — pixel longest edge. */
const SCREEN_RES_PRESETS: ResPreset[] = [
  { label: "4K", maxEdge: 3840 },
  { label: "8K", maxEdge: 7680 },
  { label: "16K", maxEdge: 15360 },
]

/** Print targets — longest edge at 300 DPI. */
const PRINT_RES_PRESETS: ResPreset[] = [
  {
    label: "8″",
    maxEdge: printMaxEdgePx(8, 4.5, EXPORT_DPI),
    printHint: `8″ @ ${EXPORT_DPI}dpi`,
  },
  {
    label: "11″",
    maxEdge: printMaxEdgePx(11, 8.5, EXPORT_DPI),
    printHint: `11″ @ ${EXPORT_DPI}dpi`,
  },
  {
    label: "16″",
    maxEdge: printMaxEdgePx(16, 9, EXPORT_DPI),
    printHint: `16″ @ ${EXPORT_DPI}dpi`,
  },
  {
    label: "24″",
    maxEdge: printMaxEdgePx(24, 13.5, EXPORT_DPI),
    printHint: `24″ @ ${EXPORT_DPI}dpi`,
  },
]

const RES_PRESETS: ResPreset[] = [
  ...SCREEN_RES_PRESETS,
  ...PRINT_RES_PRESETS,
]

async function withExportDpi(blob: Blob): Promise<Blob> {
  return embedPngDpi(blob, EXPORT_DPI)
}

/**
 * Export the live shader as a PNG (copy to clipboard / download) or an MP4
 * video recording. The panel has no direct handle on the shader's WebGL
 * canvas, so we locate it heuristically: the largest <canvas> on the page is
 * the full-screen shader surface (color pickers etc. are tiny).
 */
function findShaderCanvas(): HTMLCanvasElement | null {
  let best: HTMLCanvasElement | null = null
  let bestArea = 0
  for (const c of Array.from(document.querySelectorAll("canvas"))) {
    const area = c.width * c.height
    if (area > bestArea) {
      best = c
      bestArea = area
    }
  }
  return best
}

/**
 * Read the canvas to a PNG blob. Primary path is captureStream + grabFrame,
 * which reads the composited output even when the WebGL context was created
 * WITHOUT preserveDrawingBuffer — so it "just works" on any shader page.
 * Falls back to toBlob (which needs preserveDrawingBuffer) if the ImageCapture
 * API is unavailable.
 */
async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const w = window as unknown as {
    ImageCapture?: new (track: MediaStreamTrack) => {
      grabFrame: () => Promise<ImageBitmap>
    }
  }
  try {
    if (typeof canvas.captureStream === "function" && w.ImageCapture) {
      const stream = canvas.captureStream()
      const track = stream.getVideoTracks()[0]
      if (track) {
        const cap = new w.ImageCapture(track)
        const bitmap = await cap.grabFrame()
        track.stop()
        const off = document.createElement("canvas")
        off.width = bitmap.width
        off.height = bitmap.height
        off.getContext("2d")?.drawImage(bitmap, 0, 0)
        const blob = await new Promise<Blob | null>((res) =>
          off.toBlob(res, "image/png"),
        )
        if (blob && blob.size > 0) return blob
      }
    }
  } catch {
    // fall through to direct read
  }
  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob(res, "image/png"),
  )
  if (!blob) throw new Error("Could not read the canvas")
  return blob
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}

/**
 * MediaRecorder fallback — prefer MP4 for Mac playback. Used only when
 * WebCodecs H.264 encoding is unavailable.
 */
function pickMediaRecorderFormat(): { mimeType: string; ext: string } {
  const candidates = [
    "video/mp4;codecs=avc1.640028",
    "video/mp4;codecs=avc1.42E01E",
    "video/mp4;codecs=avc1",
    "video/mp4",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ]
  if (typeof MediaRecorder !== "undefined") {
    for (const c of candidates) {
      if (MediaRecorder.isTypeSupported(c)) {
        return { mimeType: c, ext: c.startsWith("video/mp4") ? "mp4" : "webm" }
      }
    }
  }
  return { mimeType: "video/mp4", ext: "mp4" }
}

function videoBitrateForCanvas(canvas: HTMLCanvasElement): number {
  const megapixels = (canvas.width * canvas.height) / 1_000_000
  return Math.round(
    Math.min(80_000_000, Math.max(24_000_000, megapixels * 12_000_000)),
  )
}

function fileBase(name: string): string {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "shader"
  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19)
  return `${slug}-${stamp}`
}

function extensionForVideoBlob(blob: Blob): string {
  const type = blob.type.toLowerCase()
  if (type.includes("quicktime") || type.includes("mov")) return "mov"
  if (type.includes("webm")) return "webm"
  return "mp4"
}

function presetExportLabel(preset: ResPreset): string {
  return preset.printHint ?? preset.label
}

async function waitForCompositeReady(): Promise<HTMLCanvasElement | null> {
  return new Promise((resolve) => {
    const started = performance.now()
    const tick = () => {
      const canvas = getShaderRecordCanvas() ?? findShaderCanvas()
      // Prefer the host record canvas once it exists. Pixel content is painted
      // on demand via registerShaderRecordFrame (WebCodecs) — don't require
      // a continuous composite loop to have already filled it.
      if (canvas && (getShaderRecordCanvas() || canvas.width > 2)) {
        // Give ThemeFog ~2 frames to apply opaque clear after data-recording.
        requestAnimationFrame(() =>
          requestAnimationFrame(() => resolve(canvas)),
        )
        return
      }
      if (performance.now() - started > 5000) {
        resolve(canvas)
        return
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}

export function ControlExport({ name = "shader" }: { name?: string }) {
  const [status, setStatus] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [resIndex, setResIndex] = useState(0) // default 4K
  const [busy, setBusy] = useState(false)
  const [gifBusy, setGifBusy] = useState(false)
  const [gifDurationSec, setGifDurationSec] = useState<number>(
    GIF_DEFAULT_DURATION_SEC,
  )
  const [gifFps, setGifFps] = useState<number>(GIF_DEFAULT_FPS)
  const [gifResIndex, setGifResIndex] = useState(GIF_DEFAULT_RES_INDEX)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const webCodecsRef = useRef<WebCodecsMp4Recorder | null>(null)
  const hostVideoRef = useRef<ShaderVideoSession | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)
  const stoppingRef = useRef(false)

  const flash = useCallback((msg: string, ms = 2400) => {
    setStatus(msg)
    window.setTimeout(() => setStatus((s) => (s === msg ? null : s)), ms)
  }, [])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const finishUi = useCallback(() => {
    setShaderRecording(false, { continuous: false })
    clearTimer()
    setRecording(false)
    setElapsed(0)
    stoppingRef.current = false
  }, [clearTimer])

  const copyImage = useCallback(async () => {
    setBusy(true)
    try {
      const preset = RES_PRESETS[resIndex]!
      const exportLabel = presetExportLabel(preset)
      const capture = getShaderCapture()
      if (capture) {
        flash(`Rendering ${exportLabel}…`, 30000)
        const blob = await withExportDpi(
          await capture({ maxEdge: preset.maxEdge }),
        )
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ])
          flash(`Image copied (${exportLabel}, ${EXPORT_DPI} DPI)`)
        } catch {
          downloadBlob(
            blob,
            `${fileBase(name)}-${preset.label.replace(/″/g, "in")}-${EXPORT_DPI}dpi.png`,
          )
          flash(`Clipboard blocked — downloaded PNG (${exportLabel})`)
        }
        return
      }
      const canvas = findShaderCanvas()
      if (!canvas) return flash("No shader canvas found")
      const blob = await withExportDpi(await canvasToPngBlob(canvas))
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ])
        flash(`Image copied (${EXPORT_DPI} DPI)`)
      } catch {
        downloadBlob(blob, `${fileBase(name)}-${EXPORT_DPI}dpi.png`)
        flash("Clipboard blocked — downloaded PNG")
      }
    } catch (e) {
      flash(e instanceof Error ? e.message : "Image export failed")
    } finally {
      setBusy(false)
    }
  }, [flash, name, resIndex])

  const saveImage = useCallback(async () => {
    setBusy(true)
    try {
      const preset = RES_PRESETS[resIndex]!
      const exportLabel = presetExportLabel(preset)
      const capture = getShaderCapture()
      if (capture) {
        flash(`Rendering ${exportLabel}…`, 30000)
        const blob = await withExportDpi(
          await capture({ maxEdge: preset.maxEdge }),
        )
        downloadBlob(
          blob,
          `${fileBase(name)}-${preset.label.replace(/″/g, "in")}-${EXPORT_DPI}dpi.png`,
        )
        flash(`PNG saved (${exportLabel}, ${EXPORT_DPI} DPI)`)
        return
      }
      const canvas = findShaderCanvas()
      if (!canvas) return flash("No shader canvas found")
      const blob = await withExportDpi(await canvasToPngBlob(canvas))
      downloadBlob(blob, `${fileBase(name)}-${EXPORT_DPI}dpi.png`)
      flash(`PNG downloaded (${EXPORT_DPI} DPI)`)
    } catch (e) {
      flash(e instanceof Error ? e.message : "Image export failed")
    } finally {
      setBusy(false)
    }
  }, [flash, name, resIndex])

  const startMediaRecorderFallback = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (
        typeof canvas.captureStream !== "function" ||
        typeof MediaRecorder === "undefined"
      ) {
        flash("Recording not supported here")
        setShaderRecording(false, { continuous: false })
        return
      }

      // MediaRecorder needs a continuously updating canvas.
      setShaderRecording(true, { continuous: true })
      const stream = canvas.captureStream(60)
      streamRef.current = stream
      const { mimeType, ext } = pickMediaRecorderFormat()
      const videoBitsPerSecond = videoBitrateForCanvas(canvas)
      let rec: MediaRecorder
      try {
        rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond })
      } catch {
        try {
          rec = new MediaRecorder(stream, { videoBitsPerSecond })
        } catch {
          rec = new MediaRecorder(stream)
        }
      }
      chunksRef.current = []
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        chunksRef.current = []
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        mediaRecorderRef.current = null
        finishUi()
        if (blob.size > 0) {
          downloadBlob(blob, `${fileBase(name)}.${ext}`)
          flash(`Video saved (.${ext})`)
        } else {
          flash("Recording was empty")
        }
      }
      mediaRecorderRef.current = rec
      rec.start(1000)
      setRecording(true)
      const startedAt = performance.now()
      setElapsed(0)
      timerRef.current = window.setInterval(() => {
        setElapsed((performance.now() - startedAt) / 1000)
      }, 100)
    },
    [finishUi, flash, name],
  )

  const stopRecording = useCallback(async () => {
    if (stoppingRef.current) return
    stoppingRef.current = true

    const host = hostVideoRef.current
    if (host) {
      hostVideoRef.current = null
      clearTimer()
      setRecording(false)
      flash("Encoding video…", 60000)
      try {
        const blob = await host.stop()
        finishUi()
        if (blob.size > 0) {
          const ext = extensionForVideoBlob(blob)
          downloadBlob(blob, `${fileBase(name)}.${ext}`)
          flash(`Video saved (.${ext})`)
        } else {
          flash("Recording was empty")
        }
      } catch (e) {
        finishUi()
        flash(e instanceof Error ? e.message : "Video encode failed")
      }
      return
    }

    const web = webCodecsRef.current
    if (web) {
      webCodecsRef.current = null
      // Drop recording mode immediately so ThemeFog opaque-clear work
      // stops while we finalize the MP4 (host paints only on demand).
      setShaderRecording(false, { continuous: false })
      clearTimer()
      setRecording(false)
      flash("Encoding MP4…", 60000)
      try {
        const blob = await web.stop()
        finishUi()
        if (blob.size > 0) {
          downloadBlob(blob, `${fileBase(name)}.mp4`)
          flash("Video saved (.mp4)")
        } else {
          flash("Recording was empty")
        }
      } catch (e) {
        finishUi()
        flash(e instanceof Error ? e.message : "MP4 encode failed")
      }
      return
    }

    const rec = mediaRecorderRef.current
    if (rec && rec.state !== "inactive") {
      rec.stop()
      return
    }
    finishUi()
  }, [clearTimer, finishUi, flash, name])

  const startRecording = useCallback(async () => {
    // Prefer host-owned video (same capture path as GIF/PNG). Panel is
    // just the start/stop button in that case.
    const hostVideo = getShaderVideoExport()
    if (hostVideo) {
      try {
        hostVideoRef.current = await hostVideo()
        setRecording(true)
        const startedAt = performance.now()
        setElapsed(0)
        timerRef.current = window.setInterval(() => {
          setElapsed((performance.now() - startedAt) / 1000)
        }, 100)
        return
      } catch (e) {
        hostVideoRef.current = null
        return flash(
          e instanceof Error ? e.message : "Video recording failed to start",
        )
      }
    }

    const prepare = getShaderRecordPrepare()
    if (prepare) {
      try {
        await prepare()
      } catch (e) {
        return flash(e instanceof Error ? e.message : "Recording prep failed")
      }
    }

    // Legacy path: panel-owned WebCodecs / MediaRecorder against a host canvas.
    setShaderRecording(true, { continuous: false })
    const canvas = await waitForCompositeReady()
    if (!canvas || canvas.width <= 0 || canvas.height <= 0) {
      setShaderRecording(false, { continuous: false })
      return flash("No shader canvas found")
    }

    const paint = getShaderRecordFrame()
    if (paint) await paint()

    const useWebCodecs = await canRecordWebCodecsMp4(
      canvas.width,
      canvas.height,
    )
    if (useWebCodecs) {
      try {
        webCodecsRef.current = await startWebCodecsMp4Recording(canvas)
        setRecording(true)
        const startedAt = performance.now()
        setElapsed(0)
        timerRef.current = window.setInterval(() => {
          setElapsed((performance.now() - startedAt) / 1000)
        }, 100)
        return
      } catch (e) {
        webCodecsRef.current = null
        flash(
          e instanceof Error
            ? `WebCodecs failed — falling back (${e.message})`
            : "WebCodecs failed — falling back",
          3200,
        )
      }
    }

    startMediaRecorderFallback(canvas)
  }, [flash, startMediaRecorderFallback])

  const exportGif = useCallback(async () => {
    const gifExport = getShaderGifExport()
    if (!gifExport) {
      return flash("GIF export not available")
    }

    const preset = GIF_RES_PRESETS[gifResIndex] ?? GIF_RES_PRESETS[0]!
    setGifBusy(true)
    const frames = Math.round(gifDurationSec * gifFps)
    flash(
      `Rendering GIF (${preset.label}p · ${frames} frames)…`,
      120000,
    )
    try {
      const blob = await gifExport({
        durationSec: gifDurationSec,
        fps: gifFps,
        maxEdge: preset.maxEdge,
        onProgress: (progress) => {
          flash(
            `Rendering GIF (${preset.label}p)… ${Math.round(progress * 100)}%`,
            120000,
          )
        },
      })
      downloadBlob(blob, `${fileBase(name)}-${preset.label}p.gif`)
      flash(`GIF saved (${preset.label}p)`)
    } catch (e) {
      flash(e instanceof Error ? e.message : "GIF export failed")
    } finally {
      setGifBusy(false)
    }
  }, [flash, gifDurationSec, gifFps, gifResIndex, name])

  // Tear down an in-flight recording if the panel unmounts.
  useEffect(() => {
    return () => {
      const host = hostVideoRef.current
      if (host) {
        hostVideoRef.current = null
        void host.stop().catch(() => {})
      }
      const web = webCodecsRef.current
      if (web) {
        webCodecsRef.current = null
        void web.abort()
      }
      const rec = mediaRecorderRef.current
      if (rec && rec.state !== "inactive") rec.stop()
      clearTimer()
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [clearTimer])

  const controlsLocked = busy || gifBusy || recording

  return (
    <div className="panel-export">
      <div className="panel-export-label">Export</div>
      <div className="panel-export-row">
        <button
          type="button"
          className="panel-action-btn"
          onClick={copyImage}
          disabled={controlsLocked}
        >
          Copy image
        </button>
        <button
          type="button"
          className="panel-action-btn"
          onClick={saveImage}
          disabled={controlsLocked}
        >
          {busy ? "Rendering…" : "Save PNG"}
        </button>
      </div>
      <div
        className="panel-export-res-group"
        role="group"
        aria-label="PNG resolution"
      >
        <div className="panel-export-res panel-export-res-screen">
          {SCREEN_RES_PRESETS.map((preset, i) => (
            <button
              key={preset.label}
              type="button"
              className={cn(
                "panel-export-res-btn",
                i === resIndex && "panel-export-res-active",
              )}
              aria-pressed={i === resIndex}
              title={`${preset.maxEdge}px longest edge · ${EXPORT_DPI} DPI metadata`}
              onClick={() => setResIndex(i)}
              disabled={controlsLocked}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="panel-export-res panel-export-res-print">
          {PRINT_RES_PRESETS.map((preset, i) => {
            const index = SCREEN_RES_PRESETS.length + i
            return (
              <button
                key={preset.label}
                type="button"
                className={cn(
                  "panel-export-res-btn",
                  index === resIndex && "panel-export-res-active",
                )}
                aria-pressed={index === resIndex}
                title={
                  preset.printHint ??
                  `${preset.maxEdge}px longest edge · ${EXPORT_DPI} DPI metadata`
                }
                onClick={() => setResIndex(index)}
                disabled={controlsLocked}
              >
                {preset.label}
              </button>
            )
          })}
        </div>
      </div>
      <button
        type="button"
        className={cn("panel-action-btn", recording && "panel-export-rec")}
        onClick={
          recording
            ? () => void stopRecording()
            : () => void startRecording()
        }
        disabled={gifBusy || busy}
      >
        {recording ? (
          <>
            <span className="panel-export-dot" /> Stop recording ·{" "}
            {elapsed.toFixed(1)}s
          </>
        ) : (
          "Record video"
        )}
      </button>

      <div className="panel-export-gif">
        <div className="panel-export-gif-label">GIF</div>
        <div
          className="panel-export-gif-row"
          role="group"
          aria-label="GIF resolution"
        >
          {GIF_RES_PRESETS.map((preset, i) => (
            <button
              key={preset.label}
              type="button"
              className={cn(
                "panel-export-res-btn",
                i === gifResIndex && "panel-export-res-active",
              )}
              aria-pressed={i === gifResIndex}
              title={`${preset.maxEdge}px longest edge`}
              onClick={() => setGifResIndex(i)}
              disabled={controlsLocked}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="panel-export-gif-row" role="group" aria-label="GIF duration">
          {GIF_DURATION_OPTIONS.map((sec) => (
            <button
              key={sec}
              type="button"
              className={cn(
                "panel-export-res-btn",
                gifDurationSec === sec && "panel-export-res-active",
              )}
              aria-pressed={gifDurationSec === sec}
              onClick={() => setGifDurationSec(sec)}
              disabled={controlsLocked}
            >
              {sec}s
            </button>
          ))}
        </div>
        <div className="panel-export-gif-row" role="group" aria-label="GIF frame rate">
          {GIF_FPS_OPTIONS.map((fps) => (
            <button
              key={fps}
              type="button"
              className={cn(
                "panel-export-res-btn",
                gifFps === fps && "panel-export-res-active",
              )}
              aria-pressed={gifFps === fps}
              onClick={() => setGifFps(fps)}
              disabled={controlsLocked}
            >
              {fps} fps
            </button>
          ))}
        </div>
        <button
          type="button"
          className="panel-action-btn"
          onClick={() => void exportGif()}
          disabled={controlsLocked}
        >
          {gifBusy
            ? "Rendering GIF…"
            : `Export GIF · ${GIF_RES_PRESETS[gifResIndex]?.label ?? "720"}p · ${gifDurationSec}s @ ${gifFps}fps`}
        </button>
      </div>

      {status ? <div className="panel-status">{status}</div> : null}
    </div>
  )
}
