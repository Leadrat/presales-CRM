import { NextRequest, NextResponse } from "next/server";
import { API_BASE } from "../../../../lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { refreshToken?: string };
    const refreshToken = body?.refreshToken;

    if (!refreshToken) {
      return NextResponse.json({ error: "Missing refreshToken" }, { status: 400 });
    }

    const backendRes = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const backendData = (await backendRes.json().catch(() => ({}))) as any;

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: backendData?.error || "Failed to refresh token" },
        { status: backendRes.status }
      );
    }

    const accessToken = backendData?.data?.accessToken ?? backendData?.accessToken;
    const newRefreshToken =
      backendData?.data?.refreshToken ?? backendData?.refreshToken ?? refreshToken;

    if (!accessToken) {
      return NextResponse.json(
        { error: "No access token in refresh response" },
        { status: 500 }
      );
    }

    const res = NextResponse.json({ accessToken, refreshToken: newRefreshToken });

    const secure = process.env.NODE_ENV === "production";

    res.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure,
      sameSite: "strict",
      path: "/",
    });

    return res;
  } catch {
    return NextResponse.json(
      { error: "Unexpected error during token refresh" },
      { status: 500 }
    );
  }
}
