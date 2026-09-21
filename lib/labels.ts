import type { TFunction } from "./i18n/t";
import type { FoodType, Grade, LifeStage, Species } from "./scoring/types";

/** Human-readable labels for enum values; all text comes from the dictionary. */
export function foodTypeLabel(t: TFunction, ft: FoodType): string {
  return t(`type.${ft === "semi-moist" ? "semi" : ft}`);
}

export function stageLabel(t: TFunction, stage: LifeStage, species: Species): string {
  if (stage === "young") return t(species === "dog" ? "stage.youngDog" : "stage.youngCat");
  return t(`stage.${stage}`);
}

export function gradeLabel(t: TFunction, grade: Grade): string {
  return t(`grade.${grade}`);
}

export function speciesLabel(t: TFunction, sp: Species, plural = false): string {
  return t(`common.${sp}${plural ? "s" : ""}`);
}

export function scoreAria(t: TFunction, score: number | null, grade: Grade | null): string {
  return score === null || !grade ? t("score.none") : t("score.aria", { score, grade: gradeLabel(t, grade) });
}

export type KindGroup = "animal" | "plant" | "fat" | "other";

/** Groups ingredient kinds for the composition bar on the product page. */
export function kindGroup(kind: string): KindGroup {
  switch (kind) {
    case "meat":
    case "fish":
    case "egg":
    case "dairy":
    case "generic_animal":
    case "animal_extract":
    case "insect":
    case "broth":
      return "animal";
    case "animal_fat":
    case "fish_oil":
    case "plant_oil":
      return "fat";
    case "cereal":
    case "cereal_protein":
    case "legume":
    case "legume_protein":
    case "tuber":
    case "veg_fruit":
    case "fibre":
    case "yeast":
      return "plant";
    default:
      return "other";
  }
}
