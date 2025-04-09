import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/ThemeProvider";
import { DashboardProvider } from "@/lib/DashboardProvider";
import { UserProvider } from '@/lib/DashboardProvider';
import { AuthProvider } from '@/lib/AuthProvider';
import { SearchProvider } from '@/lib/SearchContext';
import SearchModal from '@/components/search/SearchModal';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shigotoko Dashboard",
  description: "Modern dashboard for management and analytics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <UserProvider>
              <DashboardProvider>
                <SearchProvider>
                  {children}
                  <SearchModal />
                </SearchProvider>
              </DashboardProvider>
            </UserProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
