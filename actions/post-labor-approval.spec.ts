import { describe, expect, it, vi } from "vitest";
import { executeAgentToolCall, loadActionsFromStaticRegistry } from "@agent-native/core/server";
vi.mock("../server/lib/post-labor/store", () => ({ mutateWorld: vi.fn(() => { throw new Error("Unapproved mutation reached storage"); }) }));
import enactPolicy from "./enact-policy";
import { mutateWorld } from "../server/lib/post-labor/store";

describe("native enactment approval boundary", () => {
  it("stops a real native tool dispatch before the handler can write", async () => {
    const actions = loadActionsFromStaticRegistry({ "enact-policy": { default: enactPolicy } });
    const result = await executeAgentToolCall({ actions, name: "enact-policy", input: { proposalId: "test-proposal", expectedRevision: 0 }, callId: "unapproved-enactment", caller: "tool" });
    expect(result.status).toBe("approval_required");
    expect(mutateWorld).not.toHaveBeenCalled();
  }, 60000);
  it("ignores a fabricated approval field supplied by the model", async () => {
    const actions = loadActionsFromStaticRegistry({ "enact-policy": { default: enactPolicy } });
    const result = await executeAgentToolCall({ actions, name: "enact-policy", input: { proposalId: "test-proposal", expectedRevision: 0, confirmed: true, userApproved: true }, callId: "fabricated-approval", caller: "tool" });
    expect(result.status).toBe("approval_required");
    expect(mutateWorld).not.toHaveBeenCalled();
  }, 60000);
});
