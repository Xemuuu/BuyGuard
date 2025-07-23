import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = {
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };

  const API_BASE = "http://localhost:5252";
  const fullUrl = `${API_BASE}${url}`;

  console.log("Making request to:", fullUrl); // debug
  console.log("Token:", token); // debug

  const res = await fetch(fullUrl, {
    ...options,
    headers,
  });

  if (res.status == 204) {
    return null
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP error! ${res.status}: ${errorText}`);
  }

  return res.json();
}
