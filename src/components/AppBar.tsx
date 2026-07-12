import { Logo } from "./Logo";
import { LangToggle } from "./LangToggle";

// Brown app bar carried on every primary admin screen: logo + title + TH/EN pill.
export function AppBar({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 bg-brown px-4 py-3 text-cream">
      <Logo size={32} />
      <h1 className="flex-1 truncate text-xl font-bold text-cream">{title}</h1>
      {right}
      <LangToggle dark />
    </header>
  );
}
