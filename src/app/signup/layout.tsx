import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Parent Signup | Siamese Cat Creative Club",
  description: "Register a parent and child for Little Explorer Playgroup or After School Explorer.",
};

// The public registration flow keeps the phone-width column the whole POS uses.
export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <div className="app-frame">{children}</div>;
}
