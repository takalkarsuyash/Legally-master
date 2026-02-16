export const BangaloreConfig = {
    unitRate: {
        Residential: 4,
        Commercial: 8
    },

    ageFactors: [
        { max: 10, value: 1 },
        { max: 20, value: 0.85 },
        { max: Infinity, value: 0.7 }
    ],

    usageFactor: {
        SelfOccupied: 1,
        Rented: 1.25
    },

    zoneFactor: {
        A: 1.2,
        B: 1.0,
        C: 0.8
    },

    taxRate: 0.20 // BBMP approx 20%
};
