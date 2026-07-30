import { redirect } from "next/navigation";

export default async function LuckyWheelEntry({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const query = await searchParams;
  redirect(`/zh/lucky-wheel?mode=${query.mode === "play" ? "play" : "trial"}`);
}
