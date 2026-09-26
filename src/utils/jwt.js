import { jwtDecode } from 'jwt-decode';

export const setToken = (token) => {
    localStorage.setItem('universe_token', token);
};

export const getToken = () => {
    return localStorage.getItem('universe_token');
};

export const removeToken = () => {
    localStorage.removeItem('universe_token');
};

export const decodeToken = (token) => {
    try {
        return jwtDecode(token);
    } catch (error) {
        return null;
    }
};

export const isTokenValid = (token) => {
    if (!token) return false;

    const decoded = decodeToken(token);
    if (!decoded) return false;

    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
};

export const getUserFromToken = (token) => {
    const decoded = decodeToken(token);
    return decoded?.user || null;
};
