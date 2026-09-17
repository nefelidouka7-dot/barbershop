"use client";

import { usePathname } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { NewAppointmentListener } from "@/components/admin/realtime-toast";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="md:flex md:min-h-screen">
      <AdminNav />
      <div className="min-w-0 flex-1 px-5 py-8 md:px-8 lg:px-10">
        <NewAppointmentListener />
        {children}
      </div>
    </div>
  );
}
