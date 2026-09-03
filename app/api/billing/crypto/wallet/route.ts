import { getSessionUser } from "@/lib/auth";
import { saveMemberWallet } from "@/lib/wallet-binding";

export async function POST(request:Request){
  const user=await getSessionUser(request);
  if(!user)return Response.json({error:"Sign in required"},{status:401});
  const body=await request.json().catch(()=>null) as {wallet?:string}|null;
  try {
    const wallet=await saveMemberWallet(user.id,String(body?.wallet||""));
    return Response.json({wallet});
  } catch {
    return Response.json({error:"Enter a valid EVM wallet address"},{status:400});
  }
}
