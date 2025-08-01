"use client"

import { useEffect, useState } from "react"
import { fetchWithAuth } from "@/lib/utils"

import { useRouter } from "next/navigation"

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
  firstName: string
  lastName: string
  email: string
  role: string
  managerLimitPln?: number
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

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const payload: any = {
      firstName: newUser.firstname,
      lastName: newUser.lastname,
      email: newUser.email,
      password: newUser.password,
      role: role === "admin" ? "manager" : "user"
    }

    if (role === "admin") {
      payload.managerLimitPln = Number(newUser.manager_limit_pln)
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
        firstname: editUser.firstName,
        lastname: editUser.lastName,
        email: editUser.email,
        password: "",
        manager_limit_pln: editUser.managerLimitPln?.toString() ?? ""
      })
    }
  }, [editUser])

  async function fetchRole() {
    const me = await fetchWithAuth("/api/users/whoami")
    console.log("Rola: ", me.roles?.[0]) // debug
    setRole(me.roles?.[0] ?? "user")
  }

  async function fetchUsers() {
    const res = await fetchWithAuth(`/api/users?page=${page}&limit=10`)
    console.log("Dane z backendu", res) // debug

    setUsers(res ?? [])
    setTotalPages(1)
  }

  return (
    <main className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center px-4 py-6">
      <button
            onClick={() => {
              localStorage.removeItem('token');
              router.push('/');
            }}
            className="bg-zinc-600 absolute top-4 right-10 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
          >
            Log out
          </button>
          <button
            onClick={() => {
              router.push('/dashboard');
            }}
            className="bg-zinc-600 absolute top-4 left-10 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
          >
            Dashboard
          </button>
      <div className="bg-zinc-800 p-4 rounded-lg shadow-md w-full max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold text-white text-center">Lista użytkowników</h1>
        
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="bg-zinc-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
                onClick={() => {
                setEditUser(null);
                setNewUser({
                  firstname: "",
                  lastname: "",
                  email: "",
                  password: "",
                  manager_limit_pln: ""
                });
              }}>
              {role === "admin" ? "Dodaj menedżera" : "Dodaj pracownika"}
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
                <TableHead className="text-white">Rola</TableHead>
                {role === "admin" && <TableHead className="text-white">Limit</TableHead>}
                <TableHead className="text-white">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="text-zinc-300">{user.firstName}</TableCell>
                  <TableCell className="text-zinc-300">{user.lastName}</TableCell>
                  <TableCell className="text-zinc-300">{user.email}</TableCell>
                  <TableCell className="text-zinc-300">{user.role}</TableCell>
                  {role === "admin" && (
                    <TableCell className="text-zinc-300">{user.managerLimitPln ?? "-"}</TableCell>
                  )}
                  <TableCell className="flex gap-2">
                    <Button size="icon" className="bg-zinc-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition" onClick={() => openEdit(user)}>
                      <Pencil size={16} />
                    </Button>
                      <Button size="icon" className="bg-zinc-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition" onClick={() => setDeleteUserId(user.id)}>
                        <Trash2 size={16} />
                      </Button>
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
            className="bg-zinc-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
          >
            Poprzednia
          </Button>
          <span className="text-zinc-300 pt-2">Strona {page}</span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="bg-zinc-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
          >
            Następna
          </Button>
        </div>
      </div>

      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent className="bg-zinc-600 text-white px-4 py-2 rounded-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć tego użytkownika?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4">
            <Button variant="outline" className="bg-zinc-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition" onClick={() => setDeleteUserId(null)}>Anuluj</Button>
            <Button
            variant="outline"
            className="bg-zinc-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
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
