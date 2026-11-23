# Markdown 출력 및 콘텐츠 레이아웃 개선 검증

작성일: 2026-11-23 (Asia/Seoul)

## 1. 배경과 확인 범위

현재 작업 브랜치 feat/workspace-ui, 시작 HEAD 08312da.
추적 파일의 기존 미커밋 변경은 없었으며, 무관한 미추적 docs/vscode-mcp.md와 scripts/open-vscode-mcp.cmd를 보존했다.
브랜치를 임의로 바꾸지 않았다. Commit/Push/PR/병합/Reset/Rebase를 수행하지 않았다.

현재 브랜치의 src에는 팀원이 구현한 실제 Workflow 출력 기능이 없다.
WorkflowPreview는 정적 노드 탐색이며 실제 Workflow 결과를 수신하거나 생성하지 않는다.
확인 가능한 출력은 workspaceDemo.ts의 artifacts 배열이며 content:string, format은 Markdown/JSON/CSV 문자열이다.
WorkspaceRoute의 artifact 인덱스로 WorkspacePages.tsx의 ArtifactDetail이 데이터를 선택한다.
기존 ArtifactDetail은 format과 관계없이 pre에 file.content를 일반 텍스트로 출력했다. Markdown 라이브러리는 설치되어 있지 않았다.
실제 팀원 기능에서 발생했다는 오류 화면의 DOM은 이 브랜치에서 재현할 수 없으므로 그 원인을 확정하지 않는다.

## 2. 확인된 원인과 변경

- Markdown 미렌더링: ArtifactDetail의 일반 텍스트 pre 출력.
- 기존 .document pre 스타일은 pre-wrap으로 코드 공백/줄바꿈과 내부 가로 스크롤 정책을 구분하지 않았다.
- 기존 전역 table/th/td의 최소 너비와 nowrap을 Markdown에 그대로 적용하면 표가 본문 폭을 늘릴 수 있다.
- .content-page에 명시적 min-width가 없었다. .document 및 새 Renderer/스크롤 래퍼에 너비 경계를 적용했다.
- 기존 workspace의 min-width:0, 카드의 minmax(0,1fr) 및 Sidebar 구조는 유지했다.

Markdown 문법 변환은 파서로 수행하며 정규표현식 HTML 변환이나 dangerouslySetInnerHTML을 사용하지 않는다.

## 3. 컴포넌트 및 의존성

신규:
- src/components/markdown/MarkdownContent.tsx: content:string, className?:string 인터페이스
- src/components/markdown/markdown.css: 컴포넌트 범위의 문서 스타일
- tests/markdown.test.tsx: 10개 테스트
- tests/fixtures/workflowMarkdown.ts: 요청에 제공된 시연 계획 품질 검증 Fixture

수정:
- src/pages/WorkspacePages.tsx: format === "Markdown"일 때만 Renderer, JSON/CSV는 원문 pre 유지
- src/styles/global.css: 콘텐츠/문서 너비 경계, 문서 직계 제목과 원문 pre로 선택자 범위 축소
- package.json 및 pnpm-lock.yaml: react-markdown 10.1.0, remark-gfm 4.0.1 추가

공식 문서와 레지스트리의 peerDependencies를 확인했다. react-markdown은 React 및 @types/react >=18을 요구하여 현재 React 19와 호환된다. 프로젝트 Node 22 및 TypeScript 5.9 환경에서 실제 검사·빌드가 통과했다.
프로젝트 의존성으로만 pnpm add --save-exact ... --ignore-scripts로 설치했으며 전역 설치나 시스템 설정 변경은 없다.

참고:
- https://github.com/remarkjs/react-markdown
- https://github.com/remarkjs/remark-gfm

## 4. 지원 문법과 보안 정책

H1~H6, 본문, 굵게/기울임, 순서/일반/중첩 목록, 인용문, 링크, 인라인 코드, 코드 블록, 구분선, GFM 표·체크리스트·취소선을 지원한다.
코드 하이라이팅은 추가하지 않았다.

