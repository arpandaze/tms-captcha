export enum ResultTypes {
  Success,
  LowConfidence,
  InvalidLength,
}

export interface SolveResult {
  type: ResultTypes, value?: string,
}

export interface KindEntry {
  write_name: string, data_path: string,
}
