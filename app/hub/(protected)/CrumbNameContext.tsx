"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface CrumbNameState {
  name?: string;
  setName: (n?: string) => void;
}

const CrumbNameContext = createContext<CrumbNameState>({
  setName: () => {},
});

export function CrumbNameProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [name, setName] = useState<string | undefined>(undefined);
  return (
    <CrumbNameContext.Provider value={{ name, setName }}>
      {children}
    </CrumbNameContext.Provider>
  );
}

export function useCrumbName(): string | undefined {
  return useContext(CrumbNameContext).name;
}

export function useSetCrumbName(): (n?: string) => void {
  return useContext(CrumbNameContext).setName;
}
