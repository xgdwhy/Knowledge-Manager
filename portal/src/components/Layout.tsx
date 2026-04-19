// portal/src/components/Layout.tsx
import React from "react";
import Header from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <Header />
      <main className="main-content">{children}</main>
    </div>
  );
}
