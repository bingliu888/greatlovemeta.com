import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Common, Hardfork, Mainnet } from "@ethereumjs/common";
import { createLegacyTx } from "@ethereumjs/tx";
import { bytesToHex, createAccount, createAddressFromPrivateKey, hexToBytes } from "@ethereumjs/util";
import { createVM, runTx } from "@ethereumjs/vm";
import { decodeEventLog, decodeFunctionResult, encodeDeployData, encodeFunctionData } from "viem";

const artifact=JSON.parse(await readFile(new URL("../contracts/artifacts/SmartPay5.json",import.meta.url),"utf8"));
const tokenArtifact=JSON.parse(await readFile(new URL("../contracts/artifacts/MockUSDC.json",import.meta.url),"utf8"));
const burnTokenArtifact=JSON.parse(await readFile(new URL("../contracts/artifacts/MockBurnToken.json",import.meta.url),"utf8"));
const ownerKey=hexToBytes(`0x${"11".repeat(32)}`);
const payerKey=hexToBytes(`0x${"22".repeat(32)}`);
const treasuryKey=hexToBytes(`0x${"33".repeat(32)}`);
const owner=createAddressFromPrivateKey(ownerKey);
const payer=createAddressFromPrivateKey(payerKey);
const treasury=createAddressFromPrivateKey(treasuryKey);
const zeroAddress="0x0000000000000000000000000000000000000000";

async function testChain(){
  const common=new Common({chain:Mainnet,hardfork:Hardfork.Prague});
  const vm=await createVM({common});
  for(const address of [owner,payer,treasury])await vm.stateManager.putAccount(address,createAccount({nonce:0n,balance:10n**22n}));
  async function send(key,{to,data,expectFailure=false}){
    const sender=createAddressFromPrivateKey(key);
    const account=await vm.stateManager.getAccount(sender);
    const tx=createLegacyTx({nonce:account?.nonce||0n,gasLimit:20_000_000n,gasPrice:10n,to,data:hexToBytes(data)},{common}).sign(key);
    const result=await runTx(vm,{tx});
    assert.equal(Boolean(result.execResult.exceptionError),expectFailure,result.execResult.exceptionError?.error||"unexpected transaction status");
    return result;
  }
  async function deploy(key,deploymentArtifact,args=[]){
    const result=await send(key,{data:encodeDeployData({abi:deploymentArtifact.abi,bytecode:deploymentArtifact.bytecode,args})});
    assert.ok(result.createdAddress);
    return result.createdAddress;
  }
  async function call(address,abi,functionName,args=[],caller=owner){
    const result=await vm.evm.runCall({caller,to:address,gasLimit:10_000_000n,data:hexToBytes(encodeFunctionData({abi,functionName,args}))});
    assert.equal(result.execResult.exceptionError,undefined,result.execResult.exceptionError?.error);
    return decodeFunctionResult({abi,functionName,data:bytesToHex(result.execResult.returnValue)});
  }
  return {send,deploy,call};
}

async function deployCheckout(chain,{configure=true}={}){
  const primary=await chain.deploy(ownerKey,tokenArtifact);
  const secondary=await chain.deploy(ownerKey,tokenArtifact);
  const contract=await chain.deploy(ownerKey,artifact,[owner.toString()]);
  const fullPrimary=300_000_000n;
  const fullSecondary=300_000_000_000_000n;
  const minimumSecondaryBalance=1_000_000_000_000_000n;
  if(configure){
    await chain.send(ownerKey,{to:contract,data:encodeFunctionData({abi:artifact.abi,functionName:"setPayouts",args:[[owner.toString(),treasury.toString()],[3000,0]]})});
    await chain.send(ownerKey,{to:contract,data:encodeFunctionData({abi:artifact.abi,functionName:"setPaymentRule",args:[primary.toString(),secondary.toString(),"greatlovemeta_membership_monthly","",fullPrimary,fullSecondary,minimumSecondaryBalance,true]})});
  }
  return {primary,secondary,contract,fullPrimary,fullSecondary,minimumSecondaryBalance};
}

