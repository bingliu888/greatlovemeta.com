/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  CLASS_FILES?: R2Bucket;
  CLOUDFLARE_REALTIME_API_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  REALTIMEKIT_APP_ID?: string;
  REALTIMEKIT_GUEST_PRESET?: string;
  REALTIMEKIT_MEMBER_PRESET?: string;
  REALTIMEKIT_HOST_PRESET?: string;
  REALTIMEKIT_VIEWER_PRESET?: string;
  BUCKET: R2Bucket;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (env) (globalThis as unknown as { __CLASS_RUNTIME_ENV__?: Env }).__CLASS_RUNTIME_ENV__ = env;
    (globalThis as unknown as { __GREATLOVEMETA_DB__?: D1Database; __GREATLOVEMETA_BUCKET__?: R2Bucket }).__GREATLOVEMETA_DB__ = env.DB;
    (globalThis as unknown as { __GREATLOVEMETA_BUCKET__?: R2Bucket }).__GREATLOVEMETA_BUCKET__ = env.BUCKET;
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
