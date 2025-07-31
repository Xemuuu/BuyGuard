'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormEvent, useRef } from 'react';
import Image from "next/image";
import { fetchWithAuth } from "@/lib/utils"

interface RequestItem {
  id: number
  title: string
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "PURCHASED"
  amountPln: number
  createdAt: string
  reason: string
  authorFirstName?: string
  authorLastName?: string
  url?: string
}
type Request = {
  id: number
  title: string
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "PURCHASED"
  amountPln: number
  createdAt: string
  reason: string
}


export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [requestsTimestamp, setRequestsTimestamp] = useState<number>(Date.now());
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [editMsg, setEditMsg] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [newReqLoading, setNewReqLoading] = useState(false);
  const [newReqMsg, setNewReqMsg] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const [newReqError, setNewReqError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [notifyLoading, setNotifyLoading] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEditRequest, setShowEditRequest] = useState<number | null>(null);
  const [editRequestLoading, setEditRequestLoading] = useState(false);
  const [editRequestMsg, setEditRequestMsg] = useState<string | null>(null);
  async function fetchRequestsAndStats() {
  const queryParams = new URLSearchParams()

  if (filters.search) queryParams.append("search", filters.search)
  if (filters.status) queryParams.append("status", filters.status)
  if (filters.minAmount) queryParams.append("minAmount", filters.minAmount)
  if (filters.maxAmount) queryParams.append("maxAmount", filters.maxAmount)
  if (filters.startDate) queryParams.append("startDate", filters.startDate)
  if (filters.endDate) queryParams.append("endDate", filters.endDate)
  if (filters.sortBy) queryParams.append("sortBy", filters.sortBy)
  if (filters.sortOrder) queryParams.append("sortOrder", filters.sortOrder)

const data: Request[] = await fetchWithAuth(`/api/requests?${queryParams.toString()}`)
setRequests(data)


  // Prosty oblicz statystyki lokalnie
  const total = data.length
  const pending = data.filter(r => r.status === "PENDING").length
  const accepted = data.filter(r => r.status === "ACCEPTED").length
  const rejected = data.filter(r => r.status === "REJECTED").length
  const purchased = data.filter(r => r.status === "PURCHASED").length
  const totalAmount = data.reduce((sum, r) => sum + r.amountPln, 0)
  const averageAmount = total > 0 ? totalAmount / total : 0

  setStats({ total, pending, accepted, rejected, purchased, totalAmount, averageAmount })
}

  interface DashboardStats {
  total: number
  pending: number
  accepted: number
  rejected: number
  purchased: number
  totalAmount: number
  averageAmount: number

}

const [stats, setStats] = useState<DashboardStats | null>(null)
const [filters, setFilters] = useState({
  search: "",
  status: "",
  minAmount: "",
  maxAmount: "",
  startDate: "",
  endDate: "",
  sortBy: "",
  sortOrder: "desc"
})


  // do pobierania
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("monthly");
  const [reportFormat, setReportFormat] = useState("csv");
  const [reportLoading, setReportLoading] = useState(false);

  // Refs for edit form
  const emailRef = useRef<HTMLInputElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);

  // Refs for password form
  const oldPasswordRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmNewPasswordRef = useRef<HTMLInputElement>(null);

  // Refs for edit request form
  const editTitleRef = useRef<HTMLInputElement>(null);
  const editPriceRef = useRef<HTMLInputElement>(null);
  const editReasonRef = useRef<HTMLTextAreaElement>(null);
  const editUrlRef = useRef<HTMLInputElement>(null);

  // Funkcja do odświeżenia requestów
