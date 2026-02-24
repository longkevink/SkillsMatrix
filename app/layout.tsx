import type { Metadata } from "next";
import { Sora, Source_Sans_3, IBM_Plex_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { MOCK_ROLE_COOKIE_NAME } from "@/src/lib/constants";
import { parseMockRole } from "@/src/lib/mock-role";
import { MockRoleProvider } from "@/src/components/mock-role-provider";
import { TopNav } from "@/src/components/top-nav";
import { ChatWindowProvider } from "@/src/components/chat/chat-window-provider";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sourceSans3 = Source_Sans_3({
  variable: "--font-source-sans-3",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Skills Manager POC",
  description: "Resource scheduling and skills matrix proof of concept",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialRole = parseMockRole(cookieStore.get(MOCK_ROLE_COOKIE_NAME)?.value);

  return (
    <html lang="en">
      <body
        data-theme="executive"
        className={`${sora.variable} ${sourceSans3.variable} ${ibmPlexMono.variable} antialiased`}
      >
        <MockRoleProvider initialRole={initialRole}>
          <ChatWindowProvider>
            <div className="min-h-screen bg-app text-[color:var(--text-strong)]">
              <TopNav />
              <main className="mx-auto w-full max-w-[1800px] px-3 py-3 md:px-4 md:py-4">{children}</main>
            </div>
          </ChatWindowProvider>
        </MockRoleProvider>
      </body>
    </html>
  );
}
