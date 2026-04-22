import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const favoriteService = {
    getFavorites: async () => {
        const token = localStorage.getItem('access');
        const response = await axios.get(`${API_URL}/favorites/`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    toggleFavorite: async (propertyId) => {
        const token = localStorage.getItem('access');
        const response = await axios.post(`${API_URL}/favorites/toggle/`, 
            { property_id: propertyId },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    },

    removeFavorite: async (favoriteId) => {
        const token = localStorage.getItem('access');
        await axios.delete(`${API_URL}/favorites/${favoriteId}/`, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }
};