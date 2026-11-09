import { useEffect, useState } from "react";

const KEY = "si_guest_id";

/** Retorna um ID anônimo persistido em localStorage. */
export function useGuestId(): string | null {
  const [guestId, setGuestId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    setGuestId(id);
  }, []);

  return guestId;
}

