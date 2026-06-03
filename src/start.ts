import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { supabase } from "@/integrations/supabase/client";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Attach the current Supabase access token to every server-fn request
// from the browser so `requireSupabaseAuth` can authorize the user.
const authedFetch: typeof fetch = async (input, init) => {
  const headers = new Headers(init?.headers ?? {});
  if (typeof window !== "undefined" && !headers.has("authorization")) {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) headers.set("authorization", `Bearer ${token}`);
    } catch {
      // ignore — request will go out unauthenticated and fail with 401
    }
  }
  return fetch(input as any, { ...init, headers });
};

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware],
  serverFns: { fetch: authedFetch },
}));