test("SmartPay5 is the only public ABI and exposes authoritative price reads",async()=>{
  const publicAbi=JSON.parse(await readFile(new URL("../public/contracts/SmartPay5.abi.json",import.meta.url),"utf8"));
  assert.deepEqual(publicAbi,artifact.abi);
  assert.equal(artifact.contractName,"SmartPay5");
  const rule=publicAbi.find(item=>item.type==="function"&&item.name==="paymentRule");
  assert.deepEqual(rule.inputs.map(input=>input.name),["primaryTokenAddress","secondaryTokenAddress","mainId","secondId"]);
  assert.deepEqual(rule.outputs.map(output=>output.name),["primaryTokenAmount","secondaryTokenAmount","minimumSecondaryBalance","enabled"]);
  const pay=publicAbi.find(item=>item.type==="function"&&item.name==="pay");
  assert.deepEqual(pay.inputs.map(input=>input.name),["primaryTokenAddress","secondaryTokenAddress","mainId","secondId","primaryTokenAmount","refId","payerId"]);
  const transaction=publicAbi.find(item=>item.type==="function"&&item.name==="transactionById");
  assert.deepEqual(transaction.outputs[0].components.map(component=>component.name),["transactionId","timestamp","wallet","payerId","refId","mainId","secondId","primaryTokenAddress","primaryTokenAmount","secondaryTokenAddress","secondaryTokenAmount"]);
  assert.equal(Boolean(publicAbi.find(item=>item.type==="function"&&item.name==="getTransactionsByWallet")),false);
  assert.ok(publicAbi.find(item=>item.type==="function"&&item.name==="getTransactionsByPayerID"));
  assert.equal(JSON.stringify(publicAbi).toLowerCase().includes("domain"),false);
});

test("SmartPay5 reads its rule and atomically records mixed, secondary-only, and primary-only payments",async()=>{
  const chain=await testChain();
  const {primary,secondary,contract,fullPrimary,fullSecondary,minimumSecondaryBalance}=await deployCheckout(chain);
  const rule=await chain.call(contract,artifact.abi,"paymentRule",[primary.toString(),secondary.toString(),"greatlovemeta_membership_monthly",""]);
  assert.deepEqual(rule,[fullPrimary,fullSecondary,minimumSecondaryBalance,true]);
  await chain.send(ownerKey,{to:primary,data:encodeFunctionData({abi:tokenArtifact.abi,functionName:"mint",args:[payer.toString(),fullPrimary*2n]})});
  await chain.send(ownerKey,{to:secondary,data:encodeFunctionData({abi:tokenArtifact.abi,functionName:"mint",args:[payer.toString(),minimumSecondaryBalance+fullSecondary*2n]})});
  await chain.send(payerKey,{to:primary,data:encodeFunctionData({abi:tokenArtifact.abi,functionName:"approve",args:[contract.toString(),fullPrimary*2n]})});
  await chain.send(payerKey,{to:secondary,data:encodeFunctionData({abi:tokenArtifact.abi,functionName:"approve",args:[contract.toString(),minimumSecondaryBalance+fullSecondary*2n]})});
  const rows=[[fullPrimary/2n,fullSecondary/2n,"ABC234"],[0n,fullSecondary,"ZXCVBN"],[fullPrimary,0n,"H7M9P2"]];
  const ids=[];
  for(const [primaryAmount,secondaryAmount,refId] of rows){
    const result=await chain.send(payerKey,{to:contract,data:encodeFunctionData({abi:artifact.abi,functionName:"pay",args:[primary.toString(),secondary.toString(),"greatlovemeta_membership_monthly","",primaryAmount,refId,"PAY234"]})});
    const decoded=result.receipt.logs.map(([address,topics,data])=>({address:bytesToHex(address),topics:topics.map(bytesToHex),data:bytesToHex(data)})).map(log=>{try{return decodeEventLog({abi:artifact.abi,...log});}catch{return null;}});
    const recorded=decoded.find(item=>item?.eventName==="TransactionRecorded");
    assert.ok(recorded);
    assert.equal(recorded.args.primaryTokenAmount,primaryAmount);
    assert.equal(recorded.args.secondaryTokenAmount,secondaryAmount);
    assert.equal(recorded.args.refId,refId);
    assert.equal(recorded.args.payerId,"PAY234");
    ids.push(recorded.args.transactionId);
    const payouts=decoded.filter(item=>item?.eventName==="PayoutExecuted");
    for(const [token,amount] of [[primary.toString(),primaryAmount],[secondary.toString(),secondaryAmount]]){
      const splits=payouts.filter(item=>item.args.tokenAddress.toLowerCase()===token.toLowerCase()).map(item=>item.args.tokenAmount);
      assert.deepEqual(splits,amount?[amount*30n/100n,amount-(amount*30n/100n)]:[]);
    }
  }
  const latest=await chain.call(contract,artifact.abi,"getTransactionsByPayerID",["PAY234",100n]);
  assert.equal(latest[1],3n);
  assert.equal((await chain.call(contract,artifact.abi,"getTransactionsByPayerID",["pay234",100n]))[1],3n);
  assert.deepEqual(latest[0].map(record=>record.transactionId),ids.toReversed());
  assert.deepEqual(latest[0].map(record=>record.refId),rows.map(row=>row[2]).toReversed());
});

