import {
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  canEncodeVideo,
} from "mediabunny"
import { getPanelRecordFrame } from "../hooks/capture-registry"

export type WebCodecsMp4Recorder = {
  stop: () => Promise<Blob>
  abort: () => Promise<void>
}

const TARGET_FPS = 60
const FRAME_DURATION = 1 / TARGET_FPS

function evenDimension(n: number): number {
  const rounded = Math.max(2, Math.round(n))
  return rounded % 2 === 0 ? rounded : rounded + 1
}

function bitrateForCanvas(width: number, height: number): number {
  const megapixels = (width * height) / 1_000_000
  return Math.round(
    Math.min(80_000_000, Math.max(24_000_000, megapixels * 12_000_000)),
  )
}

/** True when WebCodecs can encode H.264 (AVC) for MP4. */
export async function canRecordWebCodecsMp4(
  width: number,
  height: number,
): Promise<boolean> {
  if (typeof VideoEncoder === "undefined") return false
  try {
    return await canEncodeVideo("avc", {
      width: evenDimension(width),
      height: evenDimension(height),
    })
  } catch {
    return false
  }
}

/**
 * Live-record a canvas to H.264 MP4 via WebCodecs + Mediabunny.
 *
 * Before each encode, asks the host (via `registerPanelRecordFrame`) to
 * paint one composite frame — same sync model as GIF capture. That avoids
 * racing a continuous host rAF against the encoder (washed / dropped frames).
 *
 * Backpressured: each frame is encoded before the next is scheduled.
 * Wall-clock timestamps keep duration correct when frames are dropped.
 */
export async function startWebCodecsMp4Recording(
  canvas: HTMLCanvasElement,
): Promise<WebCodecsMp4Recorder> {
  const width = evenDimension(canvas.width)
  const height = evenDimension(canvas.height)
  if (width < 2 || height < 2) {
    throw new Error("Canvas has no dimensions yet")
  }

  const target = new BufferTarget()
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: "in-memory" }),
    target,
  })

  const videoSource = new CanvasSource(canvas, {
    codec: "avc",
    bitrate: bitrateForCanvas(width, height),
    latencyMode: "realtime",
    keyFrameInterval: 1,
    sizeChangeBehavior: "passThrough",
  })

  output.addVideoTrack(videoSource)
  await output.start()

  let lastTimestamp = -FRAME_DURATION
  let frameCount = 0
  let capturing = true
  let aborted = false
  let rafId = 0
  let loopPromise: Promise<void> = Promise.resolve()
  const startedAt = performance.now()

  const paintHostFrame = async () => {
    const paint = getPanelRecordFrame()
    if (!paint) return
    await paint()
  }

  const captureOne = async () => {
    if (aborted || !capturing) return

    await paintHostFrame()
    if (aborted || !capturing) return

    const timestamp = Math.max(
      lastTimestamp + FRAME_DURATION * 0.5,
      (performance.now() - startedAt) / 1000,
    )
    const duration = Math.max(FRAME_DURATION * 0.5, timestamp - lastTimestamp)
    lastTimestamp = timestamp
    frameCount += 1

    try {
      await videoSource.add(timestamp, duration)
    } catch {
      // Drop failed frames rather than aborting the recording.
    }
  }

  const pump = () => {
    if (!capturing || aborted) return
    loopPromise = captureOne().finally(() => {
      if (!capturing || aborted) return
      rafId = requestAnimationFrame(pump)
    })
  }
  rafId = requestAnimationFrame(pump)

  return {
    stop: async () => {
      if (aborted) return new Blob([], { type: "video/mp4" })

      capturing = false
      cancelAnimationFrame(rafId)
      await loopPromise

      const endTimestamp = Math.max(
        lastTimestamp + FRAME_DURATION,
        (performance.now() - startedAt) / 1000,
      )
      if (frameCount === 0) {
        await paintHostFrame()
        await videoSource.add(0, Math.max(FRAME_DURATION, endTimestamp))
      } else if (endTimestamp > lastTimestamp + FRAME_DURATION * 0.25) {
        try {
          await paintHostFrame()
          await videoSource.add(
            endTimestamp,
            Math.max(FRAME_DURATION, endTimestamp - lastTimestamp),
          )
        } catch {
          // Final frame is best-effort.
        }
      }

      await output.finalize()
      const buffer = target.buffer
      if (!buffer || buffer.byteLength === 0) {
        throw new Error("Recording was empty")
      }
      return new Blob([buffer], { type: "video/mp4" })
    },
    abort: async () => {
      aborted = true
      capturing = false
      cancelAnimationFrame(rafId)
      try {
        await output.cancel()
      } catch {
        // Already finalized / cancelled.
      }
    },
  }
}
