import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://thiago.valionsistemas.com.br"),
  title: {
    default: "Thiago — Desenvolvedor de Software",
    template: "%s · Thiago",
  },
  description:
    "Perfil profissional de Thiago: estudante de Análise e Desenvolvimento de Sistemas, criador do Encanto System e em construção de uma carreira em tecnologia.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Thiago",
    title: "Thiago — Desenvolvedor de Software",
    description:
      "Perfil profissional de Thiago: estudante de ADS, criador do Encanto System e em construção de uma carreira em tecnologia.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full motion-safe:scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
