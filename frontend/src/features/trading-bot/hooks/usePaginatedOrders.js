import { useCallback, useEffect, useState } from "react";
import { botApi, errorMessage } from "../services/binanceApi";

export function usePaginatedOrders({ pageSize = 10, filters = {} } = {}) {
  const filterKey = JSON.stringify(filters);
  const [pageState, setPageState] = useState({ key: "", n: 1 });
  const [reloads, setReloads] = useState(0);
  const [result, setResult] = useState({ requestKey: "", data: [], total: 0, totalPages: 1, error: "" });

  const page = pageState.key === filterKey ? pageState.n : 1;
  const requestKey = `${filterKey}|${page}|${pageSize}|${reloads}`;

  useEffect(() => {
    let cancelled = false;
    botApi
      .orders({ page, limit: pageSize, ...JSON.parse(filterKey) })
      .then((r) => !cancelled && setResult({ requestKey, data: r.data, total: r.total, totalPages: r.totalPages, error: "" }))
      .catch((e) => !cancelled && setResult((s) => ({ ...s, requestKey, error: errorMessage(e) })));
    return () => {
      cancelled = true;
    };
  }, [requestKey, page, pageSize, filterKey]);

  const setPage = useCallback((n) => setPageState({ key: filterKey, n }), [filterKey]);
  const reload = useCallback(() => setReloads((n) => n + 1), []);

  return { ...result, page, setPage, reload, loading: result.requestKey !== requestKey };
}
