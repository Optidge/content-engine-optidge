import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getGoogleAccessToken(): Promise<
  { token: string } | { error: string; status: number; code?: string }
> {
  const session = await getServerSession(authOptions);

  if (session?.error === "RefreshAccessTokenError") {
    return {
      error: "Google session expired — reconnect your Google account",
      status: 401,
      code: "SESSION_EXPIRED",
    };
  }

  const token = session?.accessToken;

  if (!token) {
    return { error: "Not authenticated", status: 401, code: "UNAUTHORIZED" };
  }

  return { token };
}
