import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = "https://maps.googleapis.com/maps/api/place";
const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_KEY;

interface GooglePlaceResult {
    place_id: string;
    name: string;
    formatted_address: string;
    rating?: number;
    user_ratings_total?: number;
    business_status?: string;
    [key: string]: any;
}

interface LawyerDetails {
    phone: string | null;
    website: string | null;
}

export const searchLawyers = async (query: string): Promise<GooglePlaceResult[]> => {
    try {
        if (!GOOGLE_PLACES_KEY) {
            console.error("GOOGLE_PLACES_KEY is missing");
            return [];
        }

        const res = await axios.get(`${BASE_URL}/textsearch/json`, {
            params: {
                query,
                key: GOOGLE_PLACES_KEY,
            },
        });

        return res.data.results || [];
    } catch (error) {
        console.error("Error searching lawyers:", error);
        return [];
    }
};

export const getLawyerDetails = async (placeId: string): Promise<LawyerDetails> => {
    try {
        if (!GOOGLE_PLACES_KEY) {
            return { phone: null, website: null };
        }

        const res = await axios.get(`${BASE_URL}/details/json`, {
            params: {
                place_id: placeId,
                fields: "formatted_phone_number,website",
                key: GOOGLE_PLACES_KEY,
            },
        });

        const result = res.data.result || {};
        return {
            phone: result.formatted_phone_number || null,
            website: result.website || null,
        };
    } catch (error) {
        console.error(`Error getting details for place ${placeId}:`, error);
        return { phone: null, website: null };
    }
};
