export const HyderabadConfig = {
    unitRate: {
        Residential: 3.5,
        Commercial: 7
    },

    ageFactors: [
        { max: 10, value: 1 },
        { max: 20, value: 0.9 },
        { max: Infinity, value: 0.75 }
    ],

    usageFactor: {
        SelfOccupied: 1,
        Rented: 1.15
    },

    zoneFactor: {
        A: 1.15,
        B: 1.0,
        C: 0.85
    },

    taxRate: 0.15 // GHMC approx 15%
};
