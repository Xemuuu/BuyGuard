'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function Home() {

  const router = useRouter();


  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
  const token = localStorage.getItem("token");
  if (token) {
    router.push("/dashboard");
  }
  }, []);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email.includes("@") || !email.includes(".")) {
      newErrors.email = "Enter a correct email address";
    }
    if (password.length < 1) {
      newErrors.password = "Password cannot be empty.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validate()) return;

  const res = await fetch("http://localhost:5252/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    headers: { "Content-Type": "application/json" },
  });

    const data = await res.json();

    if (res.ok && data.token) {
    localStorage.setItem("token", data.token);
    router.push("/dashboard");
    } else {
    setErrors({ ...errors, password: "Invalid credentials" });
  }

  };

  return (
    <main className="min-h-screen bg-zinc-900 flex flex-col">
      <div className="flex-grow flex items-center justify-center">
        <div className="bg-zinc-800 p-4 rounded-lg shadow-md max-w-[300px] w-full text-center text-sm space-y-4">

          <h1 className="text-2xl font-bold text-white">BuyGuard</h1>
          <p className="text-white font-bold">Log in</p>

          <form noValidate onSubmit={handleSubmit} className="space-y-3 text-left">
            <div>
              <input
                type="email"
                id="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-md border border-gray-600 bg-gray-700 p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && (
                <p className="text-zinc-400 text-xs italic mt-1">{errors.email}</p>
              )}
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-md border border-gray-600 bg-gray-700 p-2 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="h-4">
              {errors.password && (
                <p className="text-zinc-400 text-xs italic">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-zinc-600 text-white py-2 rounded-md hover:bg-gray-700 transition"
            >
              Log in
            </button>
          </form>
        </div>
      </div>
      <div className="flex justify-center mb-4">
        <Image
          src="/logobg.png"
          alt="BuyGuard logo"
          width={96}
          height={96}
        />
      </div>
    </main>
  );
}
