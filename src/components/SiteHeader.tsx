import { Link, useNavigate } from "@tanstack/react-router";
import { Home, Map, Search, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Map },
  { to: "/hunt", label: "Hunt", icon: Search },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function SiteHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="font-display text-2xl font-semibold text-primary">
          Keja Yangu<span className="text-secondary">.</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              activeOptions={{ exact: t.to === "/" }}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-muted data-[status=active]:text-foreground"
            >
              {t.label}
            </Link>
          ))}
        </nav>
        {user ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth", replace: true });
            }}
          >
            <LogOut className="size-4" /> Sign out
          </Button>
        ) : (
          <Button asChild size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
        )}
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-card md:hidden">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            activeOptions={{ exact: t.to === "/" }}
            className="flex flex-col items-center gap-1 py-2 text-xs text-muted-foreground data-[status=active]:text-primary"
          >
            <t.icon className="size-5" />
            {t.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
