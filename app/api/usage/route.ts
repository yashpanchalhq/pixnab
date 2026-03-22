import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validateApiKey, unauthorized } from "@/lib/auth";

// GET /api/usage — returns credits_used and credit_limit for the caller
export async function GET(req: NextRequest) {
  const apiKey = await validateApiKey(req);
  if (!apiKey) return unauthorized();

  return NextResponse.json({
    credits_used: apiKey.credits_used,
    credit_limit: apiKey.credit_limit,
    credits_remaining: apiKey.credit_limit - apiKey.credits_used,
    plan: apiKey.plan,
  });
}
