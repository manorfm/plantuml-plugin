import type { DiagramKind } from "./analyzeDiagram";

export type VisualThemeId = "none" | "modern-dark" | "glass" | "minimal";

/** Tokens usados em skinparam e pós-processamento SVG. */
export type ThemeTokens = {
  id: VisualThemeId;
  /** Raio de canto (skinparam roundcorner). */
  roundcorner: number;
  nodesep: number;
  ranksep: number;
  /** Aplicado em conjunto com {@link preferOrthogonalForKind}. */
  preferOrthogonal: boolean;
  shadowing: boolean;
  /**
   * Família principal: **DejaVu Sans** costuma existir em servidores Linux/Docker;
   * Segoe UI cai para serif se não estiver instalada.
   */
  fontPrimary: string;
  fontSizeDefault: number;
  fontColorDefault: string;
  /** Rótulos nas setas (ligeiramente mais suave que o corpo). */
  fontSizeArrow: number;
  fontColorArrow: string;
  titleFontSize: number;
  titleFontColor: string;
  componentFontSize: number;
  packageFontSize: number;
  /** Pilha legada (skinparam defaultFontName) — igual a {@link fontPrimary}. */
  fontStack: string;
  /** Faixa do rótulo <<stereotype>> (componente/classe). */
  stereotypeLabelBg: string;
  stereotypeLabelFg: string;
  /** Cores hex para participantes genéricos (sequência). */
  participantFill: string;
  actorFill: string;
  databaseFill: string;
  boundaryFill: string;
  /** Fundo de classe / componente. */
  classFill: string;
  classBorder: string;
  /** Borda de pacote (harmonia com o tema). */
  packageBorder: string;
  arrowColor: string;
  /** SVG: sombra suave (diagramas não densos). */
  shadowBlur: number;
  shadowOpacity: number;
  shadowOffsetY: number;
  /** SVG: gradiente topo para nós. */
  gradientTop: string;
  gradientBottom: string;
  /** CSS drop-shadow para diagramas densos (rgba). */
  denseDropShadow: string;
};

const baseSpacing = (kind: DiagramKind): { nodesep: number; ranksep: number } => {
  switch (kind) {
    case "sequence":
      return { nodesep: 28, ranksep: 22 };
    case "class":
    case "component":
    case "deployment":
      return { nodesep: 105, ranksep: 90 };
    default:
      return { nodesep: 60, ranksep: 55 };
  }
};

/** `linetype ortho` piora muitos diagramas de componente (arestas cruzadas). */
export function preferOrthogonalForKind(kind: DiagramKind): boolean {
  return kind === "sequence" || kind === "activity";
}

/**
 * Pares de fundo/borda suaves para `<<stereotype>>` — paleta coerente (tons pastel frios + neutros).
 */
export const STEREOTYPE_SURFACE_PAIRS: ReadonlyArray<{ bg: string; border: string }> = [
  { bg: "#E0F2FE", border: "#7DD3FC" },
  { bg: "#F0FDF4", border: "#86EFAC" },
  { bg: "#F5F3FF", border: "#C4B5FD" },
  { bg: "#FFF7ED", border: "#FDBA74" },
  { bg: "#FEF2F2", border: "#FCA5A5" },
  { bg: "#ECFEFF", border: "#67E8F9" },
  { bg: "#F8FAFC", border: "#CBD5E1" },
];

/** Hash estável → cor por nome de estereótipo (sempre o mesmo para o mesmo texto). */
export function stereotypeSurfaceForName(name: string): { bg: string; border: string } {
  const pairs = STEREOTYPE_SURFACE_PAIRS;
  let h = 5381;
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) + h) ^ name.charCodeAt(i);
  }
  const idx = Math.abs(h) % pairs.length;
  return pairs[idx]!;
}

function typo(
  themeId: VisualThemeId,
  base: {
    fontSizeDefault: number;
    fontColorDefault: string;
    fontSizeArrow: number;
    fontColorArrow: string;
    titleFontSize: number;
    titleFontColor: string;
    componentFontSize: number;
    packageFontSize: number;
  }
): Pick<
  ThemeTokens,
  | "fontSizeDefault"
  | "fontColorDefault"
  | "fontSizeArrow"
  | "fontColorArrow"
  | "titleFontSize"
  | "titleFontColor"
  | "componentFontSize"
  | "packageFontSize"
