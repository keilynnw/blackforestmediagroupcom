import { createServerFn } from "@tanstack/react-start";
import { test } from "vitest";
test("peek", () => {
  const fn = createServerFn({ method: "POST" })
    .inputValidator((d: any) => d)
    .handler(async ({ data }) => ({ ok: true, data }));
  console.log("KEYS", Object.keys(fn));
  console.log("PROTO", Object.getOwnPropertyNames(Object.getPrototypeOf(fn) || {}));
  for (const k of Object.keys(fn)) console.log(k, typeof (fn as any)[k]);
});
