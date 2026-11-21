import { useState } from "react";
import AppLayout from "../layouts/AppLayout";
import MainPage from "../pages/MainPage";
import WorkspacePages from "../pages/WorkspacePages";
import type { WorkspaceRoute } from "../pages/workspaceDemo";
import { useTheme } from "../theme/useTheme";

export default function App() {
  const [route, navigate] = useState<WorkspaceRoute>({ page: "home" });
  const theme = useTheme();
  return (
    <AppLayout route={route} navigate={navigate} {...theme}>
      <MainPage hidden={route.page !== "home"} />
      {route.page !== "home" && <WorkspacePages route={route} navigate={navigate} {...theme} />}
    </AppLayout>
  );
}
