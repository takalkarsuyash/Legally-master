export const DelhiConfig = {
  unitRate: {
    Residential: 5,
    Commercial: 10
  },

  ageFactors: [
    { max: 10, value: 1 },
    { max: 20, value: 0.9 },
    { max: Infinity, value: 0.8 }
  ],

  usageFactor: {
    SelfOccupied: 1,
    Rented: 1.2
  },

  zoneFactor: {
    A: 1.2,
    B: 1.0,
    C: 0.8
  },

  taxRate: 0.10
};
