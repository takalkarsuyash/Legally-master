const PROPERTY_KEYWORDS = [
  "property",
  "real estate",
  "land",
  "builder",
  "housing",
  "registry",
  "lease",
  "sale",
];

module.exports = function scoreLawyers(lawyers) {
  return lawyers
    .map((l) => {
      const ratingScore = l.rating * 20;
      const popularityScore = Math.min(l.user_ratings_total || 0, 200) / 10;

      const text = `${l.name} ${l.formatted_address}`.toLowerCase();

      let propertyScore = 0;
      PROPERTY_KEYWORDS.forEach((k) => {
        if (text.includes(k)) propertyScore += 15;
      });

      return {
        ...l,
        score: ratingScore + popularityScore + propertyScore,
      };
    })
    .sort((a, b) => b.score - a.score);
};
