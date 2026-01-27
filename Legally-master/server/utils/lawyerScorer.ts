interface Lawyer {
    place_id: string;
    name: string;
    formatted_address: string;
    rating?: number;
    user_ratings_total?: number;
    score?: number;
    [key: string]: any;
}

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

export default function scoreLawyers(lawyers: Lawyer[]): Lawyer[] {
    return lawyers
        .map((l) => {
            const rating = l.rating || 0;
            const ratingScore = rating * 20;
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
        .sort((a, b) => (b.score || 0) - (a.score || 0));
}
