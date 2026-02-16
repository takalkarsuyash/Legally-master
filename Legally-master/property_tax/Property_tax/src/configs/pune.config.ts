export const PuneConfig = {
  constructionFactor: {
    RCC: 1.0,
    NonRCC: 0.85
  },

  ageFactors: [
    { max: 10, value: 1 },
    { max: 25, value: 0.92 },
    { max: Infinity, value: 0.85 }
  ],

  usageFactor: {
    SelfOccupied: 1,
    Rented: 1.08
  },

  taxRate: 0.07 // PMMC approx 7%
};
