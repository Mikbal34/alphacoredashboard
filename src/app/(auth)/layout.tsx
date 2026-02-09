import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giriş - Alphacore Dashboard",
  description: "Alphacore Dashboard giriş sayfası",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
