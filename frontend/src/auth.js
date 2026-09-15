import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    api.get("/auth/me").then((r) => setUser(r.data)).catch(() => {}).finally(() => setChecking(false));
  }, []);
  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };
  return (
    <AuthContext.Provider value={{ user, setUser, logout, checking }}>
      {children}
    </AuthContext.Provider>
  );
}
