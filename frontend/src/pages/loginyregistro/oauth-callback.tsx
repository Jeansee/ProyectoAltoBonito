import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function OAuthCallbackPage() {
  const nav = useNavigate();
  const { updateUser } = useAuth();

  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");

    if (token) {
      localStorage.setItem("token", token);
      fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { updateUser?.(d.user, token); nav("/"); })
        .catch(() => nav("/"));
    } else {
      nav("/login");
    }
  }, []);

  return <p>Autenticando…</p>;
}
