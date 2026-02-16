export const AhmedabadConfig = {
  unitRate: {
    Residential: 3,
    Commercial: 6
  },

  ageFactors: [
    { max: 10, value: 1 },
    { max: 20, value: 0.9 },
    { max: Infinity, value: 0.8 }
  ],

  usageFactor: {
    SelfOccupied: 1,
    Rented: 1.1
  },

  zoneFactor: {
    A: 1.1,
    B: 1.0,
    C: 0.9
  },

  taxRate: 0.12 // AMC approx 12%
};
