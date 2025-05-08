import axios from "axios";
import { HOST } from "@/utils/constants";


export const apiClient = axios.create({
    baseURL: HOST,
    withCredentials: true,
    validateStatus: function (status) {
        return status >= 200 && status < 500; // Accept redirects
    },
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// response interception for better error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.log("API Error:", error.response); // Debug API errors
        if (error.response?.status === 401 && window.location.pathname !== '/auth') {
            // Handle unauthorized error
            window.location.href = '/auth';
        }
        return Promise.reject(error);
    }
);

// Add request interceptor to ensure token is sent
apiClient.interceptors.request.use(
    (config) => {
        // Add additional headers if needed
        config.withCredentials = true;
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);