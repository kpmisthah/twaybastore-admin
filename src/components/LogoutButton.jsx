import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function LogoutButton({ className = "" }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <button
      onClick={() => {
        logout();
        navigate("/login", { replace: true });
      }}
      className={className}
    >
      Logout
    </button>
  );
}
