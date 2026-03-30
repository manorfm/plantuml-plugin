import type { DiagramKind } from "./analyzeDiagram";
import { analyzeDiagramKind } from "./analyzeDiagram";
import {
  getThemeTokens,
  stereotypeSurfaceForName,
  type ThemeTokens,
  type VisualThemeId,
} from "./themes";

export type VisualPreambleOptions = {
  theme: VisualThemeId;
  semanticColors: boolean;
};

/**
 * Extrai o nome do primeiro `!theme …` no texto (PlantUML servidor).
 */
function firstPlantumlThemeName(source: string): string | undefined {
  const m = source.match(/!theme\s+([\w.-]+|"[^"]+"|'[^']+')/i);
  if (!m) {
    return undefined;
  }
  let name = m[1].trim();
  if (
    (name.startsWith('"') && name.endsWith('"')) ||
    (name.startsWith("'") && name.endsWith("'"))
  ) {
    name = name.slice(1, -1);
  }
  return name.toLowerCase();
}

/**
 * `!theme plain` **não** bloqueia o pipeline: o servidor desenha o baseline neutro e a extensão
 * pode ainda aplicar skinparams + SVG. Qualquer outro `!theme` (cerulean, etc.) assume controlo
 * visual do servidor — não misturar com o nosso bloco automático.
 */
export function hasNonPlainPlantumlTheme(source: string): boolean {
  if (!/!theme\b/i.test(source)) {
    return false;
  }
  const n = firstPlantumlThemeName(source);
  return n !== undefined && n !== "plain";
}

/**
 * O utilizador fixou espaçamento ou tipo de linha — não injectar **nodesep/ranksep/linetype** automáticos
 * (evita sobrepor o layout), mas **cores, fonte, sombras e estereótipos** aplicam-se na mesma.
 */
export function hasUserLayoutSkinparams(source: string): boolean {
  return (
    /\bskinparam\s+(nodesep|ranksep|dpi|packagePadding|componentPadding|rectanglePadding)\b/i.test(
      source
    ) || /\bskinparam\s+linetype\b/i.test(source)
  );
}

/**
 * Gera linhas PlantUML (skinparam) antes do corpo do diagrama.
 * Não inclui @startuml — o texto já deve ser o diagrama completo.
 */
export function buildVisualPreamble(
  source: string,
  options: VisualPreambleOptions
): string {
  if (options.theme === "none") {
    return "";
  }

  if (hasNonPlainPlantumlTheme(source)) {
    return "";
  }

  const includeLayout = !hasUserLayoutSkinparams(source);
  return emitVisualPreamble(source, options, includeLayout);
}

function emitVisualPreamble(
  source: string,
  options: VisualPreambleOptions,
  includeLayout: boolean
): string {
  const kind = analyzeDiagramKind(source);
  const t = getThemeTokens(options.theme, kind);
  if (!t) {
    return "";
  }

  const lines: string[] = [
    "' --- PlantUML Viewer: visual theme (auto) ---",
    includeLayout
      ? "' --- spacing + style ---"
      : "' --- style only (spacing from your file) ---",
    ...emitTypographicSkinparams(t, kind),
    `skinparam shadowing ${t.shadowing}`,
    `skinparam roundcorner ${t.roundcorner}`,
  ];

  if (includeLayout) {
    lines.push(`skinparam nodesep ${t.nodesep}`);
    lines.push(`skinparam ranksep ${t.ranksep}`);
    if (t.preferOrthogonal) {
      lines.push("skinparam linetype ortho");
    }
  }

  lines.push(`skinparam ArrowColor ${t.arrowColor}`);
  if (t.id !== "minimal") {
    lines.push("skinparam ArrowThickness 1");
  }

  lines.push(`skinparam stereotypeCBackgroundColor ${t.stereotypeLabelBg}`);
  lines.push(`skinparam stereotypeCFontColor ${t.stereotypeLabelFg}`);

  switch (kind) {
    case "sequence":
      lines.push(`skinparam ParticipantBackgroundColor ${t.participantFill}`);
      lines.push(`skinparam ActorBackgroundColor ${t.actorFill}`);
      lines.push(`skinparam DatabaseBackgroundColor ${t.databaseFill}`);
      lines.push(`skinparam BoundaryBackgroundColor ${t.boundaryFill}`);
      lines.push("skinparam ParticipantPadding 12");
      lines.push("skinparam BoxPadding 10");
      break;
    case "class":
    case "component":
    case "deployment":
      lines.push(`skinparam ClassBackgroundColor ${t.classFill}`);
      lines.push(`skinparam ClassBorderColor ${t.classBorder}`);
      lines.push(`skinparam ComponentBackgroundColor ${t.participantFill}`);
      lines.push(`skinparam ComponentBorderColor ${t.classBorder}`);
      lines.push(`skinparam PackageBackgroundColor ${t.classFill}`);
      lines.push(`skinparam PackageBorderColor ${t.packageBorder}`);
      lines.push(`skinparam CloudBackgroundColor ${t.boundaryFill}`);
      lines.push(`skinparam CloudBorderColor ${t.classBorder}`);
      lines.push(`skinparam NoteBackgroundColor ${t.classFill}`);
      lines.push(`skinparam NoteBorderColor ${t.packageBorder}`);
      break;
    default:
      lines.push(`skinparam DefaultBackgroundColor ${t.classFill}`);
      break;
  }

  lines.push(...stereotypeSkinparamBlocks(source, kind));

  if (options.semanticColors) {
    lines.push(...semanticSkinparamHints(source, kind, t));
  }

  return lines.join("\n");
}

function emitTypographicSkinparams(t: ThemeTokens, kind: DiagramKind): string[] {
  const f = `"${t.fontPrimary}"`;
  const out: string[] = [
    `skinparam defaultFontName ${f}`,
    `skinparam defaultFontSize ${t.fontSizeDefault}`,
    `skinparam defaultFontColor ${t.fontColorDefault}`,
    `skinparam ArrowFontName ${f}`,
    `skinparam ArrowFontSize ${t.fontSizeArrow}`,
    `skinparam ArrowFontColor ${t.fontColorArrow}`,
    `skinparam ArrowFontStyle normal`,
    `skinparam TitleFontName ${f}`,
    `skinparam TitleFontSize ${t.titleFontSize}`,
    `skinparam TitleFontColor ${t.titleFontColor}`,
    `skinparam LegendFontName ${f}`,
    `skinparam LegendFontSize ${Math.max(10, t.fontSizeDefault - 1)}`,
    `skinparam LegendFontColor ${t.fontColorDefault}`,
  ];

  switch (kind) {
    case "sequence":
      out.push(
        `skinparam ParticipantFontName ${f}`,
        `skinparam ParticipantFontSize ${t.fontSizeDefault}`,
        `skinparam ParticipantFontColor ${t.fontColorDefault}`,
        `skinparam MessageFontName ${f}`,
        `skinparam MessageFontSize ${t.fontSizeDefault}`,
        `skinparam MessageFontColor ${t.fontColorDefault}`
      );
      break;
    case "class":
    case "component":
    case "deployment":
      out.push(
        `skinparam ClassFontName ${f}`,
        `skinparam ClassFontSize ${t.componentFontSize}`,
        `skinparam ClassFontColor ${t.fontColorDefault}`,
        `skinparam ComponentFontName ${f}`,
        `skinparam ComponentFontSize ${t.componentFontSize}`,
        `skinparam ComponentFontColor ${t.fontColorDefault}`,
        `skinparam PackageFontName ${f}`,
        `skinparam PackageFontSize ${t.packageFontSize}`,
        `skinparam PackageFontColor ${t.fontColorDefault}`,
        `skinparam CloudFontName ${f}`,
        `skinparam CloudFontSize ${t.componentFontSize}`,
        `skinparam CloudFontColor ${t.fontColorDefault}`,
        `skinparam NoteFontName ${f}`,
        `skinparam NoteFontSize ${Math.max(10, t.fontSizeDefault - 1)}`,
        `skinparam NoteFontColor ${t.fontColorArrow}`
      );
      break;
    default:
      out.push(
        `skinparam ClassFontName ${f}`,
        `skinparam ClassFontSize ${t.componentFontSize}`,
        `skinparam ClassFontColor ${t.fontColorDefault}`
      );
      break;
  }

  return out;
}

const STEREOTYPE_NAME_RE = /<<([A-Za-z0-9][A-Za-z0-9_-]*)>>/g;
const MAX_STEREOTYPE_NAMES = 20;

function extractStereotypeNames(source: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  let m: RegExpExecArray | null;
  STEREOTYPE_NAME_RE.lastIndex = 0;
  while ((m = STEREOTYPE_NAME_RE.exec(source)) !== null) {
    const name = m[1];
    if (name.length > 48) {
      continue;
    }
    if (!seen.has(name)) {
      seen.add(name);
      out.push(name);
      if (out.length >= MAX_STEREOTYPE_NAMES) {
        break;
      }
    }
  }
  return out;
}

function stereotypeSkinparamPrefixes(source: string, kind: DiagramKind): string[] {
  const s = source.toLowerCase();
  const p = new Set<string>();
  if (kind === "sequence") {
    p.add("participant");
  }
  if (/\bcomponent\b/.test(s) || /\[[^\]]+\]\s+as\s+/i.test(source)) {
    p.add("component");
  }
  if (/\bclass\b/.test(s) || /\binterface\b/.test(s) || /\benum\b/.test(s)) {
    p.add("class");
  }
  if (/\bnode\b/.test(s) || kind === "deployment") {
    p.add("node");
  }
  if (p.size === 0) {
    if (kind === "class") {
      p.add("class");
    } else if (kind === "component") {
      p.add("component");
    } else if (kind === "deployment") {
      p.add("node");
    }
  }
  return [...p];
}

