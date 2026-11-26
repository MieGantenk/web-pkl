import "server-only";

import { timingSafeEqual } from "node:crypto";

import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "./csrf";

export type CsrfVerificationResult =
  | { ok: true }
  | { ok: false; status: 403; message: string };

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() ?? "";
}

function readCookie(header: string, name: string) {
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");

    if (key === name) {
      return rest.join("=");
    }
  }

  return "";
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const sourceValue = origin || referer;

  if (!sourceValue) {
    return false;
  }

  let source: URL;

  try {
    source = new URL(sourceValue);
  } catch {
    return false;
  }

  const requestUrl = new URL(request.url);
  const host =
    firstHeaderValue(request.headers.get("x-forwarded-host")) ||
    request.headers.get("host") ||
    requestUrl.host;
  const protocol =
    firstHeaderValue(request.headers.get("x-forwarded-proto")) ||
    requestUrl.protocol.replace(":", "");

  return source.host === host && source.protocol === `${protocol}:`;
}

export function verifyCsrfAndOrigin(
  request: Request,
): CsrfVerificationResult {
  if (!assertSameOrigin(request)) {
    return {
      ok: false,
      status: 403,
      message: "Permintaan ditolak: origin tidak valid.",
    };
  }

  const cookieToken = readCookie(
    request.headers.get("cookie") ?? "",
    CSRF_COOKIE_NAME,
  );
  const headerToken = request.headers.get(CSRF_HEADER_NAME) ?? "";

  if (!cookieToken || !headerToken) {
    return {
      ok: false,
      status: 403,
      message: "Permintaan ditolak: token CSRF tidak ditemukan.",
    };
  }

  if (
    !/^[a-f0-9]{64}$/i.test(cookieToken) ||
    !/^[a-f0-9]{64}$/i.test(headerToken)
  ) {
    return {
      ok: false,
      status: 403,
      message: "Permintaan ditolak: token CSRF tidak valid.",
    };
  }

  const cookieBuffer = Buffer.from(cookieToken);
  const headerBuffer = Buffer.from(headerToken);

  if (
    cookieBuffer.length !== headerBuffer.length ||
    !timingSafeEqual(cookieBuffer, headerBuffer)
  ) {
    return {
      ok: false,
      status: 403,
      message: "Permintaan ditolak: token CSRF tidak cocok.",
    };
  }

  return { ok: true };
}
