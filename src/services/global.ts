import { SESSION_STORAGE_KEY } from '@/constant';
import request from "@/utils/request";

export function getUser() {
    const token = sessionStorage.getItem(SESSION_STORAGE_KEY.userToken);
    return request(`https://graph.microsoft.com/v1.0/me`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        }

    })
}