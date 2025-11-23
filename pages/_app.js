import "@/styles/globals.css";
import "styles/stats.css";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <SessionProvider session={session}>
      <>
        <Component {...pageProps} />
        {/* ✅ 全域 toaster */}
        <Toaster position="top-right" />
      </>
    </SessionProvider>
  );
}
