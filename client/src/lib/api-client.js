import axios from "axios";
import { HOST } from "@/utils/constants";


export const apiClient = axios.create({
    baseURL: HOST,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});

// response interception for better error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && window.location.pathname !== '/auth') {
            // Handle unauthorized error
            window.location.href = '/auth';
        }
        return Promise.reject(error);
    }
);