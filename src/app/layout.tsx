import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BCE Booking System",
  description: "Biggar Corn Exchange - Booking Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
