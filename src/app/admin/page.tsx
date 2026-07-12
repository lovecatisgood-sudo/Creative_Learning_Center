import { redirect } from "next/navigation";

// Sessions is the default screen after login (UI/UX A1).
export default function AdminIndex() {
  redirect("/admin/sessions");
}
