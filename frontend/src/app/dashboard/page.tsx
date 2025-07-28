'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormEvent, useRef } from 'react';
import Image from "next/image";

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
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

  // Refs for edit form
  const emailRef = useRef<HTMLInputElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);

  // Refs for password form
  const oldPasswordRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmNewPasswordRef = useRef<HTMLInputElement>(null);

  // Funkcja do odświeżenia requestów
  const fetchRequests = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const reqRes = await fetch('http://localhost:5252/api/requests', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (reqRes.ok) {
      const reqJson = await reqRes.json();
      setRequests(reqJson);
    }
  };

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

        if (!res.ok) throw new Error('Unauthorized');
        const json = await res.json();
        setData(json);
        console.log('User data:', json);

        // Pobierz zgłoszenia użytkownika
        await fetchRequests();
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
  }, [router]);

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
            onClick={() => {
              localStorage.removeItem('token');
              router.push('/');
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
                <div className="mb-2"><span className="font-semibold">Role:</span> {Array.isArray(data.Roles) ? data.Roles.join(', ') : (data.Roles || data.roles)}</div>
                <button
                  type="button"
                  className="bg-zinc-600 text-white px-4 py-1 rounded-md hover:bg-gray-700 transition mr-2"
                  onClick={() => setShowEdit((v) => !v)}
                >
                  {showEdit ? 'Cancel' : 'Edit'}
                </button>
                <button
                  type="button"
                  className="bg-zinc-600 text-white px-4 py-1 rounded-md hover:bg-gray-700 transition"
                  onClick={() => setShowPasswordForm((v) => !v)}
                >
                  {showPasswordForm ? 'Cancel' : 'Change password'}
                </button>
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
                    if (emailRef.current?.value && emailRef.current.value !== (data.Email || data.email)) {
                      body.email = emailRef.current.value;
                    }
                    if (firstNameRef.current?.value) {
                      body.firstName = firstNameRef.current.value;
                    }
                    if (lastNameRef.current?.value) {
                      body.lastName = lastNameRef.current.value;
                    }
                    try {
                      const userId = data.UserId || data.userId || data.id;
                      const res = await fetch(`http://localhost:5252/api/users/${userId}`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(body),
                      });
                      if (res.ok) {
                        setEditMsg('User data updated!');
                      } else {
                        const err = await res.json();
                        setEditMsg(err.message || 'Error updating user data');
                      }
                    } catch (err) {
                      setEditMsg('Error updating user data');
                    } finally {
                      setEditLoading(false);
                    }
                  }}
                >
                  <h3 className="font-semibold mb-2">Edit user data</h3>
                  <div className="flex flex-col gap-1 mb-2">
                    <input ref={emailRef} type="email" placeholder="New email" className="bg-gray-700 border border-gray-600 p-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" defaultValue={data.Email || data.email} />
                    <input ref={firstNameRef} type="text" placeholder="First name" className="bg-gray-700 border border-gray-600 p-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input ref={lastNameRef} type="text" placeholder="Last name" className="bg-gray-700 border border-gray-600 p-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
                        setPasswordMsg('Password changed!');
                      } else {
                        const err = await res.json();
                        setPasswordMsg(err.message || 'Error changing password');
                      }
                    } catch (err) {
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
              {(data.roles.includes('employee')
              ) ? (
                <h2 className="text-xl font-semibold mb-4 text-center">Your requests</h2>
              ) : <h2 className="text-xl font-semibold mb-4 text-center">Requests</h2>}

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



              {requests.length === 0 ? (
                <p className="text-zinc-400">No requests.</p>
              ) : (
                <table className="min-w-full bg-zinc-800 rounded-md text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left">ID</th>
                      <th className="px-4 py-2 text-left">Title</th>
                      <th className="px-4 py-2 text-left">Price (PLN)</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Created</th>
                      <th className="px-4 py-2 text-left">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr key={req.id} className="border-b border-zinc-700 last:border-b-0">
                        <td className="px-4 py-2">{req.id}</td>
                        <td className="px-4 py-2">{req.title}</td>
                        <td className="px-4 py-2">{req.amountPln}</td>
                        <td className="px-4 py-2">
                          <select
                            value={req.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              try {
                                const token = localStorage.getItem("token");
                                const res = await fetch(`http://localhost:5252/api/orders/${req.id}/status`, {
                                  method: "PATCH",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`,
                                  },
                                  body: JSON.stringify({ status: newStatus }),
                                });
                                if (!res.ok) console.log(res);
                                await fetchRequests();
                              } catch (err) {
                                console.error("Błąd aktualizacji statusu:", err);
                              }
                            }}
                            className="bg-zinc-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
                          >
                            <option value="Czeka">PENDING</option>
                            <option value="Zaakceptowane">ACCEPTED</option>
                            <option value="Odrzucone">REJECTED</option>
                            <option value="Zakupione">PURCHASED</option>
                          </select></td>
                        <td className="px-4 py-2">{new Date(req.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-2">{req.reason || req.Reason || '-'}</td>
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
      </main>

    </div>
  );
}
