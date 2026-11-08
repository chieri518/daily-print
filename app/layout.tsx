import type { Metadata } from "next";
import { Playfair_Display, Source_Serif_4, UnifrakturMaguntia } from "next/font/google";
import Link from "next/link";
import { signOut } from "./actions";
import { getReader } from "@/lib/supabase/server";
import "./globals.css";

const masthead = UnifrakturMaguntia({ weight: "400", subsets: ["latin"], variable: "--masthead" });
const headline = Playfair_Display({ weight: "700", subsets: ["latin"], variable: "--headline" });
const body = Source_Serif_4({ subsets: ["latin"], variable: "--body" });

export const metadata: Metadata = {
  title: "Daily Print",
  description: "Your own newspaper, written each morning and ready to print.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const reader = await getReader();
  return (
    <html lang="en" className={`${masthead.variable} ${headline.variable} ${body.variable}`}>
      <body>
        <header className="site-header">
          <Link href="/">Daily Print</Link>
          {reader && (
            <nav>
              <Link href="/">Paper</Link>
              <Link href="/editions">Editions</Link>
              <Link href="/customize">Customize</Link>
              <form action={signOut}>
                <button className="link">Sign out</button>
              </form>
            </nav>
          )}
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
