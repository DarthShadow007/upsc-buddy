import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar dark={dark} onToggleDark={() => setDark(d => !d)} />
      <main className="md:ml-60 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8 pt-16 md:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
