import { useCallback, useEffect, useState } from "react";
import { hubApi, errorMessage } from "../services/hubApi";

export function useHubBots() {
  const [configs, setConfigs] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [c, s] = await Promise.all([hubApi.configs(), hubApi.status()]);
      setConfigs(c);
      setStatus(s);
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(refresh, 0);
    return () => clearTimeout(t);
  }, [refresh]);

  const run = useCallback(
    async (fn) => {
      try {
        await fn();
        await refresh();
        return "";
      } catch (e) {
        return errorMessage(e);
      }
    },
    [refresh],
  );

  return {
    configs,
    status,
    loading,
    error,
    create: (body) => run(() => hubApi.createConfig(body)),
    toggle: (id, active) => run(() => hubApi.toggle(id, active)),
    remove: (id) => run(() => hubApi.remove(id)),
  };
}
