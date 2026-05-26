import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ObrasJM - Hospital J.M. de los Ríos | Control de Avance Físico",
  description: "Sistema de control y seguimiento del Porcentaje de Avance Físico (PAF) de las obras del Hospital de Niños J.M. de los Ríos",
  keywords: ["ObrasJM", "Hospital J.M. de los Ríos", "PAF", "Avance Físico", "Seguimiento de Obras"],
  icons: {
    icon: "/logo_hospital.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <TooltipProvider delayDuration={200}>
            {children}
          </TooltipProvider>
        </AuthProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
