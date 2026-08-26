import { getSessionUser } from "@/lib/auth";
import { saveMemberWallet } from "@/lib/wallet-binding";

export async function POST(request:Request){
  const user=await getSessionUser(request);
  if(!user)return Response.json({error:"Sign in required"},{status:401});
  const body=await request.json().catch(()=>null) as {wallet?:string}|null;
  try {
    const wallet=await saveMemberWallet(user.id,String(body?.wallet||""));
    return Response.json({wallet});
  } catch (error) {
    const reason=error instanceof Error?error.message:"";
    if(reason==="WALLET_ALREADY_IN_USE")return Response.json({error:"This wallet belongs to another account with subscription history"},{status:409});
    return Response.json({error:"Enter a valid EVM wallet address"},{status:400});
  }
}
