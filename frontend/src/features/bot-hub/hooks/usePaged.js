import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "../services/hubApi";

export function usePaged(fetcher, pageSize = 10) {
  const fetchRef = useRef(fetcher);
  const [page, setPage] = useState(1);
  const [reloads, setReloads] = useState(0);
  const [state, setState] = useState({ requestKey: "", data: [], total: 0, totalPages: 1, error: "" });
  const key = `${page}|${reloads}`;

  useEffect(() => {
    let cancelled = false;
    fetchRef
      .current({ page, limit: pageSize })
      .then((r) => !cancelled && setState({ requestKey: key, data: r.data, total: r.total ?? 0, totalPages: r.totalPages ?? 1, error: "" }))
      .catch((e) => !cancelled && setState((s) => ({ ...s, requestKey: key, error: errorMessage(e) })));
    return () => {
      cancelled = true;
    };
  }, [key, page, pageSize]);

  const reload = useCallback(() => setReloads((n) => n + 1), []);
  return { ...state, page, setPage, reload, loading: state.requestKey !== key };
}
