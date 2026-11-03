export interface GenerateOptions {
  name: string;
  external: string;
  concatExternal: string;
  custom: string;
  output: string;
  badge?: string;
  convertToAllow: boolean;
  debug: boolean;
}

export interface FetchResult {
  ok: boolean;
  lines: string[];
  status?: number;
  error?: string;
}

export interface SourceStats {
  total: number;
  ok: number;
  failed: number;
  empty: number;
}
