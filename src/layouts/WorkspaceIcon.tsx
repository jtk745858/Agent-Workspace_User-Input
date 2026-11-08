const paths = {
  workspace: "M3 8 12 3l9 5-9 5-9-5ZM3 12l9 5 9-5M3 16l9 5 9-5",
  home: "m3 10 9-7 9 7v10h-6v-7H9v7H3Z",
  agents: "M5 8h14v11H5zM12 4v4M8 12h1m6 0h1M9 16h6M2 11v5m20-5v5",
  workflows: "M3 3h6v6H3zM15 15h6v6h-6zM6 9v6a3 3 0 0 0 3 3h6M9 6h6a3 3 0 0 1 3 3v6",
  moon: "M20 14a9 9 0 0 1-10-11 9 9 0 1 0 10 11Z",
  sun: "M16 12a4 4 0 1 1-8 0 4 4 0 1 1 8 0ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2",
};

export function WorkspaceIcon({ name }: { name: keyof typeof paths }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