> {
  if (themeId === "minimal") {
    return {
      ...base,
      fontSizeDefault: base.fontSizeDefault - 1,
      fontSizeArrow: base.fontSizeArrow - 1,
      titleFontSize: base.titleFontSize - 1,
      componentFontSize: base.componentFontSize - 1,
      packageFontSize: base.packageFontSize - 1,
    };
  }
  return base;
}

export function getThemeTokens(
  themeId: VisualThemeId,
  kind: DiagramKind
): ThemeTokens | null {
  if (themeId === "none") {
    return null;
  }

  const sp = baseSpacing(kind);
  const ortho = preferOrthogonalForKind(kind);

  const fontPrimary = "DejaVu Sans";
  const fontStack = fontPrimary;

  const baseTypo = typo(themeId, {
    fontSizeDefault: 12,
    fontColorDefault: "#334155",
    fontSizeArrow: 11,
    fontColorArrow: "#475569",
    titleFontSize: 15,
    titleFontColor: "#0f172a",
    componentFontSize: 11,
    packageFontSize: 11,
  });

  /* modern-dark: id histórico; paleta actual = clara, suave, profissional (slate / sky). */
  if (themeId === "modern-dark") {
    return {
      id: themeId,
      roundcorner: 12,
      nodesep: sp.nodesep,
      ranksep: sp.ranksep,
      preferOrthogonal: ortho,
      shadowing: true,
      fontPrimary,
      ...baseTypo,
      fontStack,
      stereotypeLabelBg: "#E0F2FE",
      stereotypeLabelFg: "#0369A1",
      participantFill: "#F8FAFC",
      actorFill: "#EFF6FF",
      databaseFill: "#ECFDF5",
      boundaryFill: "#F5F3FF",
      classFill: "#F8FAFC",
      classBorder: "#CBD5E1",
      packageBorder: "#E2E8F0",
      arrowColor: "#64748B",
      shadowBlur: 4,
      shadowOpacity: 0.14,
      shadowOffsetY: 3,
      gradientTop: "#FFFFFF",
      gradientBottom: "#F1F5F9",
      denseDropShadow: "0 2px 10px rgba(15, 23, 42, 0.08)",
    };
  }

  if (themeId === "glass") {
    return {
      id: themeId,
      roundcorner: 14,
      nodesep: sp.nodesep + 10,
      ranksep: sp.ranksep + 8,
      preferOrthogonal: ortho,
      shadowing: true,
      fontPrimary,
      ...baseTypo,
      fontStack,
      stereotypeLabelBg: "#DBEAFE",
      stereotypeLabelFg: "#1D4ED8",
      participantFill: "#F8FAFC",
      actorFill: "#F0F9FF",
      databaseFill: "#F0FDFA",
      boundaryFill: "#FAF5FF",
      classFill: "#FFFFFF",
      classBorder: "#BFDBFE",
      packageBorder: "#E0E7FF",
      arrowColor: "#6366F1",
      shadowBlur: 5,
      shadowOpacity: 0.12,
      shadowOffsetY: 4,
      gradientTop: "#FFFFFF",
      gradientBottom: "#EEF2FF",
      denseDropShadow: "0 3px 12px rgba(79, 70, 229, 0.1)",
    };
  }

  return {
    id: "minimal",
    roundcorner: 6,
    nodesep: sp.nodesep,
    ranksep: sp.ranksep,
    preferOrthogonal: ortho,
    shadowing: false,
    fontPrimary,
    ...baseTypo,
    fontStack,
    stereotypeLabelBg: "#F1F5F9",
    stereotypeLabelFg: "#475569",
    participantFill: "#FAFAFA",
    actorFill: "#F8FAFC",
    databaseFill: "#F7FEE7",
    boundaryFill: "#FAFAFA",
    classFill: "#FFFFFF",
    classBorder: "#E2E8F0",
    packageBorder: "#E2E8F0",
    arrowColor: "#64748B",
    shadowBlur: 0,
    shadowOpacity: 0,
    shadowOffsetY: 0,
    gradientTop: "#FFFFFF",
    gradientBottom: "#FAFAFA",
    denseDropShadow: "0 1px 4px rgba(15, 23, 42, 0.06)",
  };
}
