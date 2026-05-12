import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('access')}`,
});

export const propertyService = {
  getOwnerProperties: async () => {
    const response = await axios.get(`${API_URL}/properties/my/`, {
      headers: authHeaders(),
    });
    return response.data;
  },

  updateProperty: async (propertyId, data) => {
    const response = await axios.patch(`${API_URL}/properties/${propertyId}/`, data, {
      headers: authHeaders(),
    });
    return response.data;
  },

  activateProperty: async (propertyId) => {
    const response = await axios.post(`${API_URL}/properties/${propertyId}/activate/`, {}, {
      headers: authHeaders(),
    });
    return response.data;
  },

  deactivateProperty: async (propertyId) => {
    const response = await axios.post(`${API_URL}/properties/${propertyId}/deactivate/`, {}, {
      headers: authHeaders(),
    });
    return response.data;
  },

  deleteProperty: async (propertyId) => {
    await axios.delete(`${API_URL}/properties/${propertyId}/`, {
      headers: authHeaders(),
    });
  },
};
