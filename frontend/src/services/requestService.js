import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const requestService = {
  getRequests: async () => {
    const token = localStorage.getItem('access');
    const response = await axios.get(`${API_URL}/viewing-requests/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  getRequestsByProperty: async (propertyId) => {
    const token = localStorage.getItem('access');
    const response = await axios.get(`${API_URL}/viewing-requests/?property=${propertyId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  createViewingRequest: async (propertyId, date, time, message) => {
    const token = localStorage.getItem('access');
    const response = await axios.post(
      `${API_URL}/viewing-requests/`,
      {
        property: propertyId,
        requested_date: date,  // Already formatted as "YYYY-MM-DD"
        requested_time: time,  // Already formatted as "HH:MM"
        message: message || null
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
},

  updateRequest: async (requestId, date, time, message = '') => {
  const token = localStorage.getItem('access');
  const response = await axios.patch(  // Измените PUT на PATCH
    `${API_URL}/viewing-requests/${requestId}/`,
    {
      requested_date: date,
      requested_time: time,
      message: message
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
},
  deleteRequest: async (requestId) => {
    const token = localStorage.getItem('access');
    await axios.delete(`${API_URL}/viewing-requests/${requestId}/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  changeStatus: async (requestId, status) => {
    const token = localStorage.getItem('access');
    const response = await axios.patch(
      `${API_URL}/viewing-requests/${requestId}/`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }
};