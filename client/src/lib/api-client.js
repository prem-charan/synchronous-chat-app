import axios from "axios";
import { HOST } from "@/utils/constants";

console.log('API Client using HOST:', HOST);

// Create axios instance with default config
export const apiClient = axios.create({
    baseURL: HOST,
    withCredentials: true,
    validateStatus: function (status) {
        return status >= 200 && status < 500;
    },
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN'
});

// Add auth token to requests
apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        config.headers['x-auth-token'] = token;
    }
    return config;
});

// Debug interceptor to log requests
apiClient.interceptors.request.use(request => {
    console.log('Starting Request:', {
        url: request.url,
        method: request.method,
        headers: request.headers,
        withCredentials: request.withCredentials,
        baseURL: request.baseURL
    });
    return request;
}, error => {
    console.error('Request error:', error);
    return Promise.reject(error);
});

// Debug interceptor to log responses
apiClient.interceptors.response.use(
    response => {
        console.log('Response:', {
            status: response.status,
            headers: response.headers,
            data: response.data
        });
        return response;
    },
    error => {
        console.error('API Error:', {
            status: error.response?.status,
            data: error.response?.data,
            headers: error.response?.headers,
            config: error.config,
            message: error.message
        });
        
        if (error.response?.status === 401 && window.location.pathname !== '/auth') {
            localStorage.removeItem('auth_token');
            window.location.href = '/auth';
        }
        return Promise.reject(error);
    }
);