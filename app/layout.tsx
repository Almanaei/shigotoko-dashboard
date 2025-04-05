import type { Metadata } from "next";
import { Inter, Roboto } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const roboto = Roboto({ 
  weight: ['400', '500', '700'],
  subsets: ["latin"],
  variable: '--font-roboto'
});

export const metadata: Metadata = {
  title: "Shigotoko | Employee Management Dashboard",
  description: "Modern dashboard for employee management system with intuitive navigation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${roboto.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
