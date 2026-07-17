import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

// Wraps both /admin/login and the authenticated /admin/(app) subtree. Fluid
// across phone → tablet (both orientations) — unlike the public signup flow's
// 480px column (src/app/signup/layout.tsx). Auth still happens in
// (app)/layout.tsx + route handlers.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-frame">{children}</div>;
}
