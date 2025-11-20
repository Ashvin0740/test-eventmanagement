import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = token;
    }
    return config;
});

// Types
export interface RegisterData {
    sEmail: string;
    sPassword: string;
    sUserName: string;
    oLocation?: {
        nLatitude?: number;
        nLongitude?: number;
        sAddress?: string;
        sCity?: string;
    };
}

export interface LoginData {
    sEmail: string;
    sPassword: string;
}

export interface EventData {
    sTitle: string;
    sDescription: string;
    oLocation: {
        nLatitude: number;
        nLongitude: number;
        sAddress?: string;
        sCity?: string;
    };
    dEventDate: string;
    sCategory: string;
    sImageUrl?: string;
    nMaxAttendees?: number;
}

export interface UpdateEventData extends Partial<EventData> {
    eStatus?: 'active' | 'cancelled';
}

export interface RSVPData {
    status: 'going' | 'interested' | 'not-going';
}

// Auth APIs
export const authAPI = {
    register: (data: RegisterData) => api.post('/auth/register', data),
    login: (data: LoginData) => api.post('/auth/login', data),
    verifyEmail: (token: string) => api.get(`/auth/verify-email/${token}`),
    getUserEvents: (type?: 'all' | 'created' | 'attending' | 'interested') => api.get('/auth/events', { params: type ? { type } : {} }),
};

// Events APIs
export const eventsAPI = {
    listEvents: (params?: { page?: number; limit?: number; category?: string; status?: string }) => api.get('/events', { params }),
    getEventDetails: (id: string) => api.get(`/events/${id}`),
    createEvent: (data: EventData) => api.post('/events', data),
    updateEvent: (id: string, data: UpdateEventData) => api.put(`/events/${id}`, data),
    deleteEvent: (id: string) => api.delete(`/events/${id}`),
    getNearbyEvents: (params: { lat: number; lng: number; radius_km?: number }) => api.get('/discovery/nearby', { params }),
    getTrendingEvents: () => api.get('/discovery/trending'),
};

// RSVP APIs
export const rsvpAPI = {
    createRSVP: (eventId: string, data: RSVPData) => api.post(`/rsvp/events/${eventId}/rsvp`, data),
    deleteRSVP: (eventId: string) => api.delete(`/rsvp/events/${eventId}/rsvp`),
    getUserEvents: (type?: 'all' | 'created' | 'attending' | 'interested') => api.get('/rsvp/user/events', { params: type ? { type } : {} }),
};

// Profile APIs
export const profileAPI = {
    getUserProfile: () => api.get('/profile'),
    logout: () => api.get('/profile/logout'),
};

// Discovery APIs
export const discoveryAPI = {
    getNearbyEvents: (params: { lat: number; lng: number; radius_km?: number }) => api.get('/discovery/nearby', { params }),
    getTrendingEvents: () => api.get('/discovery/trending'),
};

// Analytics APIs
export const analyticsAPI = {
    getEventAnalytics: (eventId: string) => api.get(`/analytics/event/${eventId}`),
};

export default api;
