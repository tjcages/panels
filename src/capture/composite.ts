/**
 * Composite capture helper (OFF-141).
 *
 * Draws canvas / ImageBitmap layers bottom-to-top onto a detached 2D canvas
 * and returns an encoded Blob. Hosts rasterize DOM overlays themselves (or
 * grab a WebGL frame via `ImageCapture`) and pass the results in; this module
 * does not walk the DOM.
 *
 * The first layer sets output aspect. `maxEdge`, when given, scales so the
 * longest output edge equals that pixel count. Later layers of a different
 * size are drawn to fill the output rect so the overlay covers the frame.
 */

export type CaptureLayer = CanvasImageSource

export type CompositeCaptureOptions = {
  /** Layers in paint order, bottom → top. The first layer sets output aspect. */
  layers: readonly CaptureLayer[]
  /** Longest output edge in px; preserves the base layer's aspect. */
  maxEdge?: number
  /** Encoded MIME type. Defaults to `image/png`. */
  mimeType?: string
  /** Encoder quality for lossy types (`image/jpeg`, `image/webp`). */
  quality?: number
}

export async function compositeCaptureFrame(
  options: CompositeCaptureOptions,
): Promise<Blob> {
  const { layers, maxEdge, mimeType = "image/png", quality } = options

  if (!layers.length) {
    throw new Error("compositeCaptureFrame requires at least one layer")
  }

  const base = layers[0]!
  const baseSize = intrinsicSize(base)
  if (baseSize.width < 1 || baseSize.height < 1) {
    throw new Error("compositeCaptureFrame base layer has no intrinsic size")
  }

  const output = outputSize(baseSize.width, baseSize.height, maxEdge)
  const canvas = createCompositeCanvas(output.width, output.height)
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("compositeCaptureFrame could not create a 2D canvas context")
  }

  for (const layer of layers) {
    const size = intrinsicSize(layer)
    if (size.width < 1 || size.height < 1) continue
    ctx.drawImage(layer, 0, 0, output.width, output.height)
  }

  return encodeCanvas(canvas, mimeType, quality)
}

function createCompositeCanvas(
  width: number,
  height: number,
): HTMLCanvasElement {
  if (typeof document === "undefined") {
    throw new Error(
      "compositeCaptureFrame requires a document (browser/DOM environment)",
    )
  }
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  return canvas
}

function outputSize(
  baseWidth: number,
  baseHeight: number,
  maxEdge: number | undefined,
): { width: number; height: number } {
  if (maxEdge === undefined) {
    return {
      width: Math.max(1, Math.round(baseWidth)),
      height: Math.max(1, Math.round(baseHeight)),
    }
  }
  if (!Number.isFinite(maxEdge) || maxEdge <= 0) {
    throw new Error("compositeCaptureFrame maxEdge must be a positive number")
  }

  const longest = Math.max(baseWidth, baseHeight)
  const scale = maxEdge / longest
  if (baseWidth >= baseHeight) {
    return {
      width: Math.round(maxEdge),
      height: Math.max(1, Math.round(baseHeight * scale)),
    }
  }
  return {
    width: Math.max(1, Math.round(baseWidth * scale)),
    height: Math.round(maxEdge),
  }
}

function intrinsicSize(layer: CaptureLayer): { width: number; height: number } {
  if (isHtmlVideo(layer)) {
    return { width: layer.videoWidth, height: layer.videoHeight }
  }
  if (isHtmlImage(layer)) {
    return {
      width: layer.naturalWidth || layer.width,
      height: layer.naturalHeight || layer.height,
    }
  }
  if (isSvgImage(layer)) {
    return {
      width: layer.width.baseVal.value,
      height: layer.height.baseVal.value,
    }
  }
  if (isVideoFrame(layer)) {
    return { width: layer.displayWidth, height: layer.displayHeight }
  }
  return { width: layer.width, height: layer.height }
}

function isHtmlVideo(layer: CaptureLayer): layer is HTMLVideoElement {
  return typeof HTMLVideoElement !== "undefined" && layer instanceof HTMLVideoElement
}

function isHtmlImage(layer: CaptureLayer): layer is HTMLImageElement {
  return typeof HTMLImageElement !== "undefined" && layer instanceof HTMLImageElement
}

function isSvgImage(layer: CaptureLayer): layer is SVGImageElement {
  return typeof SVGImageElement !== "undefined" && layer instanceof SVGImageElement
}

function isVideoFrame(layer: CaptureLayer): layer is VideoFrame {
  return typeof VideoFrame !== "undefined" && layer instanceof VideoFrame
}

function encodeCanvas(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number | undefined,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob || blob.size === 0) {
          reject(
            new Error(
              `compositeCaptureFrame failed to encode as ${mimeType}`,
            ),
          )
          return
        }
        resolve(blob)
      },
      mimeType,
      quality,
    )
  })
}
