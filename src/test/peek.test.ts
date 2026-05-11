import { createServerFn } from "@tanstack/react-start";
import { test } from "vitest";
test("peek", async () => {
  const fn = createServerFn({ method: "POST" })
    .inputValidator((d: any) => d)
    .handler(async ({ data, context }: any) => ({ ok: true, data, context }));
  // Try executing directly
  const result = await (fn as any).__executeServer({ data: { foo: "bar" }, context: { user: 1 } });
  console.log("RESULT", JSON.stringify(result));
});