/**
 * Cores distintas por `<<stereotype>>` (harmonia com {@link STEREOTYPE_SURFACE_PAIRS}).
 */
function stereotypeSkinparamBlocks(source: string, kind: DiagramKind): string[] {
  const names = extractStereotypeNames(source);
  if (names.length === 0) {
    return [];
  }
  const prefixes = stereotypeSkinparamPrefixes(source, kind);
  if (prefixes.length === 0) {
    return [];
  }

  const lines: string[] = ["' --- stereotype accents ---"];
  for (const st of names) {
    const { bg, border } = stereotypeSurfaceForName(st);
    for (const prefix of prefixes) {
      lines.push(`skinparam ${prefix}<<${st}>> {`);
      lines.push(`  BackgroundColor ${bg}`);
      lines.push(`  BorderColor ${border}`);
      lines.push(`}`);
    }
  }
  return lines;
}

function semanticSkinparamHints(
  source: string,
  kind: DiagramKind,
  t: Pick<ThemeTokens, "actorFill" | "databaseFill" | "boundaryFill">
): string[] {
  const out: string[] = [];
  const lower = source.toLowerCase();

  if (kind === "sequence") {
    if (/\b(user|utilizador|customer|client)\b/i.test(source)) {
      out.push(`skinparam ActorBackgroundColor ${t.actorFill}`);
    }
    if (/\b(api|service|rest|grpc|http)\b/i.test(lower)) {
      out.push(`skinparam BoundaryBackgroundColor ${t.boundaryFill}`);
    }
    if (/\b(db|database|sql|postgres|mongo)\b/i.test(lower)) {
      out.push(`skinparam DatabaseBackgroundColor ${t.databaseFill}`);
    }
    if (/\b(external|third|saas|vendor)\b/i.test(lower)) {
      out.push("skinparam ParticipantBackgroundColor #CBD5E1");
    }
  }

  return out.length > 0
    ? ["' --- semantic hints ---", ...out]
    : [];
}
