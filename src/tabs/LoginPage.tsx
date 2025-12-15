

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import wcres from '../assets/wcres.svg';
import wotr from '../assets/wotr.svg';

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: any) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/login/", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data?.message !== "verified" || !data?.token) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("sessionEmail", data.email);
      localStorage.setItem("isAuthenticated", "true");

      navigate("/");
    } catch (err) {
      setError("Network error");
    }

    setLoading(false);
  }

  return (
    <div className="w-full h-screen bg-[#F5E9D4] flex items-center justify-center px-4">

      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 border border-gray-300">

        {/* LOGO HEADER — EXACTLY LIKE YOU WANT */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">

            <div className="flex items-center justify-center space-x-6 mb-2">
              <img
                src={wotr}
                alt="WOTR Logo"
                className="inline-block h-16 w-auto"
              />

              <div className="w-0.5 h-14 bg-gray-400"></div>

              <img
                src={wcres}
                alt="WCRES Logo"
                className="inline-block h-16 w-auto"
              />
            </div>

            <div className="mt-2 text-xl font-semibold">
              NFPF Dashboard
            </div>
          </h1>
        </div>

        {/* ERROR */}
        {error && (
          <p className="text-red-600 text-sm text-center mb-4">
            {error}
          </p>
        )}

        {/* FORM */}
        <form onSubmit={handleLogin}>

          <div className="mb-4">
            <label className="block text-sm mb-1 font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full border rounded-lg px-3 h-11 focus:ring-2 focus:ring-[#1B5E20] outline-none transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname@wotr.org.in"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm mb-1 font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full border rounded-lg px-3 h-11 focus:ring-2 focus:ring-[#1B5E20] outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2E3A3F] hover:bg-[#1B5E20] text-white py-3 rounded-lg shadow-md transition text-sm tracking-wide"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>
      </div>
    </div>
  );
}
