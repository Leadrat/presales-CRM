import { tokenService } from "../auth/tokenService";

function isBrowser() {
  return typeof window !== "undefined";
}

// Get basePath from Next.js config (injected at build time)
const basePath = process.env.__NEXT_ROUTER_BASEPATH || "";

export async function fetchWithAuth(input: string, init: RequestInit = {}) {
  const originalInit: RequestInit = { ...init };

  // Always include credentials so httpOnly accessToken cookie is sent
  const withCredentials: RequestInit = {
    ...originalInit,
    credentials: originalInit.credentials ?? "include",
  };

  const accessToken = tokenService.getAccessToken();

  const headers = new Headers(withCredentials.headers || {});
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let res = await fetch(input, {
    ...withCredentials,
    headers,
  });

  if (res.status !== 401) {
    return res;
  }

  // Handle 401: try a single refresh, then retry once
  try {
    await tokenService.refreshTokens();
  } catch {
    tokenService.clearTokens();
    const loginPath = `${basePath}/login`;
    if (isBrowser() && !window.location.pathname.endsWith("/login")) {
      // Redirect to login; toast can be handled at page level
      window.location.href = loginPath;
    }
    // Re-throw to let callers handle error if needed
    throw new Error("Unauthorized");
  }

  const newAccessToken = tokenService.getAccessToken();
  const retryHeaders = new Headers(withCredentials.headers || {});
  if (newAccessToken) {
    retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);
  }

  res = await fetch(input, {
    ...withCredentials,
    headers: retryHeaders,
  });

  return res;
}
