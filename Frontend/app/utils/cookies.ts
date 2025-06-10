import axios from "@/app/utils/axiosConfig";

export const isTokenValid = async (signal: AbortSignal): Promise<any> => {
    try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/verify`, { 
            signal,
            withCredentials: true,
        });

        return response;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.error("Request canceled", error.message);
            return false;
        } else {
            console.error("Error verifying token", error);
            return error;
        }
    }
};