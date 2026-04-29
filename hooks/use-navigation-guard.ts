"use client"

import { useEffect, useRef } from "react"

/**
 * Block all forms of navigation away from the current page while `enabled` is true.
 *
 * Covers (Next.js App Router has no built-in `router.events`):
 *  1. Tab close / hard refresh — native `beforeunload` dialog
 *  2. Browser back / forward — `popstate` listener with a `history.pushState` re-anchor
 *  3. <Link> clicks (and any anchor click) — capture-phase document-level click handler
 *  4. Programmatic `router.push/replace` from third-party code — patched at runtime
 *
 * On any in-app navigation attempt, `requestExit(href)` is awaited.
 *  - Resolve `true`  → guard tears itself down and the navigation proceeds via
 *                      `window.location.href = target` (a real navigation, so the
 *                      sentinel-state trick used to re-anchor the URL on popstate
 *                      can't trap us on the page we're trying to leave).
 *  - Resolve `false` → user is kept on the page.
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

    // Sentinel URL — re-anchored on popstate to keep the user visually on this page.
    const sentinelUrl = window.location.href

    // ── 1. beforeunload (refresh / tab close / window close) ─────────────
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      // Modern browsers ignore the message and show a generic confirm; the
      // returnValue assignment is what triggers the prompt.
      e.returnValue = ""
      return ""
    }

    // ── 2. popstate (browser back / forward) ─────────────────────────────
    const handlePopState = async () => {
      // Re-anchor immediately so we don't lose the current URL while waiting
      window.history.pushState({ __interviewGuard: true }, "", sentinelUrl)
      const ok = await requestExitRef.current("__back__")
      if (ok) {
        // Tear down everything before navigating, so the upcoming hard
        // navigation isn't intercepted by our own listeners again.
        teardown()
        // We don't reliably know where the user was trying to go (the back
        // button is generic). Fall back to the dashboard.
        window.location.href = "/dashboard"
      }
    }

    // ── 3. Link clicks ───────────────────────────────────────────────────
    const handleClick = async (e: MouseEvent) => {
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

      try {
        const url = new URL(href, window.location.origin)
        if (url.origin !== window.location.origin) return // external link
        // Same-page hash navigation — let it through
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search &&
          url.hash
        ) {
          return
        }

        e.preventDefault()
        e.stopPropagation()
        const targetPath = url.pathname + url.search + url.hash
        const ok = await requestExitRef.current(targetPath)
        if (ok) {
          teardown()
          window.location.href = targetPath
        }
      } catch {
        /* ignore malformed URLs */
      }
    }

    // ── 4. Programmatic router calls (history.pushState / replaceState) ──
    const originalPush = window.history.pushState
    const originalReplace = window.history.replaceState
    let suppressIntercept = false

    const intercept = (method: typeof originalPush) =>
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
            u.pathname === window.location.pathname
          ) {
            // Same pathname (only query/hash differ) — internal state update
            // (e.g. router.replace("/mock-interview?id=42")). Let it through;
            // we only want to intercept navigations to a different page.
            return method.apply(this, args)
          }
        } catch {}

        ;(async () => {
          const ok = await requestExitRef.current(url)
          if (ok) {
            suppressIntercept = true
            teardown()
            // Real navigation so we actually leave the page.
            window.location.href = url
          }
        })()
      }

    // ── teardown ─────────────────────────────────────────────────────────
    const teardown = () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("popstate", handlePopState)
      document.removeEventListener("click", handleClick, true)
      window.history.pushState = originalPush
      window.history.replaceState = originalReplace
    }

    // ── activate ─────────────────────────────────────────────────────────
    window.addEventListener("beforeunload", handleBeforeUnload)
    // Push a state so the next back press fires popstate while keeping the URL.
    window.history.pushState({ __interviewGuard: true }, "", sentinelUrl)
    window.addEventListener("popstate", handlePopState)
    document.addEventListener("click", handleClick, true)
    window.history.pushState = intercept(originalPush) as typeof window.history.pushState
    window.history.replaceState = intercept(originalReplace) as typeof window.history.replaceState

    return teardown
  }, [enabled])
}
