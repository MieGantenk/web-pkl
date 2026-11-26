"use client";

import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "./csrf";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function getCsrfToken() {
  for (const part of document.cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");

    if (key === CSRF_COOKIE_NAME) {
      return rest.join("=");
    }
  }

  return null;
}

export async function fetchWithCsrf(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);

  if (MUTATING_METHODS.has(method)) {
    const token = getCsrfToken();

    if (!token) {
      throw new Error(
        "Token CSRF belum tersedia. Muat ulang halaman lalu coba lagi.",
      );
    }

    headers.set(CSRF_HEADER_NAME, token);
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: init.credentials ?? "same-origin",
  });
}
