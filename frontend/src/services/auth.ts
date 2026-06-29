export const authService = {
  getToken: () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("jwt_token");
    }
    return null;
  },
  setToken: (token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("jwt_token", token);
    }
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("jwt_token");
      window.location.href = "/";
    }
  },
  login: () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "") 
      : "http://localhost:8000";
    window.location.href = `${apiBase}/login`;
  }
};
