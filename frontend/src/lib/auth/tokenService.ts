import { API_BASE } from "../api";

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshTimeoutId: number | null = null;
let broadcastChannel: BroadcastChannel | null = null;

// Get basePath from Next.js config (injected at build time)
const basePath = process.env.__NEXT_ROUTER_BASEPATH || "";

function isBrowser() {
  return typeof window !== "undefined";
}

function getLoginPath() {
  return `${basePath}/login`;
}

function isOnLoginPage() {
  if (!isBrowser()) return false;
  return window.location.pathname.endsWith("/login");
}

function getBroadcastChannel() {
  if (!isBrowser()) return null;
  if (typeof BroadcastChannel === "undefined") return null;
  if (!broadcastChannel) {
    broadcastChannel = new BroadcastChannel("auth-channel");
    broadcastChannel.onmessage = (event: MessageEvent) => {
      if (event.data === "logout") {
        tokenService.clearTokens();
        if (!isOnLoginPage()) {
          window.location.href = getLoginPath();
        }
      }
    };
  }
  return broadcastChannel;
}

function scheduleProactiveRefresh() {
  if (!isBrowser()) return;
  if (!accessToken) return;

  try {
    const parts = accessToken.split(".");
    if (parts.length !== 3) return;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    const exp = typeof payload.exp === "number" ? payload.exp * 1000 : null;
    if (!exp) return;

    const now = Date.now();
    const oneMinute = 60_000;
    let delay = exp - now - oneMinute;
    if (delay < 0) delay = 0;

    if (refreshTimeoutId !== null) {
      clearTimeout(refreshTimeoutId);
    }

    refreshTimeoutId = window.setTimeout(() => {
      tokenService.refreshTokens().catch(() => {
        tokenService.clearTokens();
        if (isBrowser() && !isOnLoginPage()) {
          window.location.href = getLoginPath();
        }
      });
    }, delay);
  } catch {
    // If parsing fails, do not schedule proactive refresh
  }
}

export const tokenService = {
  setTokens(newAccessToken: string, newRefreshToken: string) {
    accessToken = newAccessToken;
    refreshToken = newRefreshToken;
    scheduleProactiveRefresh();
  },

  getAccessToken(): string | null {
    return accessToken;
  },

  async refreshTokens(): Promise<void> {
    if (!refreshToken || !isBrowser()) {
      throw new Error("No refresh token available");
    }

    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      credentials: "include",
    });

    if (!res.ok) {
      this.clearTokens();
      throw new Error("Failed to refresh token");
    }

    const data = (await res.json().catch(() => ({}))) as {
      accessToken?: string;
      refreshToken?: string;
    };

    if (!data.accessToken) {
      this.clearTokens();
      throw new Error("No access token returned from refresh");
    }

    const nextRefreshToken = data.refreshToken ?? refreshToken;
    this.setTokens(data.accessToken, nextRefreshToken);
  },

  clearTokens() {
    accessToken = null;
    refreshToken = null;
    if (refreshTimeoutId !== null) {
      if (isBrowser()) {
        clearTimeout(refreshTimeoutId);
      }
      refreshTimeoutId = null;
    }
  },

  async logout(): Promise<void> {
    if (!isBrowser()) {
      this.clearTokens();
      return;
    }

    try {
      const payload = refreshToken ? { refreshToken } : null;
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: payload ? JSON.stringify(payload) : undefined,
        credentials: "include",
      }).catch(() => {
        // Ignore network/backend errors on logout
      });
    } finally {
      const bc = getBroadcastChannel();
      if (bc) {
        bc.postMessage("logout");
      }
      this.clearTokens();
      if (!isOnLoginPage()) {
        window.location.href = getLoginPath();
      }
    }
  },
};
