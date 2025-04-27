// src/utils/auth.ts
export const isTokenValid = (): boolean => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    // In a production app, you'd check token expiration by decoding it
    // For a simple check, just verify it exists
    return true;
  };
  
  export const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };
  
  export const parseJwt = (token: string) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };
  
  export const getTokenExpirationDate = (token: string): Date | null => {
    const decoded = parseJwt(token);
    if (!decoded || !decoded.exp) return null;
    
    const date = new Date(0);
    date.setUTCSeconds(decoded.exp);
    return date;
  };
  
  export const isTokenExpired = (token: string): boolean => {
    const expirationDate = getTokenExpirationDate(token);
    if (!expirationDate) return true;
    
    return expirationDate.valueOf() < new Date().valueOf();
  };