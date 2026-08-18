"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"

type FieldErrorBoundaryProps = {
  children: ReactNode
  fieldKey: string
}

type FieldErrorBoundaryState = {
  hasError: boolean
  fieldKey: string
}

/**
 * Isolates a single control so a throw becomes an inline error row instead of
 * taking down the host app. Resets when `fieldKey` changes so a replacement
 * field can render again.
 */
export class FieldErrorBoundary extends Component<
  FieldErrorBoundaryProps,
  FieldErrorBoundaryState
> {
  state: FieldErrorBoundaryState = {
    hasError: false,
    fieldKey: this.props.fieldKey,
  }

  static getDerivedStateFromError(): Partial<FieldErrorBoundaryState> {
    return { hasError: true }
  }

  static getDerivedStateFromProps(
    props: FieldErrorBoundaryProps,
    state: FieldErrorBoundaryState,
  ): Partial<FieldErrorBoundaryState> | null {
    if (props.fieldKey !== state.fieldKey) {
      return { hasError: false, fieldKey: props.fieldKey }
    }
    return null
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Swallow — the fallback row is the recovery path. Never rethrow.
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="panel-field" role="alert">
          <div className="panel-field-description">
            Control failed ({this.props.fieldKey})
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
