"use client";

import { useCallback, useRef, useState } from "react";
import type { DesignDTO, GenerationDTO } from "@/lib/generation/types";

const POLL_MS = 1200;
const POLL_TIMEOUT_MS = 180_000;

export type GenerationView = {
  status: "idle" | "working" | "ready" | "error";
  completed: number;
  total: number;
  designs: DesignDTO[];
  error: string | null;
  cached: boolean;
};

const IDLE: GenerationView = {
  status: "idle",
  completed: 0,
  total: 4,
  designs: [],
  error: null,
  cached: false,
};

/**
 * Drives one generation and reports what has actually finished.
 *
 * A failure stops here and surfaces its message — there is no quiet retry,
 * because a retry that fails the same way just spends the customer's rate
 * limit and their patience without telling them anything.
 */
export function useGeneration() {
  const [view, setView] = useState<GenerationView>(IDLE);
  const activePoll = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    activePoll.current?.abort();
    activePoll.current = null;
    setView(IDLE);
  }, []);

  const apply = useCallback((payload: GenerationDTO) => {
    setView({
      status: payload.status === "READY" ? "ready" : payload.status === "FAILED" ? "error" : "working",
      completed: payload.completed,
      total: payload.total,
      designs: payload.designs,
      error: payload.error ?? null,
      cached: Boolean(payload.cached),
    });
  }, []);

  const generate = useCallback(
    async (prompt: string, referenceId: string | null) => {
      activePoll.current?.abort();
      const controller = new AbortController();
      activePoll.current = controller;

      setView({ ...IDLE, status: "working" });

      let started: GenerationDTO;
      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, referenceId }),
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok) {
          setView({ ...IDLE, status: "error", error: payload.error ?? "That didn't work." });
          return;
        }
        started = payload as GenerationDTO;
      } catch (error) {
        if (controller.signal.aborted) return;
        setView({
          ...IDLE,
          status: "error",
          error: "We couldn't reach the studio. Check your connection and try again.",
        });
        return;
      }

      apply(started);
      if (started.status === "READY" || started.status === "FAILED") return;

      const deadline = Date.now() + POLL_TIMEOUT_MS;
      while (!controller.signal.aborted) {
        await new Promise((resolve) => setTimeout(resolve, POLL_MS));
        if (controller.signal.aborted) return;

        if (Date.now() > deadline) {
          setView((current) => ({
            ...current,
            status: "error",
            error: "That's taking longer than it should. Try again in a moment.",
          }));
          return;
        }

        try {
          const response = await fetch(`/api/generate/${started.id}`, {
            signal: controller.signal,
          });
          if (!response.ok) continue;
          const payload = (await response.json()) as GenerationDTO;
          apply(payload);
          if (payload.status === "READY" || payload.status === "FAILED") return;
        } catch {
          if (controller.signal.aborted) return;
          // A dropped poll on a slow connection is not a failed generation;
          // the next tick picks it back up.
        }
      }
    },
    [apply],
  );

  return { view, generate, reset };
}
