export const CSRF_COOKIE_NAME = "pkl_csrf";
export const CSRF_HEADER_NAME = "x-csrf-token";

const TOKEN_BYTES = 32;

export function generateCsrfToken() {
  const bytes = new Uint8Array(TOKEN_BYTES);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}
