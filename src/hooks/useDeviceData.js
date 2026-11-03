import { useEffect, useRef, useState } from "react";
import { loadDeviceData, saveDeviceData } from "../services/device-storage.js";
import { newHotelData } from "../utils/hotel-data.js";

export function useDeviceData() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);
  const revision = useRef(0);
  const latest = useRef(null);
  const saved = useRef(null);
  const queue = useRef(Promise.resolve());
  const failed = useRef(false);

  useEffect(() => {
    let active = true;
    if (latest.current) return;
    setStatus("loading");
    setError(null);
    loadDeviceData().then(result => {
      if (!active) return;
      revision.current = result.revision;
      latest.current = saved.current = result.data;
      setData(result.data);
      setStatus("saved");
    }).catch(cause => {
      if (!active) return;
      setError(cause);
      setStatus("error");
    });
    return () => { active = false; };
  }, [retry]);

  useEffect(() => {
    if (!data || saved.current === data) return;
    const timer = setTimeout(() => {
      queue.current = queue.current.then(async () => {
        if (failed.current || saved.current === data) return;
        try {
          const result = await saveDeviceData(data, revision.current);
          revision.current = result.revision;
          saved.current = data;
          if (latest.current === data) {
            setStatus("saved");
            setError(null);
          }
        } catch (cause) {
          failed.current = true;
          setStatus("error");
          setError(cause);
        }
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [data, retry]);

  useEffect(() => {
    function protectUnsavedChanges(event) {
      if (latest.current !== saved.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", protectUnsavedChanges);
    return () => window.removeEventListener("beforeunload", protectUnsavedChanges);
  }, []);

  function update(key, value) {
    const next = { ...latest.current, [key]: value };
    latest.current = next;
    setData(next);
    if (!failed.current) setStatus("saving");
  }

  function retrySave() {
    failed.current = false;
    setError(null);
    setStatus(data ? "saving" : "loading");
    setRetry(value => value + 1);
  }

  async function register(hotel) {
    setStatus("saving");
    setError(null);
    try {
      const next = newHotelData(hotel);
      const result = await saveDeviceData(next, revision.current);
      revision.current = result.revision;
      latest.current = saved.current = next;
      setData(next);
      setStatus("saved");
      return true;
    } catch (cause) {
      setError(cause);
      setStatus("error");
      return false;
    }
  }

  return { data, update, status, error, retry: retrySave, register };
}
