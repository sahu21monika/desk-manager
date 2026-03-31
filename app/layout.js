import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Desk Manager – Study Space",
  description: "Manage desk assignments for your study space",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
          {children}
        </main>
      </body>
    </html>
  );
}
