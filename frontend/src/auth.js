import { ACCESS_TOKEN, REFRESH_TOKEN, ROLE_OWNER, ROLE_USER, USER_DATA } from "./constants";

export function getStoredUser() {
    try {
        const raw = localStorage.getItem(USER_DATA);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
}

export function getRoleHomePath(role) {
    return role === ROLE_OWNER ? "/owner" : "/user";
}

export function storeAuthSession({ access, refresh, user }) {
    if (access) {
        localStorage.setItem(ACCESS_TOKEN, access);
    }
    if (refresh) {
        localStorage.setItem(REFRESH_TOKEN, refresh);
    }
    if (user) {
        localStorage.setItem(USER_DATA, JSON.stringify(user));
    }
}

export function clearAuthSession() {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    localStorage.removeItem(USER_DATA);
}

export function isAllowedRole(role, allowedRoles = []) {
    if (!allowedRoles.length) {
        return true;
    }
    return allowedRoles.includes(role);
}

export const AVAILABLE_ROLES = [ROLE_USER, ROLE_OWNER];
