/* ---------- COMMON TYPES ---------- */

export type City =
    | "Delhi"
    | "Bangalore"
    | "Hyderabad"
    | "Ahmedabad"
    | "Chennai"
    | "Kolkata"
    | "Mumbai"
    | "Pune";

export type PropertyType = "Residential" | "Commercial";
export type UsageType = "SelfOccupied" | "Rented";
export type Zone = "A" | "B" | "C";

/* ---------- UAV INPUT ---------- */

export interface UAVInput {
    city: "Delhi" | "Bangalore" | "Hyderabad" | "Ahmedabad";
    area: number;
    propertyType: PropertyType;
    usage: UsageType;
    propertyAge: number;
    zone: Zone;
}

/* ---------- ARV INPUT ---------- */

export interface ARVInput {
    city: "Chennai" | "Kolkata";
    monthlyRent: number;
    propertyAge: number;
    zone: Zone;
}

/* ---------- UNION ---------- */

export type PropertyTaxInput = UAVInput | ARVInput | CVSInput;

/* ---------- TYPE GUARDS ---------- */

export function isUAVInput(
    input: PropertyTaxInput
): input is UAVInput {
    return "area" in input;
}

export function isARVInput(
    input: PropertyTaxInput
): input is ARVInput {
    return "monthlyRent" in input;
}

/* ---------- CVS INPUT ---------- */

export interface CVSInput {
    city: "Mumbai" | "Pune";
    marketValue: number; // property market value
    constructionType: "RCC" | "NonRCC";
    propertyAge: number;
    usage: "SelfOccupied" | "Rented";
}


export function isCVSInput(
    input: PropertyTaxInput
): input is CVSInput {
    return "marketValue" in input;
}
