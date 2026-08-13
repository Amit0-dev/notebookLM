import type { Metadata } from "next";
import { Work_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AppProviders } from "@/components/providers/app-providers";

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "ShelfLM",
  description: "Workspaces for sources, grounded chat, and learning that becomes action.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        workSans.variable,
        jetbrainsMono.variable,
      )}
    >
      <body className="min-h-full flex flex-col font-sans">
        {/*
          THESIS: Sign-in is pressing a seal — one fixed-width column, vermilion mark, sumi text; refuse the floating SaaS auth card.
          OWN-WORLD: Washi ground #F4EFE6, sumi #1A1A1A, vermilion seal #C23A2B, amber cue #C9A227; hairline rules; square seal geometry; Work Sans + JetBrains Mono.
          STORY: Visitor understands ShelfLM is a desk for sources; believes identity is deliberate; presses Continue with Google to enter the dashboard.
          FIRST VIEWPORT: Centered 420px column — brand + seal mark, heading, one line, full-width vermilion Google CTA, mode switch, error stamp below; all share one left edge.
          FORM: Inkan Seal Desk (seed a058fa0c, assigned #6) raised by orizuru step-marker, ikeda hairlines, doujin fixed measure.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
        */}
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
