import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "react-quill-new/dist/quill.snow.css";
import "react-toastify/dist/ReactToastify.css";
import { UserProvider } from "@/context/usercontext";
import ToastProvider from "@/components/layout/ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Admin Dashboard",
  description: "Admin Panel",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UserProvider>
          {children}
          <ToastProvider />
        </UserProvider>
      </body>
    </html>
  );
}
