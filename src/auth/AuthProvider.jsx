import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    const base64 = token.split(".")[1];
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function isTokenValid(token) {
  if (!token) return false;
  const payload = parseJwt(token);
  if (!payload?.exp) return true;          // treat no-exp tokens as valid
  const nowSec = Math.floor(Date.now() / 1000);
  return payload.exp > nowSec;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem("token") || "";
      const u = JSON.parse(localStorage.getItem("user") || "null");
      if (t && isTokenValid(t)) {
        setToken(t);
        setUser(u);
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    } finally {
      setBootstrapped(true);
    }
  }, []);

  const login = (nextToken, nextUser) => {
    localStorage.setItem("token", nextToken);
    localStorage.setItem("user", JSON.stringify(nextUser || {}));
    setToken(nextToken);
    setUser(nextUser || {});
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    setUser(null);
  };

  const isAuthed = !!token && isTokenValid(token);

  const value = useMemo(
    () => ({ token, user, isAuthed, login, logout, bootstrapped }),
    [token, user, isAuthed, bootstrapped]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
