// Wraps both /admin/login and the authenticated /admin/(app) subtree. Fluid
// across phone → tablet (both orientations) — unlike the public signup flow's
// 480px column (src/app/signup/layout.tsx). Auth still happens in
// (app)/layout.tsx + route handlers.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-frame">{children}</div>;
}
