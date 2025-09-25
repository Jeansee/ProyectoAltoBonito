import React from "react";
import RegisterForm from "@/components/auth/registerform";


export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-semibold mb-1">Crear cuenta</h1>
        <p className="text-sm text-gray-500 mb-6">Regístrate para reservar más rápido.</p>
        <RegisterForm />
      </div>
    </div>
  );
}