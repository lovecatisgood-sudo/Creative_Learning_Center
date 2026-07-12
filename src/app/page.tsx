import { redirect } from "next/navigation";

// Root sends staff to the admin app; parents reach /signup directly via QR.
export default function Home() {
  redirect("/admin");
}
