import { useEffect, useState } from "react";
import type { Guest } from "../types.ts";
import { birthdayAlerts } from "../utils/birthdays.ts";

export function useBirthdayAlerts(guests: Guest[]) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return birthdayAlerts(guests, now);
}
