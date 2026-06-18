import axios from 'axios';

const API_URL = import.meta.env.VITE_SERVER_URL || '';
console.log('[LawyerService] Resolved API_URL:', API_URL);

export interface Lawyer {
    id: string;
    name: string;
    specialization: string;
    experience: string;
    location: string;
    address: string;
    rating: number;
    phone: string | null;
    email?: string;
    image: string;
    availability: string;
    website?: string | null;
}

export const searchPropertyLawyers = async (city: string): Promise<Lawyer[]> => {
    try {
        const response = await axios.get(`${API_URL}/api/lawyers`, {
            params: { city }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching lawyers:', error);
        throw error;
    }
};
