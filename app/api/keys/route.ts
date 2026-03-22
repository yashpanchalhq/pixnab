import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validateApiKey, unauthorized } from "@/lib/auth";
import { randomBytes, createHash } from "crypto";

// POST /api/keys — generate a new API key
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.user_email) {
    return NextResponse.json({ error: "user_email is required" }, { status: 400 });
  }

  const rawKey = `ss_${randomBytes(32).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const plan = body.plan === "pro" ? "pro" : "free";
  const creditLimit = plan === "pro" ? 1000 : 100;

  const { data, error } = await supabase
    .from("api_keys")
    .insert({ key_hash: keyHash, user_email: body.user_email, plan, credit_limit: creditLimit })
    .select("id, user_email, plan, credits_used, credit_limit, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Raw key returned ONCE — never stored
  return NextResponse.json({ ...data, key: rawKey }, { status: 201 });
}

// GET /api/keys — show key info (no raw key)
export async function GET(req: NextRequest) {
  const apiKey = await validateApiKey(req);
  if (!apiKey) return unauthorized();
  return NextResponse.json(apiKey);
}
