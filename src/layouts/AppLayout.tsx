import { useState, type ReactNode } from "react";
import { WorkspaceIcon } from "./WorkspaceIcon";
import { pageNames, workflows, type WorkspaceRoute } from "../pages/workspaceDemo";

type Props = {
  children: ReactNode;
  route: WorkspaceRoute;
  navigate: (route: WorkspaceRoute) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
};
const destinations = [
  { page: "home", label: "홈", icon: "home" },
  { page: "workflows", label: "Workflows", icon: "workflows" },
  { page: "runs", label: "실행 이력", icon: "clock" },
  { page: "artifacts", label: "결과물", icon: "file" },
  { page: "settings", label: "설정", icon: "settings" },
] as const;

export default function AppLayout({ children, route, navigate, theme, toggleTheme }: Props) {
  const [collapsed, setCollapsed] = useState(() => window.matchMedia?.("(max-width: 750px)").matches ?? false);
  const current = route.page === "preview" ? "workflows" : route.page === "run" || route.page === "review" ? "runs"
    : route.page === "artifact" ? "artifacts" : route.page;
  function go(next: WorkspaceRoute) {
    navigate(next);
    if (window.matchMedia?.("(max-width: 750px)").matches) setCollapsed(true);
  }
  return (
    <div className={`workspace-shell ${collapsed ? "collapsed" : ""}`}>
      <nav className="rail" aria-label="주 탐색">
        <span className="brand-mark"><WorkspaceIcon name="workspace" /></span>
        {destinations.map(item => <button key={item.page} title={item.label} aria-label={item.label}
          aria-current={current === item.page ? "page" : undefined}
          onClick={() => go({ page: item.page })}><WorkspaceIcon name={item.icon} /></button>)}
        <button className="rail-bottom" aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
          aria-expanded={!collapsed} aria-controls="workspace-sidebar" onClick={() => setCollapsed(!collapsed)}>
          <WorkspaceIcon name="panel" />
        </button>
      </nav>
      <aside id="workspace-sidebar" className="sidebar" aria-label="Workspace 사이드바" hidden={collapsed}>
        <strong className="brand">Agent<br />Workspace<span>업무의 시작부터 결과까지</span></strong>
        <nav aria-label="Workspace 탐색">
          <button aria-current={route.page === "home" ? "page" : undefined} onClick={() => go({ page: "home" })}>
            <WorkspaceIcon name="home" />Home · 업무 입력</button>
          <h2 className="nav-label">My Workflows <small>데모</small></h2>
          {workflows.map((flow, index) => <button key={flow.id} onClick={() => go({ page: "preview", workflow: index })}
            aria-current={route.page === "preview" && route.workflow === index ? "page" : undefined}>
            <WorkspaceIcon name="workflows" />{flow.name}</button>)}
          <button aria-current={route.page === "workflows" ? "page" : undefined} onClick={() => go({ page: "workflows" })}>전체 Workflow 보기</button>
          <div className="nav-divider" />
          <button aria-current={route.page === "runs" || route.page === "run" ? "page" : undefined} onClick={() => go({ page: "runs" })}><WorkspaceIcon name="clock" />실행 이력</button>
          <button aria-current={current === "artifacts" ? "page" : undefined} onClick={() => go({ page: "artifacts" })}><WorkspaceIcon name="file" />결과물</button>
          <button aria-current={route.page === "review" ? "page" : undefined} onClick={() => go({ page: "review", run: 1 })}><WorkspaceIcon name="check" />사용자 검토</button>
          <button aria-current={route.page === "settings" ? "page" : undefined} onClick={() => go({ page: "settings" })}><WorkspaceIcon name="settings" />설정</button>
        </nav>
        <button className="new-work" onClick={() => go({ page: "home" })}><WorkspaceIcon name="plus" />새 업무 시작</button>
      </aside>
      {!collapsed && <button className="sidebar-backdrop" aria-label="사이드바 닫기" onClick={() => setCollapsed(true)} />}
      <div className="workspace">
        <header className="app-header">
          <div className="breadcrumb"><span>개인 워크스페이스</span><span aria-hidden="true">/</span><strong>{pageNames[route.page]}</strong></div>
          <div className="row"><span className="workspace-state">User Input PoC</span>
            <button className="theme-toggle" onClick={toggleTheme}
              aria-label={theme === "light" ? "현재 라이트 모드 · 다크 모드로 전환" : "현재 다크 모드 · 라이트 모드로 전환"}>
              <WorkspaceIcon name={theme === "light" ? "moon" : "sun"} />
            </button>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
