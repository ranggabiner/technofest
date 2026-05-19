import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { getDictionary, getLocale } from "@/lib/i18n/server";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const appCssReadinessCriticalCss = `
#app-shell{display:contents}
html:not([data-app-css-ready="true"]) #app-shell{visibility:hidden}
html:not([data-app-css-ready="true"]) body{
  margin:0;
  min-height:100vh;
  background:#fbfaf9;
  color:#1d1d1f;
  font-family:Inter,Arial,Helvetica,sans-serif;
}
html:not([data-app-css-ready="true"]) body::before{
  content:"Menyiapkan halaman";
  position:fixed;
  inset:0;
  z-index:2147483647;
  display:grid;
  place-items:center;
  padding:24px;
  background:radial-gradient(circle at 50% 0%,rgba(45,212,191,.14),transparent 34%),#fbfaf9;
  color:#1d1d1f;
  font:600 20px/1.35 Inter,Arial,Helvetica,sans-serif;
  text-align:center;
}
html:not([data-app-css-ready="true"]) body::after{
  content:"";
  position:fixed;
  left:50%;
  top:calc(50% + 48px);
  z-index:2147483647;
  width:28px;
  height:28px;
  margin-left:-14px;
  border:3px solid rgba(18,18,18,.14);
  border-top-color:#164e63;
  border-radius:999px;
  animation:app-css-guard-spin .8s linear infinite;
}
@keyframes app-css-guard-spin{to{transform:rotate(360deg)}}
@media (prefers-color-scheme:dark){
  html:not([data-app-css-ready="true"]) body{
    background:#121212;
    color:#f6f1eb;
  }
  html:not([data-app-css-ready="true"]) body::before{
    background:radial-gradient(circle at 50% 0%,rgba(45,212,191,.18),transparent 34%),#121212;
    color:#f6f1eb;
  }
  html:not([data-app-css-ready="true"]) body::after{
    border-color:rgba(246,241,235,.18);
    border-top-color:#5eead4;
  }
}
`;

const appCssReadinessScript = `
(function(){
  var root=document.documentElement;
  function markReady(){root.setAttribute("data-app-css-ready","true");}
  function afterPaint(){
    if("requestAnimationFrame" in window){
      window.requestAnimationFrame(function(){window.requestAnimationFrame(markReady);});
      return;
    }
    window.setTimeout(markReady,0);
  }
  function stylesheetReady(link){
    try{return Boolean(link.sheet);}
    catch(error){return false;}
  }
  var links=Array.prototype.slice.call(document.querySelectorAll('link[rel="stylesheet"][href*="/_next/static/"]'));
  if(links.length===0){afterPaint();return;}
  var pending=links.filter(function(link){return !stylesheetReady(link);});
  if(pending.length===0){afterPaint();return;}
  var settled=pending.map(function(){return false;});
  var complete=false;
  var interval=0;
  function finish(){
    if(complete)return;
    complete=true;
    if(interval)window.clearInterval(interval);
    afterPaint();
  }
  function settle(index){
    if(settled[index])return;
    settled[index]=true;
    if(settled.every(Boolean))finish();
  }
  pending.forEach(function(link,index){
    link.addEventListener("load",function(){settle(index);},{once:true});
    link.addEventListener("error",function(){settle(index);},{once:true});
    if(stylesheetReady(link))settle(index);
  });
  interval=window.setInterval(function(){
    pending.forEach(function(link,index){
      if(stylesheetReady(link))settle(index);
    });
  },50);
  window.setTimeout(finish,2500);
})();
`;

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getDictionary();

  return {
    title: copy.common.brand,
    description: copy.metadata.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--color-warm-canvas)] text-[var(--color-graphite)]">
        <style dangerouslySetInnerHTML={{ __html: appCssReadinessCriticalCss }} />
        <script dangerouslySetInnerHTML={{ __html: appCssReadinessScript }} />
        <noscript>
          <style>{`#app-shell{visibility:visible!important}body::before,body::after{content:none!important}`}</style>
        </noscript>
        <ThemeProvider>
          <div id="app-shell" data-app-shell>
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
