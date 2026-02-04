import { useState, useEffect } from "react";
import { WeeklyPlanDraft } from "@/types/weekly-plan";

export function useLocalStorageDraft(key: string) {
  const [draft, setDraft] = useState<WeeklyPlanDraft | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initial load
  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setDraft(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse draft from localStorage", e);
      }
    }
    setIsReady(true);
  }, [key]);

  // Save on change with debounce
  useEffect(() => {
    if (!isReady) return;

    if (draft) {
      const timeout = setTimeout(() => {
        localStorage.setItem(key, JSON.stringify(draft));
      }, 500);
      return () => clearTimeout(timeout);
    } else {
      localStorage.removeItem(key);
    }
  }, [draft, key, isReady]);

  const clearDraft = () => {
    setDraft(null);
    localStorage.removeItem(key);
  };

  return { draft, setDraft, clearDraft, isReady };
}
