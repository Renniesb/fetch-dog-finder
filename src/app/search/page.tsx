"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

interface Dog {
  id: string;
  img: string;
  name: string;
  age: number;
  zip_code: string;
  breed: string;
}

export default function SearchPage() {
  const router = useRouter();
  const [breeds, setBreeds] = useState<string[]>([]);
  const [selectedBreed, setSelectedBreed] = useState<string>("");
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [resultIds, setResultIds] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('favorites');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    }
    return new Set();
  });
  const [from, setFrom] = useState<number>(0);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const pageSize = 12;

  useEffect(() => {
    const fetchBreeds = async () => {
      const { data } = await api.get<string[]>("/dogs/breeds");
      setBreeds(data);
    };

    localStorage.setItem('favorites', JSON.stringify([...favorites]));

    fetchBreeds();
  }, [favorites]);

  useEffect(() => {
    const fetchDogs = async () => {
      const { data } = await api.get("/dogs/search", {
        params: {
          breeds: selectedBreed ? [selectedBreed] : undefined,
          size: pageSize,
          from,
          sort: `breed:${sortOrder}`,
        },
      });

      setResultIds(data.resultIds || []);

      if (data.resultIds?.length) {
        const dogData = await api.post<Dog[]>("/dogs", data.resultIds);
        setDogs(dogData.data);
      } else {
        setDogs([]);
      }
    };

    fetchDogs();
  }, [selectedBreed, from, sortOrder]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.has(id)
        ? new Set([...prev].filter((dogId) => dogId !== id))
        : new Set([...prev, id])
    );
  };

  const handleMatch = async () => {
    if (favorites.size === 0) return;
    const { data } = await api.post<{ match: string }>("/dogs/match", [
      ...favorites,
    ]);
    alert(`Your match is Dog ID: ${data.match}`);
  };

  const handleCopyLink = () => {
    const baseUrl = window.location.origin;
    const idList = [...favorites].join(",");
    const shareUrl = `${baseUrl}/favorites?ids=${idList}`;
    navigator.clipboard.writeText(shareUrl);
    alert("Link copied to clipboard!");
  };

  const handleViewFavorites = () => {
    const idList = [...favorites].join(",");
    const url = `/favorites?ids=${idList}`;
    router.push(url);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Browse Available Dogs</h1>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <select
          value={selectedBreed}
          onChange={(e) => setSelectedBreed(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All Breeds</option>
          {breeds.map((breed) => (
            <option key={breed} value={breed}>
              {breed}
            </option>
          ))}
        </select>

        <button
          onClick={() =>
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
          }
          className="border px-4 py-2 rounded"
        >
          Sort: {sortOrder.toUpperCase()}
        </button>

        <button
          onClick={handleMatch}
          className="ml-auto bg-green-600 text-white px-4 py-2 rounded"
        >
          Match Favorites ({favorites.size})
        </button>
        <button
          onClick={handleViewFavorites}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          View Favorites ({favorites.size})
        </button>

        <button
          onClick={handleCopyLink}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          Copy Share Link
        </button>
      </div>

      {/* Dog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dogs.map((dog) => (
          <div
            key={dog.id}
            className="border p-4 rounded shadow hover:shadow-md transition relative"
          >
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
              onClick={() => toggleFavorite(dog.id)}
              className={`mt-2 px-3 py-1 rounded text-sm ${
                favorites.has(dog.id)
                  ? "bg-red-500 text-white"
                  : "bg-gray-300 text-black hover:bg-gray-400"
              }`}
            >
              {favorites.has(dog.id) ? "Remove Favorite" : "Add to Favorites"}
            </button>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between mt-6">
        <button
          disabled={from === 0}
          onClick={() => setFrom(Math.max(0, from - pageSize))}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Prev
        </button>
        <button
          disabled={resultIds.length < pageSize}
          onClick={() => setFrom(from + pageSize)}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
