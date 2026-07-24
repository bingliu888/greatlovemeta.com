import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { headers } from "next/headers";
import { TextSizeInitializer } from "../components/TextSizeControl";
import { FloatingAssistant } from "../components/FloatingAssistant";
import { NotificationBar } from "../components/NotificationBar";
import "./globals.css";
import "./readability.css";
import "./project-status.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "greatlovemeta.com";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = new URL(`${protocol}://${host}`);
  const title = "GreatLoveMeta.com — AI, RWA and Community";
  const description = "A bilingual GreatLove ecosystem hub connecting AI agents, real-world assets, community, membership and Web3 applications.";
  return {
    metadataBase: origin,
    title: { default: title, template: "%s | GreatLoveMeta.com" },
    description,
    openGraph: { title, description, type: "website", url: origin, images: [{ url: new URL("/og.png", origin).toString(), width: 1536, height: 1024, alt: "GreatLoveMeta.com — AI, RWA and Community" }] },
    twitter: { card: "summary_large_image", title, description, images: [new URL("/og.png", origin).toString()] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" data-text-size="comfortable">
        <body><TextSizeInitializer/><NotificationBar/>{children}<FloatingAssistant/></body>
      </html>
    </ClerkProvider>
  );
}