- skipHtml로 원문 HTML을 렌더링하지 않으며 rehype-raw를 사용하지 않는다.
- URL 파싱 후 절대 http/https 링크만 허용한다. javascript/data/file 및 상대 경로 링크는 클릭 불가능한 텍스트로 표시한다.
- 링크에 target=_blank, rel=noopener noreferrer, referrerPolicy=no-referrer를 설정한다.
- 이미지 문법은 대체 안내와 alt를 텍스트로 표시한다. 외부 이미지 요청을 자동 발생시키지 않는다.
- Markdown 문자열을 저장 상태에서 수정하지 않는다. Markdown 문법에 따른 화면 변환만 수행한다.
- 사용자 제출 원문과 Core 상태/오류는 기존 일반 텍스트 UI를 유지한다.

상대 문서 링크/앵커 이동, 외부 이미지 표시가 향후 필요하면 별도 URL 및 파일 접근 정책이 필요하다.
외부 링크의 실제 운영체제 브라우저 열기 동작은 이번 검증에서 클릭하지 않았다.

## 5. CSS와 읽기 가능성

일반 본문과 긴 URL/단어는 overflow-wrap:anywhere로 줄바꿈한다.
코드는 white-space:pre로 줄바꿈·들여쓰기를 보존하고 pre 내부에서 가로 스크롤한다.
표는 의미 있는 table 구조를 유지하고 .markdown-table-scroll에서만 가로 스크롤한다.
코드와 표의 스크롤 영역에 키보드 초점을 줄 수 있다.
Markdown 내부 제목·목록·표·인용문·코드 스타일만 범위를 지정해 기존 UI에 영향이 번지지 않도록 했다.
기존 Light/Dark 색상 변수를 재사용했다.

## 6. 기존 기능 영향

I/D/T/R/O Hook, DTO, API v0.2, receive_user_input, Rust Core는 변경하지 않았다.
채팅 원문 렌더링 및 요청별 기록도 변경하지 않았다.
자동화 회귀 테스트와 실제 Core 수신으로 원문 보존 및 화면 왕복 후 기록 유지를 확인했다.
이 변경은 Workflow 엔진 또는 Agent 기능을 추가하지 않는다.

실제 Workflow 출력 연동 위치: 향후 팀원의 결과 컴포넌트에서 Markdown 타입으로 확인된 문자열만
<MarkdownContent content={markdownResult} />에 전달한다.
현재 연동 완료 위치는 ArtifactDetail이며, 실제 Workflow 실행 결과 통합은 미검증/미연결이다.

## 7. 자동화 검사 결과

scripts/dev-env.cmd를 통해 실행했다.

| 검사 | 결과 |
| --- | --- |
| pnpm test | PASS: 12파일, 289개 (기존 279 + 신규 10), 실패 0 |
| pnpm exec tsc --noEmit -p tsconfig.test.json | PASS |
| pnpm build | PASS |
| git diff --check | PASS (LF/CRLF 안내만 있음) |
| Rust 전용 테스트 | 이번 작업 미실행, Rust 수정 없음 |
| Tauri 개발 앱 빌드/실행 | PASS |

| ID | 검증 결과 |
| --- | --- |
| MD-T01 | PASS: H1~H6·강조·인라인 코드·취소선·구분선 |
| MD-T02 | PASS: 중첩/번호 목록·체크리스트·인용문 |
| MD-T03 | PASS: Fixture의 실제 table/header/cell 및 초점 래퍼 |
| MD-T04 | PASS: 코드 공백·줄바꿈·들여쓰기 보존 |
| MD-T05 | PASS: 전체 문자열 보존 + 실제 WebView 너비/스크롤 측정 |
| MD-T06 | PASS: 원문 HTML, 위험 URL, 이미지 자동 로딩 차단; 안전 링크 속성 |
| MD-T07 | PASS: 사용자 Markdown 문자 원문 및 페이지 왕복 보존 |
| MD-T08 | 대체 검증 PASS: 존재하는 Markdown Artifact 연결·JSON 일반 텍스트 유지. 실제 Workflow 결과 연동은 코드 부재로 미검증 |
| MD-T09 | PASS: 빈 문자열 안정적 렌더링 |
| MD-T10 | PASS: 반복 렌더링·기존 페이지 왕복, 실제 WebView 반복 출력 너비 확인 |