test("SmartPay5 enforces secondary eligibility and exact single-token rules",async()=>{
  const chain=await testChain();
  const {primary,secondary,contract,fullPrimary,fullSecondary,minimumSecondaryBalance}=await deployCheckout(chain);
  await chain.send(ownerKey,{to:primary,data:encodeFunctionData({abi:tokenArtifact.abi,functionName:"mint",args:[payer.toString(),fullPrimary*2n]})});
  await chain.send(ownerKey,{to:secondary,data:encodeFunctionData({abi:tokenArtifact.abi,functionName:"mint",args:[payer.toString(),minimumSecondaryBalance-1n]})});
  await chain.send(payerKey,{to:primary,data:encodeFunctionData({abi:tokenArtifact.abi,functionName:"approve",args:[contract.toString(),fullPrimary*2n]})});
  await chain.send(payerKey,{to:secondary,data:encodeFunctionData({abi:tokenArtifact.abi,functionName:"approve",args:[contract.toString(),fullSecondary]})});
  await chain.send(payerKey,{to:contract,data:encodeFunctionData({abi:artifact.abi,functionName:"pay",args:[primary.toString(),secondary.toString(),"greatlovemeta_membership_monthly","",fullPrimary/2n,"ADM234","PAY234"]}),expectFailure:true});
  await chain.send(payerKey,{to:contract,data:encodeFunctionData({abi:artifact.abi,functionName:"pay",args:[primary.toString(),secondary.toString(),"greatlovemeta_membership_monthly","",fullPrimary,"ADM234","PAY234"]})});
  await chain.send(ownerKey,{to:contract,data:encodeFunctionData({abi:artifact.abi,functionName:"setPaymentRule",args:[primary.toString(),zeroAddress,"greatlovemeta_membership_six_month","",fullPrimary,0n,0n,true]})});
  await chain.send(payerKey,{to:contract,data:encodeFunctionData({abi:artifact.abi,functionName:"pay",args:[primary.toString(),zeroAddress,"greatlovemeta_membership_six_month","",fullPrimary/2n,"ADM234","PAY234"]}),expectFailure:true});
  await chain.send(payerKey,{to:contract,data:encodeFunctionData({abi:artifact.abi,functionName:"pay",args:[primary.toString(),zeroAddress,"greatlovemeta_membership_six_month","",fullPrimary,"ADM234","PAY234"]})});
  await chain.send(payerKey,{to:contract,data:encodeFunctionData({abi:artifact.abi,functionName:"pay",args:[primary.toString(),zeroAddress,"greatlovemeta_membership_six_month","",fullPrimary,"BAD12","PAY234"]}),expectFailure:true});
  await chain.send(payerKey,{to:contract,data:encodeFunctionData({abi:artifact.abi,functionName:"pay",args:[primary.toString(),zeroAddress,"greatlovemeta_membership_six_month","",fullPrimary,"ADM234","BAD12"]}),expectFailure:true});
});

