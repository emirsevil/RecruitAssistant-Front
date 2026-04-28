"use client"

import { useEffect, useRef } from "react"

/**
 * Block all forms of navigation away from the current page while `enabled` is true.
 *
 * Covers (Next.js App Router has no built-in `router.events`):
 *  1. Tab close / hard refresh — native `beforeunload` dialog
 *  2. Browser back / forward — `popstate` listener with `history.pushState` re-anchor
 *  3. <Link> clicks (and any anchor click) — capture-phase document-level click handler
 *  4. Programmatic `router.push/replace` from third-party code — patched at runtime
 *
 * On any in-app navigation attempt, `requestExit(href)` is awaited.
 *  - Resolve `true` → navigation proceeds (we run `window.location.href = href`)
 *  - Resolve `false` → user is kept on the page
 */
export function useNavigationGuard({
  enabled,
  requestExit,
}: {
  enabled: boolean
  requestExit: (target: string) => Promise<boolean>
}) {
  // Keep the latest requestExit in a ref so listeners don't get stale closures.
  const requestExitRef = useRef(requestExit)
  useEffect(() => {
    requestExitRef.current = requestExit
  }, [requestExit])

  useEffect(() => {
    if (!enabled) return

    // ── 1. beforeunload (refresh / tab close / window close) ─────────────
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      // Returning a string is required for legacy browsers; modern browsers
      // show a generic "Leave site?" dialog regardless of the returned text.
      e.returnValue = ""
      return ""
    }
    window.addEventListener("beforeunload", handleBeforeUnload)

    // ── 2. popstate (browser back / forward) ─────────────────────────────
    // Push a sentinel state so the next back press fires popstate while
    // keeping the user visually on the same URL.
    const sentinelUrl = window.location.href
    window.history.pushState({ __interviewGuard: true }, "", sentinelUrl)

    const handlePopState = async () => {
      // Re-anchor immediately so we don't lose the current URL while waiting
      window.history.pushState({ __interviewGuard: true }, "", sentinelUrl)
      const ok = await requestExitRef.current(document.referrer || "/")
      if (ok) {
        // Tear down the guard so the actual back works
        window.removeEventListener("beforeunload", handleBeforeUnload)
        window.removeEventListener("popstate", handlePopState)
        window.history.back()
      }
    }
    window.addEventListener("popstate", handlePopState)

    // ── 3. Link clicks ───────────────────────────────────────────────────
    const handleClick = async (e: MouseEvent) => {
      // Ignore modifier-clicks and non-primary buttons (open in new tab etc.)
      if (e.defaultPrevented) return
      if (e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      const anchor = (e.target as HTMLElement | null)?.closest("a") as
        | HTMLAnchorElement
        | null
      if (!anchor) return

      const href = anchor.getAttribute("href")
      if (!href) return
      if (href.startsWith("#")) return // in-page anchor
      if (anchor.target && anchor.target !== "_self") return
      // Skip absolute external links to a different origin
      try {
        const url = new URL(href, window.location.origin)
        if (url.origin !== window.location.origin) return
        // Same-page link — let it through
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search &&
          url.hash
        ) {
          return
        }

        e.preventDefault()
        e.stopPropagation()
        const ok = await requestExitRef.current(url.pathname + url.search + url.hash)
        if (ok) {
          window.removeEventListener("beforeunload", handleBeforeUnload)
          window.removeEventListener("popstate", handlePopState)
          window.location.href = url.pathname + url.search + url.hash
        }
      } catch {
        /* ignore malformed URLs */
      }
    }
    document.addEventListener("click", handleClick, true)

    // ── 4. Programmatic router calls (history.pushState / replaceState) ──
    // Next.js App Router uses these under the hood. We intercept them so
    // even router.push() from a button is gated by requestExit.
    const originalPush = window.history.pushState
    const originalReplace = window.history.replaceState
    let suppressIntercept = false

    const intercept = (method: typeof originalPush, label: string) =>
      function patched(this: History, ...args: Parameters<typeof originalPush>) {
        const [, , urlArg] = args
        const url = typeof urlArg === "string" ? urlArg : urlArg?.toString()

        // Allow our own sentinel re-anchors (state.__interviewGuard is true)
        const state = args[0] as { __interviewGuard?: boolean } | null
        if (state && state.__interviewGuard) {
          return method.apply(this, args)
        }
        if (suppressIntercept) {
          return method.apply(this, args)
        }
        if (!url) return method.apply(this, args)

        try {
          const u = new URL(url, window.location.href)
          if (
            u.origin === window.location.origin &&
            u.pathname === window.location.pathname &&
            u.search === window.location.search
          ) {
            // Same URL — likely an internal scroll/state push, let it through
            return method.apply(this, args)
          }
        } catch {}

        ;(async () => {
          const ok = await requestExitRef.current(url)
          if (ok) {
            suppressIntercept = true
            window.removeEventListener("beforeunload", handleBeforeUnload)
            window.removeEventListener("popstate", handlePopState)
            method.apply(window.history, args)
            suppressIntercept = false
          }
        })()
      }

    window.history.pushState = intercept(originalPush, "push") as typeof window.history.pushState
    window.history.replaceState = intercept(originalReplace, "replace") as typeof window.history.replaceState

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("popstate", handlePopState)
      document.removeEventListener("click", handleClick, true)
      window.history.pushState = originalPush
      window.history.replaceState = originalReplace
    }
  }, [enabled])
}
