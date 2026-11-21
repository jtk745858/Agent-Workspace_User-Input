export const workflows = [
  { id: "compare", name: "경쟁 서비스 비교", description: "Alpha, Beta, Gamma의 기능과 가격을 비교하고 의사결정 보고서를 작성합니다.", color: "blue", steps: ["업무 입력", "조사 범위 정의", "기능 조사", "가격 조사", "비교 분석", "보고서 작성", "결과 수집"] },
  { id: "discover", name: "문제 탐색과 정의", description: "사용자 관찰을 바탕으로 문제를 탐색하고 해결할 질문을 구체화합니다.", color: "rose", steps: ["업무 입력", "관찰 정리", "문제 탐색", "질문 정의", "결과 수집"] },
  { id: "decide", name: "팀 의사결정", description: "세 가지 대안을 비교하고 팀이 함께 검토할 의사결정 기록을 남깁니다.", color: "green", steps: ["업무 입력", "기준 정의", "대안 조사", "비교 평가", "결정 기록", "결과 수집"] },
] as const;

export const runs = [
  { id: "sample-1", workflow: 0, state: "완료 예시", date: "2026.11.20 14:32", files: 3 },
  { id: "sample-2", workflow: 1, state: "검토 대기 예시", date: "2026.11.20 11:18", files: 1 },
  { id: "sample-3", workflow: 2, state: "완료 예시", date: "2026.11.19 16:05", files: 1 },
] as const;
export const artifacts = [
  { id: "report", name: "report.md", format: "Markdown", run: 0, content: "# 경쟁 서비스 비교\n\nUI 검토용 합성 데이터입니다.\n\n## 핵심 요약\nAlpha는 협업 기능, Beta는 단순한 업무 관리, Gamma는 확장 기능을 예시로 표현합니다.\n\n## 다음 행동\n실제 서비스의 자료와 요금제를 확인합니다." },
  { id: "features", name: "features-out.json", format: "JSON", run: 0, content: '{\n  "source": "UI 검토용 합성 데이터",\n  "items": [\n    { "name": "Alpha", "features": 8 },\n    { "name": "Beta", "features": 6 },\n    { "name": "Gamma", "features": 10 }\n  ]\n}' },
  { id: "comparison", name: "comparison.csv", format: "CSV", run: 0, content: "service,features,monthly_price\nAlpha,8,12\nBeta,6,9\nGamma,10,18" },
  { id: "questions", name: "questions.md", format: "Markdown", run: 1, content: "# 문제 탐색 질문\n\nUI 검토용 예시입니다.\n\n- 첫 업무를 시작할 때 어떤 정보가 필요한가요?\n- 현재 절차에서 가장 어려운 단계는 무엇인가요?" },
  { id: "decision", name: "decision.md", format: "Markdown", run: 2, content: "# 팀 의사결정\n\nUI 검토용 예시입니다.\n\n## 비교 기준\n사용성, 비용, 연동 가능성을 함께 검토합니다." },
] as const;

export type WorkspaceRoute =
  | { page: "home" | "workflows" | "runs" | "artifacts" | "settings" }
  | { page: "preview"; workflow: number }
  | { page: "run" | "review"; run: number }
  | { page: "artifact"; artifact: number };

export const pageNames = {
  home: "Home", workflows: "워크플로 목록", preview: "워크플로 미리보기",
  runs: "실행 이력", run: "실행 상세", artifacts: "결과물",
  artifact: "결과물 상세", review: "사용자 검토", settings: "설정",
};
