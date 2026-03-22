/**
 * POST /api/screenshot
 *
 * Convert any public URL into a pixel-perfect PNG / JPEG / WebP screenshot.
 * Uses a singleton warm Chromium browser (lib/browser.ts) so every request
 * after the first one skips the 3-6s browser launch cost entirely.
 *
 * Request body (JSON):
 *   url           string   required   Full URL incl. scheme (https://...)
 *   viewport      string   optional   "desktop" | "tablet" | "mobile"  (default: "desktop")
 *   full_page     boolean  optional   Capture entire scrollable page     (default: false)
 *   format        string   optional   "png" | "jpeg" | "webp"           (default: "png")
 *   quality       number   optional   1–100, jpeg/webp only             (default: 85)
 *   wait_until    string   optional   Puppeteer waitUntil strategy      (default: "networkidle2")
 *   dark_mode     boolean  optional   Emulate prefers-color-scheme:dark (default: false)
 *   timeout       number   optional   Navigation timeout ms             (default: 15000)
 *
 * Response:
 *   200  image/png|jpeg|webp  — raw image bytes
 *   Headers:
 *     X-Response-Time   total handler time in ms
 *     X-Screenshot-Time browser capture time in ms
 *     X-Credits-Used    always "1"
 *     X-Credits-Remaining remaining credits after this call
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validateApiKey, unauthorized, paymentRequired } from "@/lib/auth";
import {
  takeScreenshot,
  type Viewport,
  type WaitUntil,
  type ImageFormat,
} from "@/lib/browser";

// Give the function long enough for navigation + render
export const maxDuration = 30;

// ── Type guards for request body ────────────────────────────────────────────

const VALID_VIEWPORTS: Viewport[] = ["desktop", "tablet", "mobile"];
const VALID_FORMATS: ImageFormat[] = ["png", "jpeg", "webp"];
const VALID_WAIT: WaitUntil[] = ["load", "domcontentloaded", "networkidle0", "networkidle2"];

function asViewport(v: unknown): Viewport {
  return VALID_VIEWPORTS.includes(v as Viewport) ? (v as Viewport) : "desktop";
}
function asFormat(f: unknown): ImageFormat {
  return VALID_FORMATS.includes(f as ImageFormat) ? (f as ImageFormat) : "png";
}
function asWaitUntil(w: unknown): WaitUntil {
  return VALID_WAIT.includes(w as WaitUntil) ? (w as WaitUntil) : "networkidle2";
}
function clamp(n: unknown, lo: number, hi: number, def: number): number {
  const num = typeof n === "number" ? n : def;
  return Math.max(lo, Math.min(hi, Math.round(num)));
}

// ── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const t0 = Date.now();

  // 1. Auth + credit check ──────────────────────────────────────────────────
  const apiKey = await validateApiKey(req);
  if (!apiKey) {
    const auth = req.headers.get("authorization");
    if (!auth) return unauthorized();

    // Key exists but credits may be exhausted — give a precise error
    const { createHash } = await import("crypto");
    const raw = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const hash = createHash("sha256").update(raw).digest("hex");
    const { data } = await supabase
      .from("api_keys")
      .select("credits_used, credit_limit")
      .eq("key_hash", hash)
      .single();
    if (data && data.credits_used >= data.credit_limit) return paymentRequired();
    return unauthorized();
  }

  // 2. Parse + validate body ────────────────────────────────────────────────
  const body = await req.json().catch(() => null);
  if (!body?.url || typeof body.url !== "string") {
    return NextResponse.json(
      { error: "url is required and must be a string" },
      { status: 400 }
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(body.url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error();
  } catch {
    return NextResponse.json(
      { error: "Invalid URL — must start with http:// or https://" },
      { status: 400 }
    );
  }

  // 3. Capture screenshot via warm browser pool ─────────────────────────────
  let result: Awaited<ReturnType<typeof takeScreenshot>>;
  try {
    result = await takeScreenshot({
      url:          parsedUrl.href,
      viewport:     asViewport(body.viewport),
      full_page:    body.full_page === true,
      format:       asFormat(body.format),
      quality:      clamp(body.quality, 1, 100, 85),
      wait_until:   asWaitUntil(body.wait_until),
      dark_mode:    body.dark_mode === true,
      timeout:      clamp(body.timeout, 1_000, 25_000, 15_000),
    });
  } catch (err) {
    console.error("[screenshot] capture failed:", err);
    return NextResponse.json(
      { error: "Failed to capture screenshot. Check that the URL is reachable." },
      { status: 502 }
    );
  }

  const totalMs = Date.now() - t0;
  const creditsRemaining = apiKey.credit_limit - apiKey.credits_used - 1;

  // 4. Audit log + debit credits (fire-and-forget — doesn't block response) ─
  void (async () => {
    await Promise.all([
      supabase.from("screenshots").insert({
        api_key_id:  apiKey.id,
        url:         parsedUrl.href,
        duration_ms: result.duration_ms,
        format:      result.format,
      }),
      supabase
        .from("api_keys")
        .update({ credits_used: apiKey.credits_used + 1 })
        .eq("id", apiKey.id),
    ]);
  })();

  // 5. Return binary image ───────────────────────────────────────────────────
  const mimeMap: Record<ImageFormat, string> = {
    png:  "image/png",
    jpeg: "image/jpeg",
    webp: "image/webp",
  };

  return new Response(result.buffer.buffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type":        mimeMap[result.format],
      "Content-Length":      String(result.buffer.length),
      "Cache-Control":       "no-store",
      // Telemetry headers — useful for diagnosing p99 in logs
      "X-Response-Time":     `${totalMs}ms`,
      "X-Screenshot-Time":   `${result.duration_ms}ms`,
      "X-Credits-Used":      "1",
      "X-Credits-Remaining": String(Math.max(0, creditsRemaining)),
    },
  });
}
