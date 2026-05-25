"use client";

import { useState, useCallback } from "react";

export const useConsultationDialog = () => {
  const [open, setOpen] = useState(false);
  const openDialog = useCallback(() => setOpen(true), []);
  return { open, setOpen, openDialog };
};
