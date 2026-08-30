export const TOWER_IDS = [
  "doctor",
  "chemotherapy",
  "t_cell",
  "radiation",
  "antibody",
  "macrophage",
  "crispr",
] as const;

export type TowerId = (typeof TOWER_IDS)[number];
