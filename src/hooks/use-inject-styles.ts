"use client"

import { useEffect } from "react"
import { colorPopoverStyles } from "../controls/color-popover"
import { gradientStopsStyles } from "../controls/gradient-stops"
import { stripeColorsTableStyles } from "../controls/stripe-colors-table"
import { PANEL_CSS, PANEL_STYLE_ID } from "../styles"

const FULL_CSS = PANEL_CSS + colorPopoverStyles + gradientStopsStyles + stripeColorsTableStyles

let injectedCss: string | null = null

/**
 * Inject the shader-dev stylesheet into `<head>`.
 * Updates the existing tag when PANEL_CSS changes (HMR / package bumps).
 */
export function useInjectPanelStyles(): void {
  useEffect(() => {
    if (typeof document === "undefined") return
    if (injectedCss === FULL_CSS) return

    let style = document.getElementById(PANEL_STYLE_ID) as HTMLStyleElement | null
    if (!style) {
      style = document.createElement("style")
      style.id = PANEL_STYLE_ID
      document.head.appendChild(style)
    }
    style.textContent = FULL_CSS
    injectedCss = FULL_CSS
  }, [])
}
