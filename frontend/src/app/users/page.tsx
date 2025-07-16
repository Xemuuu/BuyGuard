"use client"

import { useEffect, useState } from "react"
import { fetchWithAuth } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

interface User {
  id: string
  firstname: string
  lastname: string
  email: string
  manager_limit_pln?: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [role, setRole] = useState<"admin" | "manager" | "user">("user")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchRole()
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [page])

  async function fetchRole() {
    const me = await fetchWithAuth("/api/users/me")
    setRole(me.role)
  }

  async function fetchUsers() {
    const res = await fetchWithAuth(`/api/users?page=${page}&limit=10`)
    setUsers(res.users)
    setTotalPages(res.totalPages || 1)
  }

  return (
    <main className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center px-4 py-6">
      <div className="bg-zinc-800 p-4 rounded-lg shadow-md w-full max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold text-white text-center">Lista użytkowników</h1>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-white">Imię</TableHead>
                <TableHead className="text-white">Nazwisko</TableHead>
                <TableHead className="text-white">Email</TableHead>
                {role === "admin" && <TableHead className="text-white">Limit</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="text-zinc-300">{user.firstname}</TableCell>
                  <TableCell className="text-zinc-300">{user.lastname}</TableCell>
                  <TableCell className="text-zinc-300">{user.email}</TableCell>
                  {role === "admin" && (
                    <TableCell className="text-zinc-300">
                      {user.manager_limit_pln ?? "-"}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* PAGINACJA */}
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-white border-zinc-600"
          >
            Poprzednia
          </Button>
          <span className="text-zinc-300 pt-2">Strona {page}</span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="text-white border-zinc-600"
          >
            Następna
          </Button>
        </div>
      </div>
    </main>
  )
}
