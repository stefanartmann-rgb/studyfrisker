import type { Metadata } from "next";
import "./globals.css";

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
      <body className="bg-background text-ink antialiased">{children}</body>
    </html>
  );
}