const fetchRequests = async (filters?: {
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  fromDate?: string;
  toDate?: string;
  search?: string;
}) => {
  const token = localStorage.getItem('token');
  if (!token) return;

  const query = new URLSearchParams();
  if (filters?.status) query.append('status', filters.status);
  if (filters?.minAmount) query.append('minAmount', filters.minAmount.toString());
  if (filters?.maxAmount) query.append('maxAmount', filters.maxAmount.toString());
  if (filters?.fromDate) query.append('fromDate', filters.fromDate);
  if (filters?.toDate) query.append('toDate', filters.toDate);
  if (filters?.search) query.append('search', filters.search);

  try {
    const res = await fetch(`http://localhost:5252/api/requests?${query.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      setRequests(data);
      setRequestsTimestamp(Date.now());
    } else {
      console.error('Błąd pobierania zgłoszeń:', res.status);
    }
  } catch (err) {
    console.error('Błąd sieci:', err);
  }
};


  // Funkcja do pobierania powiadomień
  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5252/api/notifications', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const notificationsData = await res.json();
        setNotifications(notificationsData);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  // ... inne funkcje, np. markAllAsRead
  
const downloadReport = async () => {
  const token = localStorage.getItem("token");
  if (!token) return;

  setReportLoading(true);

  try {
const query = new URLSearchParams();
if (reportType === "monthly") {
  const now = new Date();
  query.append("month", (now.getMonth() + 1).toString());
  query.append("year", now.getFullYear().toString());
}
query.append("format", reportFormat);

const res = await fetch(`http://localhost:5252/api/requests/export?${query.toString()}`, {
  method: "GET", // ✅
  headers: {
    Authorization: `Bearer ${token}`,
  },
});


    if (!res.ok) {
      alert("Błąd pobierania raportu");
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `raport-${reportType}.${reportFormat}`;
    a.click();
    window.URL.revokeObjectURL(url);
    setShowReportModal(false);
  } catch (err) {
    console.error("Błąd raportu:", err);
    alert("Błąd pobierania raportu");
  } finally {
    setReportLoading(false);
  }
};


  // Funkcja do oznaczania powiadomienia jako przeczytane
  const markAsRead = async (notificationId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5252/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        await fetchNotifications();
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Funkcja do oznaczania wszystkich powiadomień jako przeczytane
  const markAllAsRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5252/api/notifications/read-all', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        await fetchNotifications();
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Funkcja do usuwania powiadomienia
  const deleteNotification = async (notificationId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5252/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        await fetchNotifications();
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };
// debug
useEffect(() => {
  fetchWithAuth("/api/users/whoami").then((me) => {
    console.log("Zalogowany użytkownik:", me)
  })
}, [])



  useEffect(() => {
  fetchRequestsAndStats();
}, [filters]);
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        // Pobierz dane użytkownika
        const res = await fetch('http://localhost:5252/api/auth/whoami', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
  const text = await res.text()
  throw new Error(`Login failed: ${text}`)
}
        const json = await res.json();
        setData(json);
        console.log('=== WHOAMI RESPONSE ===');
        console.log('Full response:', json);
        console.log('ManagerId:', json.ManagerId);
        console.log('Manager object:', json.Manager);
        console.log('Has ManagerId:', !!json.ManagerId);
        console.log('Has Manager object:', !!json.Manager);
        console.log('======================');

        // Pobierz zgłoszenia użytkownika
        await fetchRequests();
        
        // Pobierz powiadomienia (tylko dla pracownika)
        if (Array.isArray(json.roles) && json.roles.includes('employee')) {
          await fetchNotifications();
        }
      } catch (err) {
        console.error(err);
        setError('Unauthorized');
        localStorage.removeItem('token');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Mapowanie statusów liczbowych na stringi i odwrotnie
  const statusMap: { [key: number]: string } = {
    0: "PENDING",
    1: "ACCEPTED",
    2: "REJECTED",
    3: "PURCHASED"
  };
  const statusReverseMap = {
    "PENDING": 0,
    "ACCEPTED": 1,
    "REJECTED": 2,
    "PURCHASED": 3
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white relative flex flex-col">
      <main className="flex-1 flex flex-col p-2 sm:p-4">
        <div className="absolute top-6 right-6 flex gap-2 z-50">
          <button
            onClick={() => setShowRequests(true)}
            className="bg-zinc-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
          >
            Show requests
          </button>
          <button
            onClick={() => setShowReportModal(true)}
            className="bg-zinc-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
          >
            Download raport
          </button>
          {/* Przycisk powiadomień tylko dla pracownika */}
          {Array.isArray(data?.roles) && data.roles.includes('employee') && (
            <button
              onClick={() => setShowNotifications(true)}
              className="bg-zinc-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition relative"
            >
              Notifications
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => {
              console.log('Logging out...');
              localStorage.removeItem('token');
              console.log('Token removed from localStorage');
              console.log('Navigating to /');
              window.location.href = '/';
            }}
            className="bg-zinc-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
          >
            Log out
          </button>
        </div>
        <h1 className="text-2xl font-bold mb-4 text-center">Dashboard</h1>

        {loading && <p>Loading data...</p>}
        {error && <p className="text-red-400">{error}</p>}

        {data && (
          <div className="mb-8 flex justify-center">
            <div className="w-full max-w-sm">
              <h2 className="text-lg font-semibold mb-2 text-center">User data</h2>
              <div className="bg-zinc-800 p-3 rounded-lg shadow-md mb-2">
                <div className="mb-2"><span className="font-semibold">Email:</span> {data.Email || data.email}</div>
                <div className="mb-2"><span className="font-semibold">Name:</span> {data.FirstName || data.firstName || ''} {data.LastName || data.lastName || ''}</div>
                <div className="mb-2"><span className="font-semibold">Role:</span> {Array.isArray(data.Roles) ? data.Roles.join(', ') : (data.Roles || data.roles)}</div>
                <div className="mb-2"><span className="font-semibold">Manager:</span> {data.Manager ? `${data.Manager.FirstName} ${data.Manager.LastName}` : 'Brak'}</div>
                <button
                  type="button"
                  className="bg-zinc-600 text-white px-4 py-1 rounded-md hover:bg-gray-700 transition mr-2"
                  onClick={() => setShowEdit((v) => !v)}
                >
                  {showEdit ? 'Cancel' : 'Edit user data'}
                </button>
                <button
                  type="button"
                  className="bg-zinc-600 text-white px-4 py-1 rounded-md hover:bg-gray-700 transition"
                  onClick={() => setShowPasswordForm((v) => !v)}
                >
                  {showPasswordForm ? 'Cancel' : 'Change password'}
                </button>
                {Array.isArray(data.Roles) && data.Roles.includes('admin') && (
                  <button
                    type="button"
                    className="bg-purple-600 text-white px-4 py-1 rounded-md hover:bg-purple-700 transition ml-2"
                    onClick={async () => {
                      const token = localStorage.getItem('token');
                      if (!token) return;
                      try {
                        const res = await fetch('http://localhost:5252/api/auth/assign-manager', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({
                            EmployeeId: 3, // ID pracownika
                            ManagerId: 2   // ID managera
                          }),
                        });
                        if (res.ok) {
                          const result = await res.json();
                          alert(result.message);
                          window.location.reload();
                        } else {
                          alert('Error assigning manager');
                        }
                      } catch (err) {
                        alert('Error assigning manager');
                      }
                    }}
                  >
                    Assign Manager
                  </button>
                )}
              </div>

              {showEdit && (
                <form
                  className="mb-3 bg-zinc-800 p-3 rounded-lg shadow-md"
                  onSubmit={async (e: FormEvent) => {
                    e.preventDefault();
                    setEditMsg(null);
                    setEditLoading(true);
                    const token = localStorage.getItem('token');
                    if (!token) return;
                    type EditUserPayload = {
                      email?: string;
                      firstName?: string;
                      lastName?: string;
                    };
                    const body: EditUserPayload = {};
                    
                    const email = emailRef.current?.value?.trim();
                    if (email && email !== (data.Email || data.email)) {
                      body.email = email;
                    }
                    
                    const firstName = firstNameRef.current?.value?.trim();
                    if (firstName) {
                      body.firstName = firstName;
                    }
                    
                    const lastName = lastNameRef.current?.value?.trim();
                    if (lastName) {
                      body.lastName = lastName;
                    }
                    try {
                      const res = await fetch(`http://localhost:5252/api/users/profile`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(body),
                      });
                      if (res.ok) {
                        setEditMsg('User data updated!');
                        // Jeśli zmieniono email, wyloguj użytkownika
                        if (body.email) {
                          setEditMsg('Email changed! Redirecting to login...');
                          setTimeout(() => {
                            localStorage.removeItem('token');
                            window.location.href = '/';
                          }, 2000);
                        } else {
                          // Odśwież dane użytkownika przez whoami
                          try {
                            const whoamiRes = await fetch('http://localhost:5252/api/auth/whoami', {
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                              },
                            });
                            if (whoamiRes.ok) {
                              const whoamiData = await whoamiRes.json();
                              setData(whoamiData);
                            }
                          } catch (err) {
                            console.error('Error refreshing user data:', err);
                          }
                        }
                      } else {
                        let errorMessage = 'Error updating user data';
                        try {
                          const err = await res.json();
                          errorMessage = err.message || errorMessage;
                        } catch {
                          // Jeśli nie można sparsować JSON, użyj statusu
                          if (res.status === 403) {
                            errorMessage = 'Brak uprawnień do edycji danych';
                          } else if (res.status === 400) {
                            errorMessage = 'Nieprawidłowe dane';
                          } else if (res.status === 500) {
                            errorMessage = 'Błąd serwera';
                          }
                        }
                        console.error('User update error:', res.status, errorMessage);
                        setEditMsg(errorMessage);
                      }
                    } catch (err) {
                      console.error('User update exception:', err);
                      setEditMsg('Error updating user data');
                    } finally {
                      setEditLoading(false);
                    }
                  }}
                >
                  <h3 className="font-semibold mb-2">Edit user data</h3>
                  <div className="flex flex-col gap-1 mb-2">
                    <input ref={emailRef} type="email" placeholder="New email" className="bg-gray-700 border border-gray-600 p-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" defaultValue={data.Email || data.email} />
                    <input ref={firstNameRef} type="text" placeholder="First name" className="bg-gray-700 border border-gray-600 p-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" defaultValue={data.FirstName || data.firstName || ''} />
                    <input ref={lastNameRef} type="text" placeholder="Last name" className="bg-gray-700 border border-gray-600 p-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" defaultValue={data.LastName || data.lastName || ''} />
                  </div>
                  <button type="submit" className="bg-zinc-600 px-4 py-2 rounded-md hover:bg-zinc-700 transition w-full" disabled={editLoading}>
                    {editLoading ? 'Saving...' : 'Save changes'}
                  </button>
                  {editMsg && <div className="mt-2 text-sm text-yellow-400">{editMsg}</div>}
                </form>
              )}

              {showPasswordForm && (
                <form
                  onSubmit={async (e: FormEvent) => {
                    e.preventDefault();
                    setPasswordMsg(null);
                    setPasswordLoading(true);
                    const token = localStorage.getItem('token');
                    if (!token) return;
                    const body = {
                      OldPassword: oldPasswordRef.current?.value || '',
                      NewPassword: newPasswordRef.current?.value || '',
                      ConfirmNewPassword: confirmNewPasswordRef.current?.value || '',
                    };
                    try {
                      const res = await fetch('http://localhost:5252/api/account/change-password', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(body),
                      });
                      if (res.ok) {
                        setPasswordMsg('Password changed! Redirecting to login...');
                        // Po zmianie hasła wyloguj użytkownika
                        setTimeout(() => {
                          localStorage.removeItem('token');
                          window.location.href = '/';
                        }, 2000);
                      } else {
                        let errorMessage = 'Error changing password';
                        try {
                          const err = await res.json();
                          errorMessage = err.message || errorMessage;
                        } catch {
                          // Jeśli nie można sparsować JSON, użyj statusu
                          if (res.status === 400) {
                            errorMessage = 'Nieprawidłowe hasło';
                          } else if (res.status === 500) {
                            errorMessage = 'Błąd serwera podczas zmiany hasła';
                          }
                        }
                        console.error('Password change error:', res.status, errorMessage);
                        setPasswordMsg(errorMessage);
                      }
                    } catch (err) {
                      console.error('Password change exception:', err);
                      setPasswordMsg('Error changing password');
                    } finally {
                      setPasswordLoading(false);
                    }
                  }}
                  className="mb-4 bg-zinc-800 p-4 rounded-lg shadow-md"
                >
                  <h3 className="font-semibold mb-2">Change password</h3>
                  <div className="flex flex-col gap-2 mb-2">
                    <input ref={oldPasswordRef} type="password" placeholder="Old password" className="bg-gray-700 border border-gray-600 p-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    <input ref={newPasswordRef} type="password" placeholder="New password" className="bg-gray-700 border border-gray-600 p-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" required minLength={8} />
                    <input ref={confirmNewPasswordRef} type="password" placeholder="Confirm new password" className="bg-gray-700 border border-gray-600 p-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" required minLength={8} />
                  </div>
                  <button type="submit" className="bg-zinc-600 px-4 py-2 rounded-md hover:bg-zinc-700 transition w-full" disabled={passwordLoading}>
                    {passwordLoading ? 'Saving...' : 'Change password'}
                  </button>
                  {passwordMsg && <div className="mt-2 text-sm text-yellow-400">{passwordMsg}</div>}
                </form>
              )}
            </div>
          </div>
        )}

        {showRequests && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="fixed inset-0 bg-black bg-opacity-40"
              onClick={() => setShowRequests(false)}
            />
            <div className="relative w-full max-w-3xl bg-zinc-900 shadow-xl p-4 rounded-lg mx-2 animate-slide-in-down">
              <button
                className="absolute top-4 right-4 text-zinc-400 hover:text-white text-2xl"
                onClick={() => setShowRequests(false)}
                aria-label="Close"
              >
                &times;
              </button>
<>
  <h2 className="text-xl font-semibold mb-4 text-center">
    {data.roles.includes('employee') ? 'Your requests' : 'Requests'}
  </h2>

  <div className="mb-4 grid grid-cols-1 md:grid-cols-7 gap-3">
    <input
      type="text"
      placeholder="Szukaj po tytule"
      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
      className="bg-zinc-700 p-2 rounded"
    />
    <select
      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
      className="bg-zinc-700 p-2 rounded"
    >
      <option value="">Status</option>
      <option value="PENDING">PENDING</option>
      <option value="ACCEPTED">ACCEPTED</option>
      <option value="REJECTED">REJECTED</option>
      <option value="PURCHASED">PURCHASED</option>
    </select>
    <input
      type="number"
      placeholder="Min kwota"
      onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
      className="bg-zinc-700 p-2 rounded"
    />
    <input
      type="number"
      placeholder="Max kwota"
      onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
      className="bg-zinc-700 p-2 rounded"
    />
    <input
      type="date"
      onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
      className="bg-zinc-700 p-2 rounded"
    />
    <input
      type="date"
      onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
      className="bg-zinc-700 p-2 rounded"
    />
    <select
      onChange={(e) => {
        const [sortBy, sortOrder] = e.target.value.split('|');
        setFilters(prev => ({ ...prev, sortBy, sortOrder }));
      }}
      className="bg-zinc-700 p-2 rounded"
    >
  <option value="">Sort by</option>
  <option value="amount|asc">Price ↑</option>
  <option value="amount|desc">Price ↓</option>
  <option value="date|asc">Date ↑</option>
  <option value="date|desc">Date ↓</option>
  <option value="title|asc">Title A→Z</option>
  <option value="title|desc">Title Z→A</option>
    </select>
  </div>
</>


              {(data.roles.includes('employee')
              ) && (
                  <div className="flex justify-end mb-3">
                    <button
                      className="bg-zinc-600 absolute top-4 right-12 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
                      onClick={() => setShowNewRequest(true)}
                    >
                      New request
                    </button>
                  </div>
                )}


{stats && (
  <div className="mb-4 text-sm text-zinc-300 space-y-1">
    <p><strong>Łączna liczba zgłoszeń:</strong> {stats.total}</p>
    <p><strong>Oczekujące:</strong> {stats.pending} | <strong>Zaakceptowane:</strong> {stats.accepted} | <strong>Odrzucone:</strong> {stats.rejected} | <strong>Zrealizowane:</strong> {stats.purchased}</p>
    <p><strong>Łączna kwota:</strong> {stats.totalAmount.toFixed(2)} PLN | <strong>Średnia kwota:</strong> {stats.averageAmount.toFixed(2)} PLN</p>
  </div>
)}

              {requests.length === 0 ? (
                
                <p className="text-zinc-400">No requests.</p>
              ) : (
                <table key={requestsTimestamp} className="min-w-full bg-zinc-800 rounded-md text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left">ID</th>
                      <th className="px-4 py-2 text-left">Title</th>
                      <th className="px-4 py-2 text-left">Price (PLN)</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Created</th>
                      <th className="px-4 py-2 text-left">Reason</th>
                      {Array.isArray(data.roles) && data.roles.includes('manager') && (
                        <th className="px-4 py-2 text-left">Actions</th>
                      )}
                      {Array.isArray(data.roles) && data.roles.includes('employee') && (
                        <th className="px-4 py-2 text-left">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr key={`${req.id}-${req.status}-${requestsTimestamp}`} className="border-b border-zinc-700 last:border-b-0">
                        <td className="px-4 py-2">{req.id}</td>
                        <td className="px-4 py-2">{req.title}</td>
                        <td className="px-4 py-2">{req.amountPln}</td>
                        <td className="px-4 py-2">
                          <select
                            value={req.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              console.log(`Updating status for request ${req.id} to ${newStatus}`);
                              setUpdatingStatus(req.id);
                              try {
                                const token = localStorage.getItem("token");
                                const res = await fetch(`http://localhost:5252/api/requests/${req.id}/status`, {
                                  method: "PATCH",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`,
                                  },
                                  body: JSON.stringify({ newStatus }),
                                });
                                if (!res.ok) {
                                  console.error("Error updating status:", res.status, res.statusText);
                                  return;
                                }
                                const responseData = await res.json();
                                console.log(`Status updated successfully for request ${req.id}`, responseData);
                                await fetchRequests();
                              } catch (err) {
                                console.error("Błąd aktualizacji statusu:", err);
                              } finally {
                                setUpdatingStatus(null);
                              }
                            }}
                            className="bg-zinc-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
                            disabled={updatingStatus === req.id || (Array.isArray(data.roles) && data.roles.includes('employee'))}
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="ACCEPTED">ACCEPTED</option>
                            <option value="REJECTED">REJECTED</option>
                            <option value="PURCHASED">PURCHASED</option>
                          </select>
                          {updatingStatus === req.id && <span className="ml-2 text-xs text-yellow-400">Updating...</span>}
                        </td>
                        <td className="px-4 py-2">{new Date(req.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-2">{req.reason || '-'}</td>
                        {Array.isArray(data.roles) && data.roles.includes('manager') && (
                          <td className="px-4 py-2">
                            <button
                              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm"
                              disabled={notifyLoading === req.id}
                              onClick={async () => {
                                setNotifyLoading(req.id);
                                try {
                                  const token = localStorage.getItem("token");
                                  const res = await fetch(`http://localhost:5252/api/requests/${req.id}/notify`, {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`,
                                    },
                                  });
                                  if (!res.ok) {
                                    console.error("Error sending notification:", res.status, res.statusText);
                                    return;
                                  }
                                  const responseData = await res.json();
                                  console.log("Notification sent:", responseData);
                                  // Odśwież listę zgłoszeń, żeby usunięte zgłoszenie zniknęło
                                  await fetchRequests();
                                } catch (err) {
                                  console.error("Błąd wysyłania powiadomienia:", err);
                                } finally {
                                  setNotifyLoading(null);
                                }
                              }}
                            >
                              {notifyLoading === req.id ? 'Wysyłanie...' : 'Submit'}
                            </button>
                          </td>
                        )}
                        {/* Przycisk edycji tylko dla pracownika i zgłoszeń PENDING */}
                        {Array.isArray(data.roles) && data.roles.includes('employee') && req.status === "PENDING" && (
                          <td className="px-4 py-2">
                            <button
                              className="bg-zinc-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition text-sm"
                              onClick={() => setShowEditRequest(req.id)}
                            >
                              Edit
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {showNewRequest && (
                <div className="fixed inset-0 z-60 flex items-center justify-center">
                  <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowNewRequest(false)} />
                  <form
                    className="relative bg-zinc-900 p-4 rounded-lg shadow-xl w-full max-w-sm mx-2 animate-slide-in-down"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setNewReqMsg(null);
                      setNewReqError(null);
                      setNewReqLoading(true);
                      const token = localStorage.getItem('token');
                      if (!token) return;
                      const amount = parseFloat(priceRef.current?.value || '0');
                      if (amount > 100000) {
                        setNewReqError('Maximum amount is 100,000 PLN');
                        setNewReqLoading(false);
                        return;
                      }
                      const body = {
                        Title: titleRef.current?.value || '',
                        Url: urlRef.current?.value || '',
                        AmountPln: amount,
                        Reason: reasonRef.current?.value || '',
                      };
                      try {
                        const res = await fetch('http://localhost:5252/api/requests', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify(body),
                        });
                        if (res.ok) {
                          setNewReqMsg('Request created!');
                          await fetchRequests();
                          setTimeout(() => {
                            setShowNewRequest(false);
                            setNewReqMsg(null);
                          }, 1000);
                        } else {
                          const err = await res.json();
                          setNewReqMsg(err.message || 'Error creating request');
                        }
                      } catch (err) {
                        setNewReqMsg('Error creating request');
                      } finally {
                        setNewReqLoading(false);
                      }
                    }}
                  >
                    <button
                      className="absolute top-4 right-4 text-zinc-400 hover:text-white text-2xl"
                      type="button"
                      onClick={() => setShowNewRequest(false)}
                      aria-label="Close"
                    >
                      &times;
                    </button>
                    <h3 className="text-base font-semibold mb-3 text-center">New request</h3>
                    <div className="flex flex-col gap-1 mb-2">
                      <input ref={titleRef} type="text" placeholder="Title" className="bg-gray-700 border border-gray-600 p-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                      <input ref={urlRef} type="url" placeholder="Purchase link (URL)" className="bg-gray-700 border border-gray-600 p-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <input ref={priceRef} type="number" step="0.01" min="0" max="100000" placeholder="Price (PLN)" className="bg-gray-700 border border-gray-600 p-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                      <textarea ref={reasonRef} placeholder="Reason" className="bg-gray-700 border border-gray-600 p-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    {newReqError && <div className="text-red-400 text-sm mb-2 text-center">{newReqError}</div>}
                    <button type="submit" className="bg-zinc-600 px-4 py-2 rounded-md hover:bg-zinc-700 transition w-full" disabled={newReqLoading}>
                      {newReqLoading ? 'Saving...' : 'Create request'}
                    </button>
                    {newReqMsg && <div className="mt-2 text-sm text-yellow-400 text-center">{newReqMsg}</div>}
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Modal z powiadomieniami */}
        {showNotifications && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-40"
              onClick={() => setShowNotifications(false)}
            />
            <div className="relative w-full max-w-2xl bg-zinc-900 shadow-xl rounded-lg animate-slide-in-down flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-zinc-700">
                <button
                  className="absolute top-4 right-4 text-zinc-400 hover:text-white text-2xl"
                  onClick={() => setShowNotifications(false)}
                  aria-label="Close"
                >
                  &times;
                </button>
                <h2 className="text-xl font-semibold text-center">Powiadomienia</h2>
              </div>
              
              <div className="flex-1 overflow-hidden">
                {notifications.length === 0 ? (
                  <div className="p-4">
                    <p className="text-zinc-400 text-center">Brak powiadomień.</p>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="flex justify-end p-4 border-b border-zinc-700">
                      <button
                        onClick={markAllAsRead}
                        className="bg-zinc-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition"
                      >
                        Mark all as read
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg border ${
                            notification.isRead ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-700 border-zinc-600'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-white">{notification.title}</h3>
                              <p className="text-sm text-zinc-300 mt-1">{notification.message}</p>
                              <p className="text-xs text-zinc-400 mt-2">
                                Zgłoszenie: {notification.requestTitle} | 
                                Od: {notification.senderName} | 
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex flex-col gap-1 ml-2">
                              {!notification.isRead && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="bg-zinc-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700 transition"
                                >
                                  Mark as read
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="bg-zinc-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700 transition"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal edycji zgłoszenia */}
        {showEditRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="fixed inset-0 bg-black bg-opacity-40"
              onClick={() => setShowEditRequest(null)}
            />
            <div className="relative w-full max-w-md bg-zinc-900 shadow-xl p-4 rounded-lg mx-2 animate-slide-in-down">
              <button
                className="absolute top-4 right-4 text-zinc-400 hover:text-white text-2xl"
                onClick={() => setShowEditRequest(null)}
                aria-label="Close"
              >
                &times;
              </button>
              <h3 className="text-lg font-semibold mb-4 text-center">Edit Request</h3>
              
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setEditRequestMsg(null);
                  setEditRequestLoading(true);
                  
                  const token = localStorage.getItem('token');
                  if (!token) return;
                  
                  const body: any = {};
                  
                  const title = editTitleRef.current?.value?.trim();
                  if (title) body.Title = title;
                  
                  const url = editUrlRef.current?.value?.trim();
                  if (url) body.Url = url;
                  
                  const price = parseFloat(editPriceRef.current?.value || '0');
                  if (price > 0) body.AmountPln = price;
                  
                  const reason = editReasonRef.current?.value?.trim();
                  if (reason) body.Reason = reason;
                  
                  try {
                    const res = await fetch(`http://localhost:5252/api/requests/${showEditRequest}/edit`, {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify(body),
                    });
                    
                    if (res.ok) {
                      setEditRequestMsg('Request updated successfully!');
                      await fetchRequests();
                      setTimeout(() => {
                        setShowEditRequest(null);
                        setEditRequestMsg(null);
                      }, 1000);
                    } else {
                      const err = await res.json();
                      console.error('Request update error:', err);
                      setEditRequestMsg(err.message || 'Error updating request');
                    }
                  } catch (err) {
                    console.error('Request update exception:', err);
                    setEditRequestMsg('Error updating request');
                  } finally {
                    setEditRequestLoading(false);
                  }
                }}
              >
                <div className="space-y-3">
                  <input
                    ref={editTitleRef}
                    type="text"
                    placeholder="Title"
                    defaultValue={requests.find(r => r.id === showEditRequest)?.title || ''}
                    className="w-full bg-gray-700 border border-gray-600 p-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    ref={editUrlRef}
                    type="url"
                    placeholder="Purchase link (URL)"
                    defaultValue={requests.find(r => r.id === showEditRequest)?.url || ''}
                    className="w-full bg-gray-700 border border-gray-600 p-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    ref={editPriceRef}
                    type="number"
                    step="0.01"
                    min="0"
                    max="100000"
                    placeholder="Price (PLN)"
                    defaultValue={requests.find(r => r.id === showEditRequest)?.amountPln || ''}
                    className="w-full bg-gray-700 border border-gray-600 p-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    ref={editReasonRef}
                    placeholder="Reason"
                    defaultValue={requests.find(r => r.id === showEditRequest)?.reason || ''}
                    className="w-full bg-gray-700 border border-gray-600 p-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-zinc-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition mt-4"
                  disabled={editRequestLoading}
                >
                  {editRequestLoading ? 'Updating...' : 'Update Request'}
                </button>
                
                {editRequestMsg && (
                  <div className="mt-2 text-sm text-yellow-400 text-center">{editRequestMsg}</div>
                )}
              </form>
            </div>
          </div>
        )}
        <style jsx global>{`
@keyframes slide-in-right {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
.animate-slide-in-right {
  animation: slide-in-right 0.3s cubic-bezier(0.4,0,0.2,1);
}
@keyframes slide-in-down {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}
.animate-slide-in-down {
  animation: slide-in-down 0.3s cubic-bezier(0.4,0,0.2,1);
}
`}</style>
        <div className="fixed bottom-0 left-0 w-full flex justify-center z-40 pointer-events-none select-none">
          <Image
            src="/logobg.png"
            alt="BuyGuard logo"
            width={72}
            height={72}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          />
        </div>
        {showReportModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div
      className="fixed inset-0 bg-black bg-opacity-40"
      onClick={() => setShowReportModal(false)}
    />
    <div className="relative bg-zinc-900 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 animate-slide-in-down">
      <button
        className="absolute top-3 right-4 text-zinc-400 hover:text-white text-2xl"
        onClick={() => setShowReportModal(false)}
        aria-label="Close"
      >
        &times;
      </button>
      <h3 className="text-lg font-semibold mb-4 text-center">Download raport</h3>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">
          Type:
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="mt-1 w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-2"
          >
            <option value="monthly">Monthly</option>
            <option value="all">Całościowy</option>
          </select>
        </label>

        <label className="text-sm font-medium">
          Format:
          <select
            value={reportFormat}
            onChange={(e) => setReportFormat(e.target.value)}
            className="mt-1 w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-2"
          >
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
        </label>

        <button
          onClick={downloadReport}
          disabled={reportLoading}
          className="mt-4 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
        >
          {reportLoading ? "Generating..." : "Download"}
        </button>
      </div>
    </div>
  </div>
)}

      </main>

    </div>
  );
}
