import type { UAVInput } from "../types";

interface UAVConfig {
  unitRate: Record<"Residential" | "Commercial", number>;
  ageFactors: { max: number; value: number }[];
  usageFactor: Record<"SelfOccupied" | "Rented", number>;
  zoneFactor: Record<"A" | "B" | "C", number>;
  taxRate: number;
}

export function calculateUAV(
  input: UAVInput,
  config: UAVConfig
) {
  const baseValue =
    input.area * config.unitRate[input.propertyType];

  const ageFactor = config.ageFactors.find(
    f => input.propertyAge <= f.max
  )!.value;

  const annualValue =
    baseValue *
    ageFactor *
    config.zoneFactor[input.zone] *
    config.usageFactor[input.usage];

  const taxAmount = annualValue * config.taxRate;

  return {
    system: "UAV" as const,
    baseValue,
    ageFactor,
    usageFactor: config.usageFactor[input.usage],
    zoneFactor: config.zoneFactor[input.zone],
    annualValue,
    taxRate: config.taxRate,
    taxAmount
  };
}
