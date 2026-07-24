import type { Metadata } from "next";
import { Newsreader, Geist } from "next/font/google";
import "./globals.css";

/* Display serif. Newsreader over Fraunces: same warm editorial feel, but
   conventional letterforms - Fraunces's curled "j" read as a squiggle in a
   family full of J names (Jeff, Jenn, John). */
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Lakehouse",
  description:
    "The Paine family lakehouse: who is up, what needs doing, and how the house works.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${geist.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
