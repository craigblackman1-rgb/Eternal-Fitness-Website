"use client";

import { createContext, useContext } from "react";

const CrumbNameContext = createContext<string | undefined>(undefined);

export function CrumbNameProvider({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  return (
    <CrumbNameContext.Provider value={name}>
      {children}
    </CrumbNameContext.Provider>
  );
}

export function useCrumbName(): string | undefined {
  return useContext(CrumbNameContext);
}
