import type { Metadata } from "next";
import "./globals.css";
import { TabBar } from "./components/TabBar";

export const metadata: Metadata = {
  title: "StudyFrisker",
  description: "Grading how trustworthy health science really is.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-ink antialiased">
        <div className="pb-24">{children}</div>
        <TabBar />
      </body>
    </html>
  );
}