test("SmartPay5 accepts a token that burns 30% from every payout transfer",async()=>{
  const chain=await testChain();
  const primary=await chain.deploy(ownerKey,tokenArtifact);
  const glc=await chain.deploy(ownerKey,burnTokenArtifact);
  const contract=await chain.deploy(ownerKey,artifact,[owner.toString()]);
  const secondPayout=createAddressFromPrivateKey(hexToBytes(`0x${"44".repeat(32)}`));
  const nominal=10_000_000n*10n**18n;
  await chain.send(ownerKey,{to:contract,data:encodeFunctionData({abi:artifact.abi,functionName:"setPayouts",args:[[treasury.toString(),secondPayout.toString()],[3000,0]]})});
  await chain.send(ownerKey,{to:contract,data:encodeFunctionData({abi:artifact.abi,functionName:"setPaymentRule",args:[primary.toString(),glc.toString(),"greatlovemeta_membership_monthly","",100_000_000n,nominal,nominal,true]})});
  await chain.send(ownerKey,{to:glc,data:encodeFunctionData({abi:burnTokenArtifact.abi,functionName:"mint",args:[payer.toString(),nominal]})});
  await chain.send(payerKey,{to:glc,data:encodeFunctionData({abi:burnTokenArtifact.abi,functionName:"approve",args:[contract.toString(),nominal]})});
  await chain.send(payerKey,{to:contract,data:encodeFunctionData({abi:artifact.abi,functionName:"pay",args:[primary.toString(),glc.toString(),"greatlovemeta_membership_monthly","",0n,"ADM234","PAY234"]})});
  assert.equal(await chain.call(glc,burnTokenArtifact.abi,"balanceOf",[treasury.toString()]),nominal*30n/100n*70n/100n);
  assert.equal(await chain.call(glc,burnTokenArtifact.abi,"balanceOf",[secondPayout.toString()]),nominal*70n/100n*70n/100n);
  const indexed=await chain.call(contract,artifact.abi,"getTransactionsByPayerID",["PAY234",100n]);
  assert.equal(indexed[1],1n);
  assert.equal(indexed[0][0].wallet.toLowerCase(),payer.toString().toLowerCase());
});

test("SmartPay5 owner operations transfer immediately and reject the former owner and every non-owner",async()=>{
  const chain=await testChain();
  const {primary,secondary,contract,fullPrimary,fullSecondary,minimumSecondaryBalance}=await deployCheckout(chain);
  const calls=[
    ["setPayouts",[[payer.toString()],[0]]],
    ["setPaymentRule",[primary.toString(),secondary.toString(),"vip","",1n,1n,1n,true]],
    ["withdrawToken",[primary.toString(),1n]],
    ["pause",[]],
    ["transferOwnership",[treasury.toString()]]
  ];
  for(const [functionName,args] of calls)await chain.send(payerKey,{to:contract,data:encodeFunctionData({abi:artifact.abi,functionName,args}),expectFailure:true});
  await chain.send(ownerKey,{to:contract,data:encodeFunctionData({abi:artifact.abi,functionName:"renounceOwnership"}),expectFailure:true});
  await chain.send(ownerKey,{to:contract,data:encodeFunctionData({abi:artifact.abi,functionName:"transferOwnership",args:[treasury.toString()]})});
  assert.equal((await chain.call(contract,artifact.abi,"owner")).toLowerCase(),treasury.toString().toLowerCase());
  for(const [functionName,args] of calls)await chain.send(ownerKey,{to:contract,data:encodeFunctionData({abi:artifact.abi,functionName,args}),expectFailure:true});
  await chain.send(treasuryKey,{to:contract,data:encodeFunctionData({abi:artifact.abi,functionName:"setPaymentRule",args:[primary.toString(),secondary.toString(),"greatlovemeta_membership_monthly","",fullPrimary,fullSecondary,minimumSecondaryBalance,true]})});
  const stranded=77_000_000n;
  await chain.send(ownerKey,{to:primary,data:encodeFunctionData({abi:tokenArtifact.abi,functionName:"mint",args:[owner.toString(),stranded]})});
  await chain.send(ownerKey,{to:primary,data:encodeFunctionData({abi:tokenArtifact.abi,functionName:"transfer",args:[contract.toString(),stranded]})});
  await chain.send(ownerKey,{to:contract,data:encodeFunctionData({abi:artifact.abi,functionName:"withdrawToken",args:[primary.toString(),stranded]}),expectFailure:true});
  await chain.send(treasuryKey,{to:contract,data:encodeFunctionData({abi:artifact.abi,functionName:"withdrawToken",args:[primary.toString(),stranded]})});
  assert.equal(await chain.call(primary,tokenArtifact.abi,"balanceOf",[contract.toString()]),0n);
});
