export const KolkataConfig = {
    locationFactor: {
        A: 1.15,
        B: 1.0,
        C: 0.85
    },

    ageFactors: [
        { max: 10, value: 1 },
        { max: 20, value: 0.9 },
        { max: Infinity, value: 0.8 }
    ],

    taxRate: 0.12 // KMC approx 12%
};
