/**
 * Builds safe HTML for the PlantUML custom editor Webview (syntax colouring).
 * Must escape all user text; only emits fixed class names on spans.
 */

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const SPAN = (cls: string, inner: string) => `<span class="${cls}">${inner}</span>`;

/** One line: full-line comment or tokenised. */
export function highlightPlantumlLine(line: string): string {
  const t = line.trimStart();
  if (t.startsWith("'")) {
    return SPAN("puml-cmt", escapeHtml(line));
  }
  return highlightLineTokens(line);
}

function highlightLineTokens(line: string): string {
  let i = 0;
  let out = "";
  const n = line.length;

  while (i < n) {
    const rest = line.slice(i);

    const ws = rest.match(/^\s+/);
    if (ws) {
      out += escapeHtml(ws[0]);
      i += ws[0].length;
      continue;
    }

    const str = rest.match(/^"(?:\\.|[^"\\])*"/);
    if (str) {
      out += SPAN("puml-str", escapeHtml(str[0]));
      i += str[0].length;
      continue;
    }

    const longKw = rest.match(
      /^(top\s+to\s+bottom\s+direction|left\s+to\s+right\s+direction)\b/i
    );
    if (longKw) {
      out += SPAN("puml-kw", escapeHtml(longKw[0]));
      i += longKw[0].length;
      continue;
    }

    const bangLong = rest.match(
      /^!(?:includeurl|include|import|define|undef|if|ifdef|ifndef|else|endif|enddef|theme|pragma|version)\b/i
    );
    if (bangLong) {
      out += SPAN("puml-dir", escapeHtml(bangLong[0]));
      i += bangLong[0].length;
      continue;
    }

    if (rest.startsWith("!")) {
      const m = rest.match(/^!\w+/);
      if (m) {
        out += SPAN("puml-dir", escapeHtml(m[0]));
        i += m[0].length;
        continue;
      }
    }

    const at = rest.match(/^@(start|end)[a-z]*/i);
    if (at) {
      out += SPAN("puml-at", escapeHtml(at[0]));
      i += at[0].length;
      continue;
    }

    const arr = rest.match(/^(->>|<--|-->|->|==+>|[.]{2,}>?|(?:\|)?\|?[\]>]{1,2})/);
    if (arr) {
      out += SPAN("puml-arrow", escapeHtml(arr[0]));
      i += arr[0].length;
      continue;
    }

    const kw = rest.match(
      /^(title|caption|skinparam|participant|actor|boundary|control|entity|database|collections|queue|alt|else|end|opt|loop|par|break|critical|group|note|floating\s+note|hnote|rnote|activate|deactivate|package|namespace|class|interface|enum|abstract|newpage|scale|rotate|autonumber|fork|again|partition|ref|return|together|legend|endlegend|header|endheader|footer|endfooter|hide|show|remove|restore|usecase|extends|implements|static|as)\b/i
    );
    if (kw) {
      out += SPAN("puml-kw", escapeHtml(kw[0]));
      i += kw[0].length;
      continue;
    }

    const num = rest.match(/^\d+(?:\.\d+)?\b/);
    if (num) {
      out += SPAN("puml-num", escapeHtml(num[0]));
      i += num[0].length;
      continue;
    }

    out += escapeHtml(rest[0]);
    i += 1;
  }

  return out;
}

/** Full document → HTML (use `<br/>` between lines for `<pre>` block). */
export function highlightPlantumlToHtml(text: string): string {
  if (text.length === 0) {
    return "<br/>";
  }
  const lines = text.split(/\n/);
  return lines.map(highlightPlantumlLine).join("<br/>");
}
