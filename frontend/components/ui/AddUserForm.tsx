"use client"
import { useState } from "react"

interface Props {
  role: "admin" | "manager"
  onUserAdded: () => void
}

export default function AddUserForm({ role, onUserAdded }: Props) {
  const [firstname, setFirstname] = useState("")
  const [lastname, setLastname] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [limit, setLimit] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const payload: any = {
      firstname,
      lastname,
      email,
      password,
    }

    if (role === "admin") {
      payload.manager_limit_pln = Number(limit)
    }

    try {
      await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      onUserAdded()

      setFirstname("")
      setLastname("")
      setEmail("")
      setPassword("")
      setLimit("")
    } catch (error) {
      console.error("Błąd:", error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 p-4 bg-zinc-800 rounded-lg text-white">
      <h2 className="text-xl font-bold">Dodaj użytkownika</h2>
      <input placeholder="Imię" value={firstname} onChange={(e) => setFirstname(e.target.value)} className="w-full p-2 rounded bg-zinc-700" />
      <input placeholder="Nazwisko" value={lastname} onChange={(e) => setLastname(e.target.value)} className="w-full p-2 rounded bg-zinc-700" />
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 rounded bg-zinc-700" />
      <input type="password" placeholder="Hasło" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 rounded bg-zinc-700" />
      {role === "admin" && (
        <input type="number" placeholder="Limit PLN" value={limit} onChange={(e) => setLimit(e.target.value)} className="w-full p-2 rounded bg-zinc-700" />
      )}
      <button type="submit" className="bg-blue-600 px-4 py-2 rounded">Dodaj</button>
    </form>
  )
}
