// Wraps both /admin/login and the authenticated /admin/(app) subtree in the
// phone-width column. Auth still happens in (app)/layout.tsx + route handlers.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="app-frame">{children}</div>;
}
