import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["shared/post-labor/*.spec.ts", "actions/post-labor-approval.spec.ts"], environment: "node" } });
