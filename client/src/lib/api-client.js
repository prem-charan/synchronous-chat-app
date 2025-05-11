import axios from "axios";
import { HOST } from "@/utils/constants";
import { toast } from "sonner";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const TIMEOUT = 10000;

console.log('API Client using HOST:', HOST);

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: HOST,
    withCredentials: true,
    timeout: TIMEOUT,
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
}, error => {
    console.error('Request error:', error);
    return Promise.reject(error);
});

// Add retry logic for failed requests
apiClient.interceptors.response.use(
    response => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Don't retry if it's not a network error or if we've already retried
        if (
            !error.response ||
            originalRequest._retryCount >= MAX_RETRIES ||
            !isRetryableError(error)
        ) {
            handleError(error);
            return Promise.reject(error);
        }

        // Initialize retry count if not set
        originalRequest._retryCount = originalRequest._retryCount || 0;

        // Calculate delay with exponential backoff
        const delay = RETRY_DELAY * Math.pow(2, originalRequest._retryCount);

        // Increment retry count
        originalRequest._retryCount++;

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Retry the request
        return apiClient(originalRequest);
    }
);

// Debug interceptor to log requests
apiClient.interceptors.request.use(request => {
    // Only log non-user-info requests to reduce noise
    if (!request.url.includes('user-info')) {
        console.log('Starting Request:', {
            url: request.url,
            method: request.method,
            headers: request.headers,
            withCredentials: request.withCredentials,
            baseURL: request.baseURL
        });
    }
    return request;
}, error => {
    console.error('Request error:', error);
    return Promise.reject(error);
});

// Debug interceptor to log responses
apiClient.interceptors.response.use(
    response => {
        // Only log non-user-info responses to reduce noise
        if (!response.config.url.includes('user-info')) {
            console.log('Response:', {
                status: response.status,
                headers: response.headers,
                data: response.data
            });
        }
        return response;
    },
    error => {
        // Don't log network errors for user-info requests
        if (!error.config?.url?.includes('user-info')) {
            console.error('API Error:', {
                status: error.response?.status,
                data: error.response?.data,
                headers: error.response?.headers,
                config: error.config,
                message: error.message
            });
        }
        
        if (error.response?.status === 401 && window.location.pathname !== '/auth') {
            localStorage.removeItem('auth_token');
            window.location.href = '/auth';
        } else if (error.code === 'ECONNABORTED') {
            toast.error('Request timed out. Please try again.');
        } else if (!error.response) {
            toast.error('Network error. Please check your internet connection.');
        }
        return Promise.reject(error);
    }
);

// Helper function to determine if an error is retryable
const isRetryableError = (error) => {
    if (!error.response) return true; // Network errors are retryable
    const status = error.response.status;
    return (
        status === 408 || // Request Timeout
        status === 429 || // Too Many Requests
        status === 500 || // Internal Server Error
        status === 502 || // Bad Gateway
        status === 503 || // Service Unavailable
        status === 504 // Gateway Timeout
    );
};

// Helper function to handle different types of errors
const handleError = (error) => {
    if (!error.response) {
        toast.error("Network error. Please check your internet connection.");
    } else {
        const status = error.response.status;
        const message = error.response.data?.message || "An error occurred";

        switch (status) {
            case 400:
                toast.error(message || "Invalid request");
                break;
            case 401:
                toast.error("Session expired. Please login again.");
                localStorage.removeItem("auth_token");
                window.location.href = "/auth";
                break;
            case 403:
                toast.error("You don't have permission to perform this action");
                break;
            case 404:
                toast.error("Resource not found");
                break;
            case 408:
                toast.error("Request timed out. Please try again");
                break;
            case 429:
                toast.error("Too many requests. Please try again later");
                break;
            case 500:
                toast.error("Server error. Please try again later");
                break;
            default:
                toast.error(message);
        }
    }
};

export { apiClient };