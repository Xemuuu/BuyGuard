'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:5252/api/auth/whoami', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Unauthorized');
        const json = await res.json();
        setData(json);
      } catch (err) {
          console.error(err);
          setError('Unauthorized');
          localStorage.removeItem('token'); // Usuwa token przy 401
          router.push('/');
      
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  return (
    <main className="min-h-screen bg-zinc-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-4">BuyGuard Dashboard</h1>

      {loading && <p>Loading data...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {data && (
        <pre className="bg-zinc-800 p-4 rounded-md">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  );
}
