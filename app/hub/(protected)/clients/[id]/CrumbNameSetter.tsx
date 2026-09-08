"use client";

import { useEffect } from "react";
import { useSetCrumbName } from "../../CrumbNameContext";

export function CrumbNameSetter({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  const setName = useSetCrumbName();
  useEffect(() => {
    setName(name);
    return () => setName(undefined);
  }, [name, setName]);
  return <>{children}</>;
}
