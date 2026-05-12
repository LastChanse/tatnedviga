import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('access')}`,
});

export const reviewService = {
  getReviewsByProperty: async (propertyId) => {
    const response = await axios.get(`${API_URL}/reviews/?property=${propertyId}`, {
      headers: authHeaders(),
    });
    return response.data;
  },

  createReview: async ({ property, viewing_request, rating, text }) => {
    const response = await axios.post(
      `${API_URL}/reviews/`,
      { property, viewing_request, rating, text },
      { headers: authHeaders() }
    );
    return response.data;
  },

  deleteReview: async (reviewId) => {
    await axios.delete(`${API_URL}/reviews/${reviewId}/`, {
      headers: authHeaders(),
    });
  },
};
