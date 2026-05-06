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

/**
 * Server uses Tectonic on Linux: no “Times New Roman” system fonts.
 * `fontspec` + \\setmainfont often fails there (undefined macros or missing fonts).
 * Rewrite to classic pdfLaTeX-style stack so compile-latex succeeds unchanged backend.
 */
export function rewriteFontspecForTectonic(latex: string): string {
  const hasFontspec =
    /\\usepackage\s*(\[[^\]]*\])?\s*\{\s*fontspec\s*\}/.test(latex) ||
    /\\setmainfont\s*(\[[^\]]*\])?\s*\{/.test(latex) ||
    /\\setsansfont\s*(\[[^\]]*\])?\s*\{/.test(latex) ||
    /\\setmonofont\s*(\[[^\]]*\])?\s*\{/.test(latex)

  if (!hasFontspec) return latex

  let s = latex
  s = s.replace(/\\usepackage\s*(\[[^\]]*\])?\s*\{\s*fontspec\s*\}\s*/g, "")
  s = s.replace(/\\setmainfont\s*(\[[^\]]*\])?\s*\{[^}]*\}\s*/g, "")
  s = s.replace(/\\setsansfont\s*(\[[^\]]*\])?\s*\{[^}]*\}\s*/g, "")
  s = s.replace(/\\setmonofont\s*(\[[^\]]*\])?\s*\{[^}]*\}\s*/g, "")
  s = s.replace(/\\defaultfontfeatures\s*(\[[^\]]*\])?\s*\{[^}]*\}\s*/g, "")

  if (/\\usepackage\s*(\[[^\]]*\])?\s*\{\s*mathptmx\s*\}/.test(s)) return s

  const insert =
    "\\usepackage[T1]{fontenc}\n" +
    "\\usepackage[utf8]{inputenc}\n" +
    "\\usepackage{mathptmx}\n"

  if (/\\documentclass[^\n]*\n/.test(s)) {
    return s.replace(/(\\documentclass[^\n]*\n)/, `$1${insert}`)
  }

  return s.replace(/(\\documentclass(?:\[[^\]]*\])?\{[^}]+\})/, `$1\n${insert}`)
}
