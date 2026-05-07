// ── Cloudflare Worker — beta signup capture ───────────────────────────────
// This script handles dynamic routes for the deployed Worker. Anything it
// doesn't recognise falls through to the static assets handler (the Astro
// build output in ./dist), so the marketing site keeps working unchanged.
//
// Routes:
//   POST /api/subscribe   — validate email + insert into D1
//   GET  /api/list        — admin-only CSV dump (protected by ADMIN_TOKEN)
//
// All other URLs hit the static-assets fallback configured in wrangler.jsonc.

interface Env {
  /** D1 binding configured in wrangler.jsonc → assets + d1_databases */
  DB: D1Database;
  /** Bearer token required to call /api/list. Set via:
   *  `npx wrangler secret put ADMIN_TOKEN` */
  ADMIN_TOKEN?: string;
  /** Static assets binding — Workers serves files from ./dist via this. */
  ASSETS: { fetch: (req: Request) => Promise<Response> };
}

// ── Helpers ────────────────────────────────────────────────────────────────
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

// Lightweight email validator. Aims for "almost certainly an email"
// without going down the RFC-5322 rabbit hole. Anything weirder is
// rejected with a friendly message.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ── Worker ─────────────────────────────────────────────────────────────────
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // ── /api/subscribe — accept beta signups ────────────────────────────
    if (url.pathname === "/api/subscribe" && request.method === "POST") {
      let email: string | undefined;

      // Accept both form submissions (default <form> POST) and JSON
      // (progressive enhancement on the client). Form posts come back
      // with a redirect; JSON posts get a JSON response.
      const ct = request.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        try {
          const body = (await request.json()) as { email?: unknown };
          if (typeof body.email === "string") email = body.email;
        } catch {
          return json({ ok: false, error: "Invalid JSON body" }, 400);
        }
      } else {
        const form = await request.formData();
        const v = form.get("email");
        if (typeof v === "string") email = v;
      }

      email = (email ?? "").trim().toLowerCase();
      if (!email || !EMAIL_RE.test(email) || email.length > 320) {
        return respondToForm(request, ct, "/?signup=invalid", {
          ok: false,
          error: "Please enter a valid email address.",
        }, 400);
      }

      // Pull a few signal fields for diagnostics. We only store IP-hash
      // (not the raw IP) and UA so we have spam-detection data without
      // hoarding personally-identifying info. Privacy policy already
      // discloses we keep this for the beta.
      const ua = request.headers.get("user-agent") ?? "";
      const ip = request.headers.get("cf-connecting-ip") ?? "";
      const ipHash = ip ? await sha256(ip) : "";
      const ref = request.headers.get("referer") ?? "";

      // INSERT OR IGNORE — duplicates of the same email silently succeed
      // so refreshing / re-submitting doesn't error or double-insert.
      try {
        await env.DB.prepare(
          `INSERT OR IGNORE INTO signups (email, ua, ip_hash, referer, created_at)
           VALUES (?, ?, ?, ?, datetime('now'))`,
        )
          .bind(email, ua, ipHash, ref)
          .run();
      } catch (e) {
        console.error("D1 insert failed:", e);
        return respondToForm(request, ct, "/?signup=error", {
          ok: false,
          error: "Could not save your email. Try again in a moment.",
        }, 500);
      }

      return respondToForm(request, ct, "/?signup=ok", { ok: true });
    }

    // ── /api/list — admin-only CSV dump ─────────────────────────────────
    // Hit this with: `curl -H "Authorization: Bearer <ADMIN_TOKEN>" \
    //                       https://tubelane.in/api/list > signups.csv`
    if (url.pathname === "/api/list" && request.method === "GET") {
      const auth = request.headers.get("authorization") ?? "";
      const expected = `Bearer ${env.ADMIN_TOKEN ?? ""}`;
      if (!env.ADMIN_TOKEN || auth !== expected) {
        return new Response("Unauthorized", { status: 401 });
      }

      const { results } = await env.DB.prepare(
        `SELECT email, created_at, referer FROM signups ORDER BY created_at DESC`,
      ).all<{ email: string; created_at: string; referer: string }>();

      // CSV output — wrap each field in quotes, escape any embedded "
      const rows = [
        ["email", "created_at", "referer"],
        ...results.map((r) => [r.email, r.created_at, r.referer]),
      ];
      const csv = rows
        .map((row) =>
          row.map((cell) => `"${(cell ?? "").replace(/"/g, '""')}"`).join(","),
        )
        .join("\n");

      return new Response(csv, {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": 'attachment; filename="tubelane-signups.csv"',
        },
      });
    }

    // ── Anything else → static assets ────────────────────────────────────
    return env.ASSETS.fetch(request);
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────

/** Send the right shape of response for the request type — JSON if the
 *  client posted JSON, an HTTP redirect for plain HTML form submits. The
 *  form falls back to a redirect to /?signup=ok|error|invalid which the
 *  index page reads to render an inline confirmation banner. */
function respondToForm(
  request: Request,
  contentType: string,
  redirectPath: string,
  payload: { ok: boolean; error?: string },
  status = 200,
) {
  if (contentType.includes("application/json")) {
    return json(payload, status);
  }
  // Resolve the redirect against the request origin so we never leak
  // arbitrary external URLs.
  const url = new URL(redirectPath, request.url);
  return Response.redirect(url.toString(), 303);
}

/** SHA-256 hex digest using the Web Crypto API (available in Workers). */
async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