MD-T08 테스트 이름의 Artifact 검증은 실제 Workflow 실행 성공을 의미하지 않는다.
Fixture도 출력 품질 검증 데이터이며 실제 생성 결과가 아니다.

## 8. 실제 Windows Tauri 검증

에이전트가 실제 Windows Tauri 앱을 실행하고 로컬 WebView의 DOM·레이아웃을 측정하고 캡처를 육안 확인했다.
사용자가 직접 수행한 수동 검증으로 기록하지 않는다.
기존 ignored .cache/workspace-a-qa.json의 로컬 QA 설정을 사용했다. 제품 Tauri 설정은 수정하지 않았다.

품질 Fixture는 QA 중 WebView 메모리의 별도 React root로 실제 MarkdownContent를 렌더링해 기존 document 컨테이너에 넣었다. 제품 데모 데이터는 바꾸지 않았다. 검증 후 QA root를 제거했다.

| 항목 | 결과 |
| --- | --- |
| 실제 report.md 화면의 제목·본문 | PASS |
| Fixture 제목·강조·목록·인용·3열 표 | PASS |
| 연속 2,000자 본문 | PASS, 줄바꿈하여 읽기 가능 |
| 긴 코드 및 12열 표 | PASS, 내부 스크롤 가능 |
| 1440×960 | 문서 너비 1440, 본문 clientWidth=scrollWidth=1135 |
| 1024×768 | 문서 너비 1024, 본문 clientWidth=scrollWidth=740 |
| 640×800 | 문서 너비 640, 본문 clientWidth=scrollWidth=572 |
| 각 너비 코드/표 내부 스크롤 | code scrollLeft=200, table scrollLeft=100 확인 |
| Sidebar 접기/펼치기 | PASS, 외부 가로 넘침 없음 |
| 반복 출력 후 레이아웃 | PASS, 문자열 교체/복원 후 외부 가로 넘침 없음 |
| 실제 Core 수신 | PASS, 공백·줄바꿈 포함 ### 제목 및 **안녕하세요 Hello 123** 원문 수신 |
| 화면 이동 후 채팅 기록 | PASS |
| 실제 Workflow 생성 결과 | 미검증: 현 브랜치에 기능 없음 |
| Dark 화면 별도 캡처·스크린리더·다양한 OS 배율 | 미검증 |

캡처: .cache/markdown-artifact-1440.png, markdown-fixture-{1440,1024,640}.png,
markdown-code-{1440,1024,640}.png, markdown-chat-640.png.
스크린샷과 QA 스크립트는 ignored 로컬 자료이며 제품 코드/커밋 대상이 아니다.

## 9. 사용자 재검증 절차

1. scripts/dev-env.cmd pnpm tauri dev 실행.
2. 결과물 → report.md 미리보기에서 제목·본문 서식 확인.
3. questions.md에서 목록 표시, JSON/CSV에서는 원문 출력을 확인.
4. 창을 좁히고 Sidebar 접기/펼치기로 내용 접근을 확인.
5. Home에 ### 및 ** 등이 포함된 입력을 전송하고 원문 말풍선과 Core 수신 상태를 확인.
6. 페이지 왕복 후 대화 기록을 확인.
7. 팀원 Workflow 브랜치가 제공되면 실제 결과 컴포넌트 연결 후 해당 화면에서 표/코드/장문을 다시 검증.

## 10. 후속 범위

실제 Workflow 출력 컴포넌트가 제공되면 공통 Renderer 연결과 회귀 검증이 필요하다.
추가 문법 확장·코드 하이라이팅·이미지 허용·상대 문서 링크는 현재 범위 밖이다.
기존 PoC 보고서는 보존했다. Commit 및 Push는 수행하지 않았다.
