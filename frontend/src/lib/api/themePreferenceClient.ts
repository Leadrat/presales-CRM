import { API_BASE } from "@/lib/api";
import { fetchWithAuth } from "@/lib/api/fetchWithAuth";

export type ThemePreference = "light" | "dark";

export async function getThemePreference(): Promise<ThemePreference | null> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/theme-preference`, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const payload = (await res.json().catch(() => ({}))) as any;
    const theme = payload?.data?.theme;
    if (theme === "light" || theme === "dark") {
      return theme;
    }
    return null;
  } catch {
    return null;
  }
}

export async function setThemePreference(theme: ThemePreference): Promise<void> {
  try {
    await fetchWithAuth(`${API_BASE}/api/theme-preference`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme }),
    });
  } catch {
    // best-effort only; ignore errors so UX is not blocked
  }
}
