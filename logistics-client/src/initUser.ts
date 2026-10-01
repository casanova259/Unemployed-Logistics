"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAppDispatch } from "@/redux/hooks";
import { setUser, clearUser, setHydrated } from "@/redux/slices/userSlice";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { Role } from "@prisma/client";

export function useInitUser() {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && session?.user) {
      const role = (session.user as { role?: Role }).role || Role.CUSTOMER;
      const user = {
        id: session.user.id || "",
        name: session.user.name || "User",
        email: session.user.email || "",
        role,
      };

      dispatch(setUser(user));

      // Connect socket and announce identity
      if (user.id) {
        connectSocket(user.id);
      }
    } else {
      dispatch(clearUser());
      disconnectSocket();
    }

    dispatch(setHydrated(true));
  }, [session, status, dispatch]);
}

/**
 * Component that performs user state hydration in the root layout
 */
export default function InitUser() {
  useInitUser();
  return null;
}
