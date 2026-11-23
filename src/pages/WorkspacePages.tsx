import MarkdownContent from "../components/markdown/MarkdownContent";
import { useState } from "react";
import { WorkspaceIcon } from "../layouts/WorkspaceIcon";
import { artifacts, runs, workflows, type WorkspaceRoute } from "./workspaceDemo";
import WorkflowPreview from "./WorkflowPreview";

type Props = {
  route: WorkspaceRoute;
  navigate: (route: WorkspaceRoute) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
};
function DemoNotice() {
  return <p className="demo-notice">데모 데이터 · UI 검토용 예시입니다. 실제 Workflow 실행과 결과물 생성 기능은 준비 중입니다.</p>;
}
function PageHeading({ title, description }: { title: string; description: string }) {
  return <div className="pagehead"><div><h1>{title}</h1><p>{description}</p></div></div>;
}
function WorkflowList({ navigate }: Pick<Props, "navigate">) {
  const [tab, setTab] = useState("mine");
  const [query, setQuery] = useState("");
  const visible = workflows.filter(flow => (tab === "mine" || flow.id !== "compare") && flow.name.includes(query.trim()));
  return <>
    <PageHeading title="Workflows" description="업무 목적에 맞는 흐름을 탐색하고 단계 구성을 살펴보세요." /><DemoNotice />
    <div className="toolbar"><div className="tabs" aria-label="워크플로 분류">
      <button aria-pressed={tab === "mine"} onClick={() => setTab("mine")}>My Workflows</button>
      <button aria-pressed={tab === "guidance"} onClick={() => setTab("guidance")}>Guidance demos</button>
    </div><input aria-label="워크플로 검색" placeholder="Workflow 검색" value={query} onChange={event => setQuery(event.target.value)} /></div>
    <div className="cards">{visible.map(flow => <article className="card" key={flow.id}>
      <span className={`tile-icon ${flow.color}`}><WorkspaceIcon name="workflows" /></span>
      <h2>{flow.name}</h2><p>{flow.description}</p><small>{flow.steps.length}단계 · 데모 데이터</small>
      <div className="row"><button className="primary" onClick={() => navigate({ page: "preview", workflow: workflows.indexOf(flow) })}>흐름 살펴보기</button>
        <button disabled title="Workflow 실행 기능은 준비 중입니다.">실행 · 준비 중</button></div>
    </article>)}</div>{!visible.length && <p className="empty">검색어에 맞는 예시가 없습니다.</p>}
  </>;
}
function RunList({ navigate }: Pick<Props, "navigate">) {
  return <>
    <PageHeading title="실행 이력" description="업무 진행 상태와 결과를 모아 보는 화면입니다." /><DemoNotice />
    <div className="metrics">{[["전체 예시", 3], ["완료 예시", 2], ["확인 필요 예시", 1]].map(([label, value]) =>
      <div className="metric" key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
    <div className="panel tablewrap"><table><thead><tr><th>Workflow / 업무 요청</th><th>예시 상태</th><th>예시 생성 시각</th><th>결과물</th><th>상세</th></tr></thead>
      <tbody>{runs.map((run, index) => <tr key={run.id}>
        <td><strong>{workflows[run.workflow].name}</strong><small>{workflows[run.workflow].description}</small></td>
        <td><span className={`badge ${index === 1 ? "attention" : ""}`}>{run.state}</span></td><td>{run.date}</td><td>{run.files}개</td>
        <td><button aria-label={`${workflows[run.workflow].name} 실행 상세`} onClick={() => navigate({ page: "run", run: index })}>열기</button></td>
      </tr>)}</tbody></table></div>
  </>;
}
function RunDetail({ index, navigate }: { index: number } & Pick<Props, "navigate">) {
  const run = runs[index], flow = workflows[run.workflow];
  const [step, select] = useState(0);
  return <>
    <PageHeading title={flow.name} description={`${run.id} · ${run.date} · ${run.state}`} /><DemoNotice />
    <div className="split">
      <section className="panel"><h2>실행 단계</h2><div className="timeline">{flow.steps.map((name, i) =>
        <button key={name} aria-pressed={step === i} onClick={() => select(i)}><span className="step-number">{i + 1}</span>{name}</button>)}</div></section>
      <div className="stack"><section className="panel"><h2>{flow.steps[step]}</h2><p>{flow.description}</p>
        <div className="setting"><span>모델 / 도구</span><span className="badge">미연결 · 데모</span></div>
        <div className="setting"><span>단계 상태</span><span>{run.state}</span></div>
        <p className="muted">단계별 정보를 확인하는 UI 예시입니다.</p>
        {index === 1 ? <button onClick={() => navigate({ page: "review", run: index })}>입력 확인 및 검토</button> : <button disabled>재실행 · 준비 중</button>}
      </section><section className="panel"><h2>예시 결과물</h2>{artifacts.map((file, i) => file.run === index && <div className="setting" key={file.id}>
        <div><strong>{file.name}</strong><p>{file.format}</p></div><button onClick={() => navigate({ page: "artifact", artifact: i })}>열기</button>
      </div>)}</section></div>
    </div>
  </>;
}
function ArtifactList({ navigate }: Pick<Props, "navigate">) {
  return <>
    <PageHeading title="Artifacts" description="업무별 결과물의 내용과 형식을 확인하세요." /><DemoNotice />
    <div className="cards">{artifacts.map((file, index) => <article className="card" key={file.id}>
      <span className="tile-icon blue"><WorkspaceIcon name="file" /></span><h2>{file.name}</h2>
      <p>{workflows[runs[file.run].workflow].name}</p><small>{file.format} · 합성 데이터</small>
      <div className="row"><button onClick={() => navigate({ page: "artifact", artifact: index })}>미리보기</button></div>
    </article>)}</div>
  </>;
}
function ArtifactDetail({ index, navigate }: { index: number } & Pick<Props, "navigate">) {
  const file = artifacts[index];
  return <>
    <div className="pagehead"><div><h1>{file.name}</h1><p>{workflows[runs[file.run].workflow].name} · {file.format}</p></div>
      <button onClick={() => navigate({ page: "run", run: file.run })}>실행 상세</button></div><DemoNotice />
    <article className="document"><span className="eyebrow">WORKSPACE REPORT</span><h2>예시 결과물</h2>
      <p>UI 검토용 합성 데이터 · {file.format} 미리보기</p>{file.format === "Markdown" ? <MarkdownContent content={file.content} /> : <pre className="artifact-raw" tabIndex={0} aria-label="결과물 원문">{file.content}</pre>}</article>
  </>;
}
function Review({ index, navigate }: { index: number } & Pick<Props, "navigate">) {
  const [target, setTarget] = useState("Alpha, Beta, Gamma");
  const [market, setMarket] = useState("글로벌 시장");
  return <>
    <PageHeading title="조사 범위를 확인해 주세요" description="사용자 검토 화면의 입력 구성을 살펴보세요." /><DemoNotice />
    <div className="split"><section className="panel stack"><h2>검토 대상 예시</h2>
      <strong>{workflows[runs[index].workflow].name}</strong><p>{workflows[runs[index].workflow].description}</p><span className="badge attention">사용자 확인 필요 · 데모</span></section>
      <section className="panel stack"><label htmlFor="review-target">비교 대상</label><input id="review-target" value={target} onChange={e => setTarget(e.target.value)} />
        <label htmlFor="review-market">조사 시장</label><select id="review-market" value={market} onChange={e => setMarket(e.target.value)}>
          {["글로벌 시장", "국내 시장", "북미 시장"].map(value => <option key={value}>{value}</option>)}</select>
        <p className="notice">입력 편집을 체험할 수 있습니다. 승인과 Workflow 재개는 준비 중이며 화면을 나가면 예시로 복원됩니다.</p>
        <div className="row between"><button onClick={() => navigate({ page: "run", run: index })}>실행 상세로 돌아가기</button><button disabled>승인 · 준비 중</button></div>
      </section></div>
  </>;
}
function Settings({ theme, toggleTheme }: Pick<Props, "theme" | "toggleTheme">) {
  return <>
    <PageHeading title="설정" description="Workspace의 화면 환경을 확인하고 테마를 선택하세요." />
    <section className="settings panel"><h2>워크스페이스</h2>
      <div className="setting"><div><label htmlFor="workspace-name">이름</label><p>개인 작업 공간 표시 예시</p></div><input id="workspace-name" value="개인 워크스페이스" disabled /></div>
      <div className="setting"><div><strong>화면 테마</strong><p>현재 {theme === "light" ? "Light" : "Dark"} · 이 기기에 저장</p></div><button onClick={toggleTheme}>{theme === "light" ? "Dark로 전환" : "Light로 전환"}</button></div>
      <div className="setting"><div><strong>완료 알림</strong><p>Workflow 연동 준비 중</p></div><input type="checkbox" disabled aria-label="완료 알림" /></div>
      <div className="setting"><div><strong>중요 단계에서 확인</strong><p>Workflow 승인 연동 준비 중</p></div><input type="checkbox" disabled aria-label="중요 단계에서 확인" /></div>
      <div className="setting"><strong>기본 실행 모델</strong><span className="badge">미연결</span></div>
      <p className="notice">화면 테마는 즉시 적용됩니다. 나머지 항목은 설정 화면 예시입니다.</p><button disabled>설정 저장 · 준비 중</button>
    </section>
  </>;
}
export default function WorkspacePages({ route, navigate, theme, toggleTheme }: Props) {
  let content;
  switch (route.page) {
    case "workflows": content = <WorkflowList navigate={navigate} />; break;
    case "preview": content = <WorkflowPreview key={route.workflow} workflow={route.workflow} />; break;
    case "runs": content = <RunList navigate={navigate} />; break;
    case "run": content = <RunDetail key={route.run} index={route.run} navigate={navigate} />; break;
    case "artifacts": content = <ArtifactList navigate={navigate} />; break;
    case "artifact": content = <ArtifactDetail index={route.artifact} navigate={navigate} />; break;
    case "review": content = <Review key={route.run} index={route.run} navigate={navigate} />; break;
    case "settings": content = <Settings theme={theme} toggleTheme={toggleTheme} />; break;
    case "home": return null;
  }
  return <main className="content-page" key={route.page}>{content}</main>;
}
