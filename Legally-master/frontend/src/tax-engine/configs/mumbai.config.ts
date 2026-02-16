export const MumbaiConfig = {
    constructionFactor: {
        RCC: 1.0,
        NonRCC: 0.8
    },

    ageFactors: [
        { max: 10, value: 1 },
        { max: 25, value: 0.9 },
        { max: Infinity, value: 0.8 }
    ],

    usageFactor: {
        SelfOccupied: 1,
        Rented: 1.1
    },

    taxRate: 0.08 // MCGM approx effective %
};
