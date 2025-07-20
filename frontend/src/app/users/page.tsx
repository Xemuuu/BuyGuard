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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter
} from "@/components/ui/alert-dialog"
import { Pencil, Trash2 } from "lucide-react"

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
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)

  const [showDialog, setShowDialog] = useState(false)
  const [newUser, setNewUser] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    manager_limit_pln: ""
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNewUser({ ...newUser, [e.target.name]: e.target.value })
  }

  function openEdit(user: User) {
    setEditUser(user)
    setShowDialog(true)
  }

  function resetForm() {
    setEditUser(null)
    setShowDialog(false)
    setNewUser({
      firstname: "",
      lastname: "",
      email: "",
      password: "",
      manager_limit_pln: ""
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const payload: any = {
      firstname: newUser.firstname,
      lastname: newUser.lastname,
      email: newUser.email,
      password: newUser.password
    }

    if (role === "admin") {
      payload.manager_limit_pln = Number(newUser.manager_limit_pln)
    }

    const method = editUser ? "PATCH" : "POST"
    const url = editUser ? `/api/users/${editUser.id}` : "/api/users"

    try {
      await fetchWithAuth(url, {
        method,
        body: JSON.stringify(payload)
      })

      resetForm()
      fetchUsers()
    } catch (err) {
      console.error("Błąd dodawania/edycji użytkownika:", err)
    }
  }

  useEffect(() => {
    fetchRole()
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [page])

  useEffect(() => {
    if (editUser) {
      setNewUser({
        firstname: editUser.firstname,
        lastname: editUser.lastname,
        email: editUser.email,
        password: "",
        manager_limit_pln: editUser.manager_limit_pln?.toString() ?? ""
      })
    }
  }, [editUser])

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

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              Dodaj użytkownika
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border border-zinc-700 text-white">
            <DialogHeader>
              <DialogTitle>{editUser ? "Edytuj użytkownika" : `Dodaj ${role === "admin" ? "menedżera" : "pracownika"}`}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="firstname">Imię</Label>
                <Input id="firstname" name="firstname" value={newUser.firstname} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="lastname">Nazwisko</Label>
                <Input id="lastname" name="lastname" value={newUser.lastname} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={newUser.email} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="password">Hasło</Label>
                <Input id="password" name="password" type="password" value={newUser.password} onChange={handleChange} required />
              </div>
              {role === "admin" && (
                <div>
                  <Label htmlFor="manager_limit_pln">Limit (PLN)</Label>
                  <Input id="manager_limit_pln" name="manager_limit_pln" type="number" value={newUser.manager_limit_pln} onChange={handleChange} required />
                </div>
              )}
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2">
                {editUser ? "Zapisz zmiany" : "Dodaj"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-white">Imię</TableHead>
                <TableHead className="text-white">Nazwisko</TableHead>
                <TableHead className="text-white">Email</TableHead>
                {role === "admin" && <TableHead className="text-white">Limit</TableHead>}
                <TableHead className="text-white">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="text-zinc-300">{user.firstname}</TableCell>
                  <TableCell className="text-zinc-300">{user.lastname}</TableCell>
                  <TableCell className="text-zinc-300">{user.email}</TableCell>
                  {role === "admin" && (
                    <TableCell className="text-zinc-300">{user.manager_limit_pln ?? "-"}</TableCell>
                  )}
                  <TableCell className="flex gap-2">
                    <Button size="icon" variant="outline" onClick={() => openEdit(user)}>
                      <Pencil size={16} />
                    </Button>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="destructive" onClick={() => setDeleteUserId(user.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </AlertDialogTrigger>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

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

      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent className="bg-zinc-900 border border-zinc-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć tego użytkownika?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setDeleteUserId(null)}>Anuluj</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  await fetchWithAuth(`/api/users/${deleteUserId}`, { method: "DELETE" })
                  setDeleteUserId(null)
                  fetchUsers()
                } catch (err) {
                  console.error("Błąd przy usuwaniu:", err)
                }
              }}
            >
              Usuń
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
