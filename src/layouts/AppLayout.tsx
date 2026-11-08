import type { ReactNode } from "react";
import { useTheme } from "../theme/useTheme";
import { WorkspaceIcon } from "./WorkspaceIcon";

function AppHeader() {
  const { theme, toggleTheme } = useTheme();
  const label = theme === "light" ? "현재 라이트 모드 · 다크 모드로 전환" : "현재 다크 모드 · 라이트 모드로 전환";
  return (
    <header className="app-header">
      <strong className="brand"><span className="brand-mark"><WorkspaceIcon name="workspace" /></span>Agent Workspace</strong>
      <span className="location">Home</span>
      <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={label} title={label}>
        <WorkspaceIcon name={theme === "light" ? "moon" : "sun"} />
      </button>
    </header>
  );
}

function AppSidebar() {
  return (
    <aside className="sidebar" aria-label="Workspace 사이드바">
      <nav aria-label="Workspace 탐색">
        <h2 className="nav-label">Workspace</h2>
        <ul>
          <li><span className="nav-item current" aria-current="page"><WorkspaceIcon name="home" />Home</span></li>
          <li><button className="nav-item" disabled><WorkspaceIcon name="agents" />Agents</button></li>
          <li><button className="nav-item" disabled><WorkspaceIcon name="workflows" />Workflows</button></li>
        </ul>
      </nav>
      <small className="stage">User Input PoC</small>
    </aside>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return <div className="workspace"><AppHeader /><AppSidebar />{children}</div>;
}
