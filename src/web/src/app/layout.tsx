import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Atkinson_Hyperlegible_Next } from "next/font/google";
import { DebugDataToggle } from "@/components/DebugDataToggle/DebugDataToggle";
import { GlossaryDialog } from "@/components/GlossaryDialog/GlossaryDialog";
import { MainNav } from "@/components/MainNav/MainNav";
import { HeaderProvider } from "@/components/SiteHeader/HeaderProvider";
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

// plays the entry animations ([data-reveal] in globals.scss) once, when each element comes into view. It runs before the
// body, with no react: an adopted style sheet pauses the animations, a mutation observer finds the elements as they arrive
// and leave (also on client navigation) and an intersection observer plays them, up to 20 in a row 30 ms apart (--stagger).
// An element that react moves in the dom restarts its animation, so one that already played jumps to the end. Without
// support, with reduced motion or if anything fails, nothing is paused and the content plays at load
const revealScript = `(function(){try{if(!("IntersectionObserver"in window)||!("adoptedStyleSheets"in document)||!window.CSSStyleSheet||matchMedia("(prefers-reduced-motion: reduce)").matches)return;var done=new WeakSet();var io=new IntersectionObserver(function(entries){var n=0;entries.forEach(function(e){if(!e.isIntersecting)return;io.unobserve(e.target);done.add(e.target);var delay=Math.min(n,20)*30;n++;e.target.getAnimations().forEach(function(a){a.currentTime=-delay;a.play()})})});function watch(el){if(done.has(el)){el.getAnimations().forEach(function(a){a.finish()})}else{io.observe(el)}}function each(node,fn){if(node.nodeType!==1)return;if(node.hasAttribute("data-reveal"))fn(node);node.querySelectorAll("[data-reveal]").forEach(fn)}function forget(el){io.unobserve(el)}new MutationObserver(function(records){records.forEach(function(r){r.addedNodes.forEach(function(n){each(n,watch)});r.removedNodes.forEach(function(n){each(n,forget)})})}).observe(document.documentElement,{childList:true,subtree:true});var sheet=new CSSStyleSheet();sheet.replaceSync("[data-reveal]{animation-play-state:paused}");document.adoptedStyleSheets=document.adoptedStyleSheets.concat(sheet)}catch(e){}})()`;

interface RootLayoutProps {
    children: ReactNode;
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
    return (
        <html lang="pt-BR" className={atkinsonHyperlegibleNext.variable} suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
                <script dangerouslySetInnerHTML={{ __html: revealScript }} />
            </head>
            <body>
                <a className="skip-link" href="#conteudo">
                    Pular para o conteúdo
                </a>
                <HeaderProvider>
                    <SiteHeader />
                    {children}
                    <MainNav placement="bottom" />
                    <GlossaryDialog />
                </HeaderProvider>
                <DebugDataToggle />
            </body>
        </html>
    );
}