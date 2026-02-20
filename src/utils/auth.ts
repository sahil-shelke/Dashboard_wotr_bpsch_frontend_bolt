import { DecodedToken } from '../types/auth';

export const decodeToken = (token: string): DecodedToken | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export const isTokenExpired = (token: DecodedToken): boolean => {
  return Date.now() >= token.exp * 1000;
};

const API_BASE_URL = 'http://localhost:8000';

export const login = async (
  email: string,
  password: string
): Promise<{ message: string; email: string; token: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error('Invalid credentials');
  }
};
