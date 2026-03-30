declare module "madge" {
  export interface MadgeResult {
    circular(): unknown[];
  }
  export default function madge(
    path: string,
    config?: Record<string, unknown>
  ): Promise<MadgeResult>;
}
