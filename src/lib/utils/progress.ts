import type { AmanahOrdnerData, InheritanceProfile, ModuleId } from "@/lib/types";
import {
  calculateProgress,
  checkInheritance,
  getAllModuleProgress,
  getCriticalMissing,
  getModuleProgress,
  getRecommendedNextStep,
  type InheritanceCheckResult,
  type ModuleProgress,
} from "@/lib/domain/validation";

export {
  calculateProgress,
  checkInheritance,
  getAllModuleProgress,
  getCriticalMissing,
  getModuleProgress,
  getRecommendedNextStep,
  type InheritanceCheckResult,
  type ModuleProgress,
};

export type { AmanahOrdnerData, InheritanceProfile, ModuleId };
