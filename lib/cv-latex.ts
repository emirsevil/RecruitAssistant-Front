/**
 * Older CV Studio builds saved the full generate-cv JSON body as latex_content.
 * Tectonic then saw line 1 like `{"latex":...` and failed with Undefined control sequence.
 * Coerce extracts the real LaTeX string without touching the backend or DB.
 */
export function coerceLatexFromStoredContent(raw: string, depth = 0): string {
  if (typeof raw !== "string" || depth > 4) return ""
  let s = raw.replace(/^\uFEFF/, "").trim()
  if (!s) return ""

  const tryParse = (text: string): string | null => {
    const t = text.trim()
    if (!t.startsWith("{") && !t.startsWith("[")) return null
    try {
      const parsed: unknown = JSON.parse(t)
      if (parsed === null || typeof parsed !== "object") return null
      if (Array.isArray(parsed)) return null
      const o = parsed as Record<string, unknown>
      const inner =
        (typeof o.latex === "string" && o.latex.trim() && o.latex) ||
        (typeof o.content === "string" && o.content.trim() && o.content) ||
        null
      return inner ?? null
    } catch {
      return null
    }
  }

  const inner = tryParse(s)
  if (inner !== null) return coerceLatexFromStoredContent(inner, depth + 1)

  return s
}
