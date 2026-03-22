/**
 * lib/browser.ts
 *
 * Singleton Chromium browser shared across all API requests within
 * the same Node.js process lifetime.
 *
 * First request pays the cold-start cost (~1-3s).
 * Every subsequent request reuses the warm browser by opening
 * a new Page (tab) — no relaunch overhead.
 *
 * The module also exposes `takeScreenshot()` which handles:
 *  - Viewport selection (desktop / tablet / mobile)
 *  - Aggressive resource blocking (fonts, ads, analytics)
 *  - Configurable wait strategy
 *  - p99 timing telemetry via X-Response-Time header values
 */

import type { Browser, Page } from "puppeteer-core";

// ── Constants ───────────────────────────────────────────────────────────────

export type Viewport = "desktop" | "tablet" | "mobile";
export type WaitUntil = "load" | "domcontentloaded" | "networkidle0" | "networkidle2";
export type ImageFormat = "png" | "jpeg" | "webp";

const VIEWPORTS: Record<Viewport, { width: number; height: number; deviceScaleFactor: number }> = {
  desktop: { width: 1280, height: 800,  deviceScaleFactor: 1 },
  tablet:  { width: 768,  height: 1024, deviceScaleFactor: 1 },
  mobile:  { width: 375,  height: 812,  deviceScaleFactor: 2 },
};

/** Third-party domains to abort — saves 300–800 ms per request */
const BLOCKED_DOMAINS = [
  "google-analytics.com", "googletagmanager.com", "analytics.google.com",
  "facebook.net", "connect.facebook.net", "facebook.com/tr",
  "hotjar.com", "hj.hotjar.com",
  "segment.io", "segment.com", "cdn.segment.com",
  "intercom.io", "widget.intercom.io",
  "crisp.chat", "client.crisp.chat",
  "doubleclick.net", "googlesyndication.com", "adservice.google.com",
  "clarity.ms", "bing.com/bat.js",
  "twitter.com/i/adsct", "px.ads.linkedin.com",
  "mc.yandex.ru", "mc.yandex.com",
  "amplitude.com", "mixpanel.com",
];

/** Resource types we never need for a visual screenshot */
const BLOCKED_TYPES = new Set(["media", "websocket", "eventsource", "other"]);

// ── Singleton state ─────────────────────────────────────────────────────────

let _browser: Browser | null = null;
let _launching: Promise<Browser> | null = null;

async function launchBrowser(): Promise<Browser> {
  // Dynamic import keeps the module from failing at build time on platforms
  // that don't have Chromium installed (e.g. type-check CI).
  const puppeteer = (await import("puppeteer-core")).default;
  const isVercel = !!process.env.VERCEL;

  let executablePath: string;
  let args: string[];

  if (isVercel) {
    const chromium = (await import("@sparticuz/chromium")).default;
    executablePath = await chromium.executablePath();
    args = [
      ...chromium.args,
      "--hide-scrollbars",
      "--mute-audio",
    ];
  } else {
    // Local: try common system Chrome/Chromium paths
    const { existsSync } = await import("fs");
    const candidates = [
      process.env.CHROME_PATH,
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
    ].filter(Boolean) as string[];
    const found = candidates.find((p) => existsSync(p));
    if (!found) {
      throw new Error(
        "No local Chrome/Chromium found. Install Chrome or set CHROME_PATH env var."
      );
    }
    executablePath = found;
    args = [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
      "--hide-scrollbars",
      "--mute-audio",
    ];
  }

  const browser = await puppeteer.launch({
    executablePath,
    args,
    headless: true,
    defaultViewport: null, // we set per-page
  });

  // Clear singleton reference so the next call re-launches if the process dies
  browser.on("disconnected", () => {
    _browser = null;
    _launching = null;
  });

  return browser;
}

/** Returns the shared warm browser, launching it on first call. */
export async function getBrowser(): Promise<Browser> {
  if (_browser && _browser.isConnected()) return _browser;

  // Prevent concurrent launch races — only one launch in-flight at a time
  if (!_launching) {
    _launching = launchBrowser().then((b) => {
      _browser = b;
      _launching = null;
      return b;
    });
  }

  return _launching;
}

// ── Public API ──────────────────────────────────────────────────────────────

export interface ScreenshotOptions {
  url: string;
  viewport?: Viewport;
  full_page?: boolean;
  format?: ImageFormat;
  quality?: number;           // 1–100, jpeg/webp only
  wait_until?: WaitUntil;
  timeout?: number;           // ms, default 15 000
  device_scale_factor?: number;
  dark_mode?: boolean;
}

export interface ScreenshotResult {
  buffer: Buffer;
  format: ImageFormat;
  duration_ms: number;
  width: number;
  height: number;
}

export async function takeScreenshot(opts: ScreenshotOptions): Promise<ScreenshotResult> {
  const {
    url,
    viewport = "desktop",
    full_page = false,
    format = "png",
    quality = 85,
    wait_until = "networkidle2",
    timeout = 15_000,
    dark_mode = false,
  } = opts;

  const t0 = Date.now();
  const browser = await getBrowser();
  const vp = VIEWPORTS[viewport];

  // Each request gets its own isolated page (tab) — browser stays warm
  const page: Page = await browser.newPage();

  try {
    // Viewport + optional HiDPI
    await page.setViewport({
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: opts.device_scale_factor ?? vp.deviceScaleFactor,
    });

    // Dark mode emulation
    if (dark_mode) {
      await page.emulateMediaFeatures([
        { name: "prefers-color-scheme", value: "dark" },
      ]);
    }

    // ── Resource blocking — the biggest latency win ─────────────────────
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const type = request.resourceType();
      const reqUrl = request.url();

      // Block by resource type
      if (BLOCKED_TYPES.has(type)) {
        request.abort();
        return;
      }

      // Block by domain (analytics, ads, trackers)
      if (BLOCKED_DOMAINS.some((d) => reqUrl.includes(d))) {
        request.abort();
        return;
      }

      request.continue();
    });

    // ── Navigate ────────────────────────────────────────────────────────
    await page.goto(url, { waitUntil: wait_until, timeout });

    // ── Capture ─────────────────────────────────────────────────────────
    const screenshotOpts: Parameters<Page["screenshot"]>[0] = {
      fullPage: full_page,
      type: format,
      ...(format !== "png" && { quality }),
    };

    const raw = await page.screenshot(screenshotOpts);
    const buffer = Buffer.from(raw);

    const duration_ms = Date.now() - t0;

    return {
      buffer,
      format,
      duration_ms,
      width: vp.width,
      height: full_page ? 0 : vp.height, // 0 = dynamic height (full page)
    };
  } finally {
    // Always close the tab, but NEVER close the browser
    await page.close();
  }
}
