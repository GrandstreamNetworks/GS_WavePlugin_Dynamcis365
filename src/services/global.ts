import { MICROSOFT_GRAPH_SERVER_ADDRESS, MICROSOFT_LOGIN_SERVER_ADDRESS, SESSION_STORAGE_KEY } from '@/constant';
import request from "@/utils/request";
import { stringify } from 'qs';

export function getUser() {
    const token = sessionStorage.getItem(SESSION_STORAGE_KEY.userToken);
    return request(`${MICROSOFT_GRAPH_SERVER_ADDRESS}/v1.0/me`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        }

    })
}

export function token(params: any) {
    return request(`${MICROSOFT_LOGIN_SERVER_ADDRESS}/organizations/oauth2/v2.0/token`, {
        method: "POST",
        body: stringify(params),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
    })
}

export function checkDomain() {
    const domain = sessionStorage.getItem(SESSION_STORAGE_KEY.domain);
    return request(`${domain}/api/data/v9.0/accounts`);
}