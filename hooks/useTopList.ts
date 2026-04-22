"use client";

import { useEffect, useState } from "react";
import { fetchTopList } from "@/lib/pikalytics";
import type { TopList } from "@/lib/types";
import { useAppStore } from "@/stores/appStore";

const inflight = new Map<string, Promise<TopList>>();

export function useTopList(format: string): {
  data: TopList | null;
  loading: boolean;
  error: Error | null;
} {
  const cached = useAppStore((s) => s.topListCache.get(format) ?? null);
  const cacheTopList = useAppStore((s) => s.cacheTopList);
  const setApiStatus = useAppStore((s) => s.setApiStatus);

  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    let p = inflight.get(format);
    if (!p) {
      p = fetchTopList(format).finally(() => {
        inflight.delete(format);
      });
      inflight.set(format, p);
    }
    p.then((data) => {
      if (cancelled) return;
      cacheTopList(data);
      setApiStatus({ pikalytics: "ok" });
    }).catch((e: Error) => {
      if (cancelled || e.name === "AbortError") return;
      setError(e);
      setApiStatus({ pikalytics: "degraded" });
    });
    return () => {
      cancelled = true;
    };
  }, [format, cached, cacheTopList, setApiStatus]);

  const loading = !cached && !error;
  return { data: cached, loading, error };
}
