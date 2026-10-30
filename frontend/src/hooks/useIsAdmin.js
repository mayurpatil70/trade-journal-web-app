import { useEffect, useState } from "react";
import api from "../api/axios";

// Server-verified admin flag, cached per auth token
let cache = { token: null, promise: null, value: null };

export function checkIsAdmin() {
  const token = localStorage.getItem("token");
  if (!token) return Promise.resolve(false);
  if (cache.token === token && cache.promise) return cache.promise;
  cache = { token, value: null, promise: null };
  cache.promise = api
    .get("/api/admin/me")
    .then((res) => {
      const isAdmin = res.data?.isAdmin === true;
      if (cache.token === token) cache.value = isAdmin;
      return isAdmin;
    })
    .catch((err) => {
      if (cache.token === token && err.response?.status !== 403) cache.promise = null;
      else if (cache.token === token) cache.value = false;
      return false;
    });
  return cache.promise;
}

export function useIsAdmin() {
  const token = localStorage.getItem("token");
  const [isAdmin, setIsAdmin] = useState(() =>
    cache.token === token && cache.value !== null ? cache.value : null
  );

  useEffect(() => {
    let active = true;
    checkIsAdmin().then((v) => active && setIsAdmin(v));
    return () => {
      active = false;
    };
  }, [token]);

  return isAdmin;
}
