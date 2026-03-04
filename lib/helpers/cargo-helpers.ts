import { DspCargoTypeTypes } from '@/lib/types';

export const extractUniqueCargoGroupCodes = (cargoData: DspCargoTypeTypes[]): string[] => {
  if (!Array.isArray(cargoData)) {
    return [];
  }

  const uniqueCargoGroupCodes = new Set<string>();

  cargoData.forEach(item => {
    if (item && item.cargoGroupCode) {
      uniqueCargoGroupCodes.add(item.cargoGroupCode);
    }
  });

  return [...uniqueCargoGroupCodes].sort();
};
