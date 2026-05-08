import { useEffect, useState } from "react";
import App from "@/App";
import { DashboardShell, type DashboardRoute } from "@/components/layout/DashboardShell";
import { AiChatPage } from "@/pages/AiChatPage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { WipgoPage } from "@/pages/WipgoPage";

const DEFAULT_HASH = "#/";

function resolveRoute(hash: string): DashboardRoute {
  switch (hash) {
    case "#/projects":
      return "projects";
    case "#/wipgo":
      return "wipgo";
    case "#/ai-chat":
      return "ai-chat";
    default:
      return "home";
  }
}

export function AppRouter() {
  const [route, setRoute] = useState<DashboardRoute>(() =>
    typeof window === "undefined" ? "home" : resolveRoute(window.location.hash || DEFAULT_HASH)
  );

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, "", DEFAULT_HASH);
    }

    const handleHashChange = () => {
      setRoute(resolveRoute(window.location.hash));
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return (
    <DashboardShell activeRoute={route}>
      {route === "home" && <App />}
      {route === "projects" && <ProjectsPage />}
      {route === "wipgo" && <WipgoPage />}
      {route === "ai-chat" && <AiChatPage />}
    </DashboardShell>
  );
}
