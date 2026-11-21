import { useRef, useState } from "react";
import { workflows } from "./workspaceDemo";

export default function WorkflowPreview({ workflow }: { workflow: number }) {
  const flow = workflows[workflow];
  const [mode, setMode] = useState<"canvas" | "steps">("canvas");
  const [selected, select] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const canvas = useRef<HTMLDivElement>(null);
  const positions = flow.steps.length === 7
    ? [[20, 155], [220, 155], [420, 65], [420, 265], [620, 155], [420, 395], [220, 395]]
    : flow.steps.map((_, i) => [25 + (i % 3) * 255, 60 + Math.floor(i / 3) * 205]);
  const edges = flow.steps.length === 7 ? [[0, 1], [1, 2], [1, 3], [2, 4], [3, 4], [4, 5], [5, 6]]
    : flow.steps.slice(1).map((_, i) => [i, i + 1]);
  return (
    <>
      <div className="pagehead"><div><h1>{flow.name}</h1><p>Workflow Preview · 단계와 연결 구조를 살펴보세요.</p></div>
        <button disabled title="Workflow 실행 기능은 준비 중입니다.">실행 · 준비 중</button></div>
      <p className="demo-notice">데모 데이터 · 노드 탐색과 화면 전환을 체험할 수 있습니다. 모델 호출과 Workflow 실행은 준비 중입니다.</p>
      <div className="toolbar">
        <div className="tabs" aria-label="미리보기 표시 방식">{(["canvas", "steps"] as const).map(value =>
          <button key={value} aria-pressed={mode === value} onClick={() => setMode(value)}>{value === "canvas" ? "Canvas" : "Steps"}</button>)}</div>
        <div className="row"><button aria-label="축소" onClick={() => setZoom(Math.max(.25, zoom - .1))}>−</button>
          <small>{Math.round(zoom * 100)}%</small>
          <button aria-label="확대" onClick={() => setZoom(Math.min(1.8, zoom + .1))}>+</button>
          <button onClick={() => setZoom(Math.min(1, Math.max(.25, ((canvas.current?.clientWidth ?? 860) - 40) / 820)))}>화면 맞춤</button></div>
      </div>
      <div className="canvas-wrap">
        <div className="canvas" ref={canvas}>
          {mode === "canvas" ? <div className="graph-area" style={{ width: 820 * zoom, height: 540 * zoom }}>
            <div className="graph" style={{ transform: `scale(${zoom})` }}>
              <svg className="edges" viewBox="0 0 820 540" aria-hidden="true">{edges.map(([a, b]) => {
                const [x, y] = positions[a], [nextX, nextY] = positions[b];
                return <path key={`${a}-${b}`} d={`M${x + 85},${y + 53} C${x + 185},${y + 53} ${nextX - 15},${nextY + 53} ${nextX + 85},${nextY + 53}`} />;
              })}</svg>
              {flow.steps.map((name, index) => <button key={name} className={`node ${index === 0 ? "input" : index === flow.steps.length - 1 ? "output" : ""}`}
                aria-label={`${index === 0 ? "INPUT" : index === flow.steps.length - 1 ? "OUTPUT" : `STEP ${index}`} ${name}`}
                aria-pressed={selected === index} style={{ left: positions[index][0], top: positions[index][1] }} onClick={() => select(index)}>
                <span>{index === 0 ? "INPUT" : index === flow.steps.length - 1 ? "OUTPUT" : `STEP ${index}`}</span>
                <strong>{name}</strong><small>예시 단계</small>
              </button>)}
            </div>
          </div> : <div className="steps-list">{flow.steps.map((name, index) =>
            <button key={name} aria-label={`${index + 1} ${name}`} aria-pressed={selected === index} onClick={() => select(index)}><span className="step-number">{index + 1}</span>{name}</button>)}</div>}
        </div>
        {selected !== null && <aside className="inspector" aria-label="노드 상세">
          <div className="row between"><span className="eyebrow">STEP DETAILS</span><button aria-label="노드 상세 닫기" onClick={() => select(null)}>×</button></div><h2>{flow.steps[selected]}</h2>
          <p>선택한 예시 단계의 입력과 출력을 확인합니다.</p>
          <h3>입력</h3><p>{selected === 0 ? "업무 목적과 참고 자료" : "이전 단계의 구조화된 결과"}</p>
          <h3>실행 모델</h3><span className="badge">미연결 · 데모</span>
          <h3>출력</h3><p>{selected === flow.steps.length - 1 ? "예시 결과물 모음" : "구조화된 데이터와 요약"}</p>
        </aside>}
      </div>
      <section className="editbox"><label htmlFor="workflow-edit">흐름을 어떻게 바꿀까요?</label>
        <div className="row"><input id="workflow-edit" disabled placeholder="자연어 Workflow 수정은 준비 중입니다." /><button disabled>변경 미리보기</button></div></section>
    </>
  );
}
