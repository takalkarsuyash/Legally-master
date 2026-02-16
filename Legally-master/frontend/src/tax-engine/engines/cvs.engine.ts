import type { CVSInput } from "../types";

interface CVSConfig {
    constructionFactor: Record<"RCC" | "NonRCC", number>;
    ageFactors: { max: number; value: number }[];
    usageFactor: Record<"SelfOccupied" | "Rented", number>;
    taxRate: number;
}

export function calculateCVS(
    input: CVSInput,
    config: CVSConfig
) {
    const baseCapital = input.marketValue;

    const ageFactor = config.ageFactors.find(
        f => input.propertyAge <= f.max
    )!.value;

    const capitalValue =
        baseCapital *
        config.constructionFactor[input.constructionType] *
        ageFactor *
        config.usageFactor[input.usage];

    const taxAmount = capitalValue * config.taxRate;

    return {
        system: "CVS" as const,
        baseCapital,
        ageFactor,
        constructionFactor:
            config.constructionFactor[input.constructionType],
        usageFactor: config.usageFactor[input.usage],
        capitalValue,
        taxRate: config.taxRate,
        taxAmount
    };
}
