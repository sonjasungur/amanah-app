/** @deprecated Use @/lib/domain and @/lib/storage/amanah-storage instead */
export { defaultAmanahData } from "@/lib/domain/defaults";
export { STORAGE_KEY } from "@/lib/storage/types";
export { exportToJson, importFromJson, exportEmergencyFolder } from "@/lib/storage/amanah-storage";
export { loadFromStorageSync as loadFromStorage } from "@/lib/storage/local-storage-provider";
export { saveAmanahData as saveToStorage, clearAmanahData as clearStorage } from "@/lib/storage/amanah-storage";
