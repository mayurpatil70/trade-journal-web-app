import { useCallback, useEffect, useState } from "react";
import { botApi, errorMessage } from "../services/binanceApi";

export function useBotConfig() {
  const [configs, setConfigs] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [c, s] = await Promise.all([botApi.configs(), botApi.status()]);
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
    refresh,
    create: (body) => run(() => botApi.createConfig(body)),
    toggle: (id, active) => run(() => botApi.toggle(id, active)),
    remove: (id) => run(() => botApi.remove(id)),
  };
}
