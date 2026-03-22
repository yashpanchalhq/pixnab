import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createHash } from "crypto";

export type ApiKeyRow = {
  id: string;
  user_email: string;
  plan: string;
  credits_used: number;
  credit_limit: number;
};

// Validate Bearer token → returns api_key row or null
export async function validateApiKey(req: NextRequest): Promise<ApiKeyRow | null> {
  const authHeader = req.headers.get("authorization") ?? "";
  const rawKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!rawKey) return null;

  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const { data } = await supabase
    .from("api_keys")
    .select("id, user_email, plan, credits_used, credit_limit")
    .eq("key_hash", keyHash)
    .single();

  if (!data) return null;

  // Reject if credits exhausted
  if (data.credits_used >= data.credit_limit) return null;

  return data as ApiKeyRow;
}

export function unauthorized(msg = "Invalid or missing API key"): NextResponse {
  return NextResponse.json({ error: msg }, { status: 401 });
}

export function paymentRequired(msg = "Credit limit reached. Upgrade your plan."): NextResponse {
  return NextResponse.json({ error: msg }, { status: 402 });
}
