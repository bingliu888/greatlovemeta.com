import assert from "node:assert/strict"; import test from "node:test"; import { walletRpcErrorCode } from "../lib/wallet-rpc.ts";
test("nested wallet errors retain actionable code",()=>{assert.equal(walletRpcErrorCode({error:{data:{code:"-32002"}}}),-32002);});
