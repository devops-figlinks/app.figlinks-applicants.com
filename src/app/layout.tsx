import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/redux/Provider";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { BaselimeErrorBoundary, BaselimeRum } from "@baselime/react-rum";
import { PINOLOGGER } from "@/lib/helpers/getBaseURL";
import { InterviewProvider } from "@/context/InterviewContext";


const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_API_URL || 'https://figlinks.com'),
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
     
      <body
        className={cn(
          "min-h-screen bg-background antialiased",
          dmSans.variable
        )}
      >
        <BaselimeRum
          apiKey={PINOLOGGER}
          enableWebVitals
          fallback={<div>Error Loggger</div>}
        >
          <BaselimeErrorBoundary
            fallback={<div>Could not display your page here</div>}
          >
            <Providers>
              {/* <Suspense>
                <Navbar />
              </Suspense>
              {children}
            </Providers> */}
              <InterviewProvider>
                <Suspense>
                </Suspense>
                {children}
              </InterviewProvider>
            </Providers>  
          </BaselimeErrorBoundary>
        </BaselimeRum>
        <Toaster richColors closeButton position="top-center" />
      </body>
    </html>
  );
}
