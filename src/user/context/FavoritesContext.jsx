import { createContext, useContext, useState } from 'react';

// Wishlist of event ids, persisted in the browser (no backend). Shared via
// context so the heart on a card, the Saved page and the navbar count stay in
// sync from a single source of truth.
const Ctx = createContext(null);
export const useFavorites = () => useContext(Ctx);

export function FavoritesProvider({ children }) {
  const [ids, setIds] = useState(() => JSON.parse(localStorage.getItem('favorites') || '[]'));

  const save = (next) => { localStorage.setItem('favorites', JSON.stringify(next)); setIds(next); };
  const toggle = (id) => save(ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids]);
  const has = (id) => ids.includes(id);

  return <Ctx.Provider value={{ ids, toggle, has }}>{children}</Ctx.Provider>;
}
