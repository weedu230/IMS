import { useState, useEffect, useCallback } from 'react';

/**
 * useApi — generic fetch hook.
 * Returns { data, loading, error, refetch }
 *
 * @param {Function} apiFn   — the API function to call
 * @param {any[]}    deps     — re-fetch when these change
 * @param {any[]}    args     — arguments passed to apiFn
 */
export const useApi = (apiFn, args = [], deps = []) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn(...args);
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
};

/**
 * usePagination — manages page/limit state for paginated lists
 */
export const usePagination = (initialLimit = 20) => {
  const [page,  setPage]  = useState(1);
  const [limit, setLimit] = useState(initialLimit);

  const goTo   = (p) => setPage(p);
  const reset  = ()  => setPage(1);

  return { page, limit, setPage: goTo, setLimit, reset };
};

/**
 * useDebounce — debounces a value by `delay` ms
 */
export const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};
