"use client";

import React from "react";
import SessionProvider from "./SessionProvider";
import ReduxProvider from "./ReduxProvider";
import InitUser from "@/initUser";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ReduxProvider>
        <InitUser />
        {children}
      </ReduxProvider>
    </SessionProvider>
  );
}
