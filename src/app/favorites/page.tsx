'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Dog {
  id: string;
  img: string;
  name: string;
  age: number;
  zip_code: string;
  breed: string;
}

export default function FavoritesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [match, setMatch] = useState<Dog | null>(null);

  useEffect(() => {
    const idsParam = searchParams.get('ids');
    if (!idsParam) return;
    const ids = idsParam.split(',').filter(Boolean);
    setFavoriteIds(ids);
  }, [searchParams]);

  useEffect(() => {
    const fetchDogs = async () => {
      if (favoriteIds.length === 0) {
        setDogs([]);
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.post<Dog[]>('/dogs', favoriteIds);
        setDogs(data);
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDogs();
  }, [favoriteIds]);

  const handleRemove = (id: string) => {
    const updated = favoriteIds.filter((dogId) => dogId !== id);
    setFavoriteIds(updated);
    const newUrl = updated.length > 0 ? `/favorites?ids=${updated.join(',')}` : '/favorites';
    router.replace(newUrl);
    if (match?.id === id) setMatch(null); // clear match if removed
  };

  const handleCopyLink = () => {
    const baseUrl = window.location.origin;
    const url = favoriteIds.length
      ? `${baseUrl}/favorites?ids=${favoriteIds.join(',')}`
      : `${baseUrl}/favorites`;

    navigator.clipboard.writeText(url);
    setToast('📎 Shareable link copied!');
    setTimeout(() => setToast(null), 2500);
  };

  const handleMatch = async () => {
    try {
      const { data } = await api.post<{ match: string }>('/dogs/match', favoriteIds);
      const result = await api.post<Dog[]>('/dogs', [data.match]);
      setMatch(result.data[0]);
    } catch (error) {
      console.error('Error fetching match:', error);
    }
  };

  const goBack = () => router.push('/search');

  if (loading) return <p>Loading favorite dogs...</p>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">🐶 Your Favorite Dogs</h1>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleCopyLink}
            className={`px-4 py-2 rounded ${
              favoriteIds.length === 0
                ? 'bg-yellow-300 text-white opacity-50 cursor-not-allowed'
                : 'bg-yellow-500 text-white hover:bg-yellow-600'
            }`}
            disabled={favoriteIds.length === 0}
          >
            📎 Copy Share Link
          </button>

          <button
            onClick={goBack}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            🔙 Back to Search
          </button>

          <button
            onClick={handleMatch}
            className={`bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ${
              favoriteIds.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={favoriteIds.length === 0}
          >
            🎯 Show Match
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-5 right-5 bg-black text-white px-4 py-2 rounded shadow-lg z-50">
          {toast}
        </div>
      )}

      {match && (
        <div className="border-2 border-green-600 p-6 rounded mb-6 shadow bg-green-50">
          <h2 className="text-2xl font-bold mb-2 text-black">🎉 You’re Match!</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center text-black">
            <img src={match.img} alt={match.name} className="w-full h-64 object-cover rounded" />
            <div>
              <h3 className="text-xl font-bold">{match.name}</h3>
              <p>Breed: {match.breed}</p>
              <p>Age: {match.age}</p>
              <p>Zip Code: {match.zip_code}</p>
              <button
                onClick={() => setMatch(null)}
                className="mt-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                ❌ Hide Match
              </button>
            </div>
          </div>
        </div>
      )}

      {dogs.length === 0 ? (
        <p className="text-gray-500">You haven’t selected any favorite dogs yet. 🐾</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dogs.map((dog) => (
            <div key={dog.id} className="border p-4 rounded shadow">
              <img
                src={dog.img}
                alt={dog.name}
                className="w-full h-48 object-cover mb-2 rounded"
              />
              <h2 className="text-xl font-bold">{dog.name}</h2>
              <p>Breed: {dog.breed}</p>
              <p>Age: {dog.age}</p>
              <p>Zip: {dog.zip_code}</p>

              <button
                onClick={() => handleRemove(dog.id)}
                className="mt-3 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                ❌ Remove from Favorites
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
