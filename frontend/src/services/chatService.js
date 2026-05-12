import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('access')}`,
});

export const chatService = {
  getConversations: async () => {
    const response = await axios.get(`${API_URL}/conversations/`, {
      headers: authHeaders(),
    });
    return response.data;
  },

  startConversation: async (propertyId, text = '') => {
    const response = await axios.post(
      `${API_URL}/conversations/`,
      { property_id: propertyId, text },
      { headers: authHeaders() }
    );
    return response.data;
  },

  getMessages: async (conversationId) => {
    const response = await axios.get(`${API_URL}/conversations/${conversationId}/messages/`, {
      headers: authHeaders(),
    });
    return response.data;
  },

  sendMessage: async (conversationId, text) => {
    const response = await axios.post(
      `${API_URL}/conversations/${conversationId}/send/`,
      { text },
      { headers: authHeaders() }
    );
    return response.data;
  },
};
