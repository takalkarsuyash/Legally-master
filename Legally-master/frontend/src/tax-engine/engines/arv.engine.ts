import type { ARVInput } from "../types";

interface ARVConfig {
    locationFactor: Record<"A" | "B" | "C", number>;
    ageFactors: { max: number; value: number }[];
    taxRate: number;
}

export function calculateARV(
    input: ARVInput,
    config: ARVConfig
) {
    const baseARV = input.monthlyRent * 12;

    const ageFactor = config.ageFactors.find(
        f => input.propertyAge <= f.max
    )!.value;

    const annualValue =
        baseARV *
        config.locationFactor[input.zone] *
        ageFactor;

    const taxAmount = annualValue * config.taxRate;

    return {
        system: "ARV" as const,
        baseARV,
        ageFactor,
        locationFactor: config.locationFactor[input.zone],
        annualValue,
        taxRate: config.taxRate,
        taxAmount
    };
}
