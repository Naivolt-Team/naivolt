import { useEffect } from "react";
import { decode } from "base-64";
import axios from "axios";
import { useAuthStore, type User } from "@/store/authStore";
import { getToken, clearSession, TOKEN_KEY, saveUser } from "@/services/tokenStorage";
import { config } from "@/constants/config";

const AUTH_ME_URL = `${config.apiUrl}/api/v1/auth/me`;
const REQUEST_TIMEOUT_MS = 15000;

function toUser(apiUser: { _id?: string; id?: string; name: string; username?: string; email: string; phone?: string; role?: string }): User {
  return {
    _id: apiUser._id ?? apiUser.id,
    name: apiUser.name,
    username: apiUser.username,
    email: apiUser.email,
    phone: apiUser.phone,
    role: apiUser.role as "user" | "admin" | undefined,
  };
}

export function useAuthHydration() {
  const { setUser, setToken, setHydrated } = useAuthStore();

  useEffect(() => {
    async function hydrate() {
      try {
        const token = await getToken(TOKEN_KEY);
        if (!token) {
          setHydrated(true);
          return;
        }

        const parts = token.split(".");
        if (parts.length !== 3) {
          await clearSession();
          setHydrated(true);
          return;
        }

        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64 + "==".slice(0, (4 - (base64.length % 4)) % 4);
        const payload = JSON.parse(decode(padded)) as { exp?: number };
        if (payload.exp == null || payload.exp * 1000 <= Date.now()) {
          await clearSession();
          setHydrated(true);
          return;
        }

        const { data, status } = await axios.get<{ user?: User }>(AUTH_ME_URL, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: REQUEST_TIMEOUT_MS,
          validateStatus: () => true,
        });

        if (status === 200 && data?.user) {
          const user = toUser(data.user as Parameters<typeof toUser>[0]);
          setToken(token);
          setUser(user);
          await saveUser(user);
        } else {
          await clearSession();
        }
      } catch {
        await clearSession();
      } finally {
        setHydrated(true);
      }
    }

    hydrate();
  }, [setUser, setToken, setHydrated]);
}
