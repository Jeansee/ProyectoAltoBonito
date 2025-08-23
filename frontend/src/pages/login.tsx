import { useNavigate, useLocation } from "react-router-dom";
import { login } from "../lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const from = location.state?.from?.pathname || "/";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    login(); // demo
    navigate(from, { replace: true });
  }

  return (
    <section className="pt-24 py-16 bg-white">
      <div className="mx-auto max-w-md px-4">
        <h2 className="text-3xl font-bold">Iniciar sesión</h2>
        <p className="text-gray-600 mt-2 text-sm">Demo sin backend (localStorage).</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input placeholder="Email" type="email" required className="w-full rounded-lg border px-3 py-2"/>
          <input placeholder="Contraseña" type="password" required className="w-full rounded-lg border px-3 py-2"/>
          <button className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">Entrar</button>
        </form>
      </div>
    </section>
  );
}
