"use client";

/**
 * Camada única de rastreamento — dispara pra PostHog + Pixel Meta + Vercel de uma vez.
 * Toda a instrumentação do funil passa por `track(evento, props)`.
 *
 * Env vars (Vercel):
 *   NEXT_PUBLIC_POSTHOG_KEY   = phc_...
 *   NEXT_PUBLIC_POSTHOG_HOST  = https://us.i.posthog.com (ou eu.i.posthog.com)
 *   NEXT_PUBLIC_META_PIXEL_ID = 950123170170052
 */

import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

/* ============ CONFIG ============ */
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/* ============ TIPOS ============ */
type EventValue = string | number | boolean | undefined | string[] | number[];
type EventProps = Record<string, EventValue>;

/* ============ PROVIDER (envolve o app) ============ */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Init adiado pra depois do primeiro paint — tira PostHog+Pixel do caminho crítico
    // (reduz Total Blocking Time no PageSpeed sem perder nenhum evento).
    const initAnalytics = () => {
    // 1) PostHog — só se a key existir
    if (typeof window !== "undefined" && POSTHOG_KEY && !posthog.__loaded) {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        capture_pageview: "history_change",
        capture_pageleave: true,
        autocapture: true,
        session_recording: { maskAllInputs: false },
        persistence: "localStorage+cookie",
        loaded: (p) => {
          if (process.env.NODE_ENV === "development") p.debug(false);
        },
      });
    }

    // 2) Meta Pixel — carregamento oficial da Meta
    if (typeof window !== "undefined" && META_PIXEL_ID && !(window as unknown as { fbq?: unknown }).fbq) {
      /* eslint-disable */
      (function (f: any, b: Document, e: string, v: string) {
        if (f.fbq) return;
        const n: any = (f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        });
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = "2.0";
        n.queue = [];
        const t = b.createElement(e) as HTMLScriptElement;
        t.async = true;
        t.src = v;
        const s = b.getElementsByTagName(e)[0];
        s.parentNode?.insertBefore(t, s);
      })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      /* eslint-enable */
      const fbq = (window as unknown as { fbq: (c: string, ...a: unknown[]) => void }).fbq;
      fbq("init", META_PIXEL_ID);
      fbq("track", "PageView");
    }
    };

    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };
    if (typeof w.requestIdleCallback === "function") {
      w.requestIdleCallback(initAnalytics, { timeout: 3000 });
    } else {
      setTimeout(initAnalytics, 1800);
    }
  }, []);

  if (POSTHOG_KEY && typeof window !== "undefined") {
    return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
  }
  return <>{children}</>;
}

/* ============ TRACK unificado ============
   Uso: track("funnel_quiz_answer", { qId: 3, key: "A", arquetipo: "escrava" });
   Envia pra PostHog (evento custom + prop) E pro Meta Pixel (trackCustom).
   Eventos padrão da Meta (PageView, Lead, InitiateCheckout etc.) usam a helper `trackMeta`.
*/
export function track(event: string, props: EventProps = {}) {
  if (typeof window === "undefined") return;
  // PostHog
  if (POSTHOG_KEY && posthog.__loaded) {
    posthog.capture(event, props);
  }
  // Meta Pixel — evento custom (não é standard)
  if (META_PIXEL_ID && window.fbq) {
    window.fbq("trackCustom", event, props);
  }
  // Console (dev)
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("[track]", event, props);
  }
}

/** Dispara um evento PADRÃO da Meta (PageView, Lead, InitiateCheckout, Purchase, etc.) */
export function trackMeta(standardEvent: string, props: EventProps = {}) {
  if (typeof window === "undefined") return;
  if (META_PIXEL_ID && window.fbq) {
    window.fbq("track", standardEvent, props);
  }
  // também manda pro PostHog pra ter tudo num painel só
  if (POSTHOG_KEY && posthog.__loaded) {
    posthog.capture(`meta_${standardEvent}`, props);
  }
}

/* ============ Types globais pro fbq ============ */
type FBQ = ((command: string, ...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
};
declare global {
  interface Window {
    fbq?: FBQ;
    _fbq?: unknown;
  }
}
