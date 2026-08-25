import type { LandmarkKind, SceneLearningContent } from "./levels/level_definition";

export type SceneObjectKind = LandmarkKind | "obstacle" | "route";

export interface SceneLearningCopy {
  category: string;
  description: string;
}

const CATEGORY_BY_KIND: Readonly<Record<SceneObjectKind, string>> = {
  source: "Cancer-cell source",
  exit: "Circulation exit",
  merge: "Route junction",
  combat_zone: "Shared coverage zone",
  landmark: "Tissue landmark",
  obstacle: "Tissue structure",
  route: "Cancer-cell pathway",
};

export function getSceneLearningCopy(
  kind: SceneObjectKind,
  learning: SceneLearningContent,
): SceneLearningCopy {
  const description = `${learning.biologicalFact} ${learning.gameRole}`;
  const copy = {
    category: CATEGORY_BY_KIND[kind],
    description,
  };
  return copy;
}
