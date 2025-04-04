// app/favorites/page.tsx
import { Suspense } from 'react';
import FavoritesClient from './FavoritesClient';

export default function FavoritesPage() {
  return (
    <Suspense fallback={<p className="p-6">Loading favorites...</p>}>
      <FavoritesClient />
    </Suspense>
  );
}
