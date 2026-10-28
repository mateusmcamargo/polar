import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Atkinson_Hyperlegible_Next } from "next/font/google";
import { MainNav } from "@/components/MainNav/MainNav";
import { SiteHeader } from "@/components/SiteHeader/SiteHeader";
import "@/styles/globals.scss";

const atkinsonHyperlegibleNext = Atkinson_Hyperlegible_Next({
    subsets: ["latin", "latin-ext"],
    variable: "--font-atkinson",
    display: "swap",
    // next has no metric overrides for this font yet, the fallback stack lives in the --font-sans token
    adjustFontFallback: false,
});

export const metadata: Metadata = {
    title: {
        default: "polar",
        template: "%s | polar",
    },
    description: "Votações, presença e gastos dos deputados federais, de forma clara e direta, com dados públicos oficiais.",
};

export const viewport: Viewport = {
    viewportFit: "cover",
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#F3F2EF" },
        { media: "(prefers-color-scheme: dark)", color: "#100F0E" },
    ],
};

// applies the saved theme before the first paint, without it the page would flash the system theme
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

interface RootLayoutProps {
    children: ReactNode;
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
    return (
        <html lang="pt-BR" className={atkinsonHyperlegibleNext.variable} suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
            </head>
            <body>
                <a className="skip-link" href="#conteudo">
                    Pular para o conteúdo
                </a>
                <SiteHeader />
                {children}
                <MainNav placement="bottom" />
            </body>
        </html>
    );
}