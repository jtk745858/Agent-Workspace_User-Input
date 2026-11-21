# Workspace UI 리디자인 및 검증 결과

작성일: 2026-11-21 (Asia/Seoul)

## 1. 목적과 작업 기준

A 시안의 화면 구조를 기존 React/Tauri 앱에 통합하면서 실제 I/D/T/R/O 및 요청별 대화 기록을 유지한다.
기준 파일은 `C:/Users/user/JTK7458/Desktop/Agent-Workspace-A.html`이다. 실제 HTML/CSS와 화면별 구현을 분석하고 Home 및 Preview 렌더링을 비교했다.

작업 시작 상태: `main`, HEAD `ebd93db` (채팅 UI 병합). 기존 무관한 미추적 파일 `docs/vscode-mcp.md`, `scripts/open-vscode-mcp.cmd`는 보존했다.
브랜치 변경, Commit, Push, PR, 병합, Reset, Rebase는 수행하지 않았다. 변경은 현재 main 작업 트리에 미커밋 상태로 남아 있다.

## 2. 디자인과 기존 UI 대비 변경

CSS 변수로 배경 #f0f1ef, 브랜드 #26322e, 포인트 #bbddc9, 사이드바 #faf8f2, 레일 #f2f2eb, 글자 #2d3138, 보조 글자 #68716d, 경계선 #dce1d9를 적용했다.
얇은 경계선, 둥근 카드, 넉넉한 여백, 제목 계층과 공통 버튼 및 포커스 스타일을 통일했다. 기존 Dark 테마도 유지했다.

주요 차이와 이유:
- 중복 OS 테두리와 LOCAL DEMO 표시는 제외했다.
- Home의 가상 Workflow 시작을 실제 Core 전송으로 연결했다. 미연동 실행 옵션 대신 현재 가능한 기능을 안내한다.
- 기존 사용자 말풍선을 민트색, Core 결과를 중립색으로 조정했다.
- 데모 안내와 준비 중 표시 때문에 일부 시안보다 세로 공간이 늘어난다.
- 결과물은 안전한 텍스트 미리보기로 제공한다. Markdown은 원문 표시이며 HTML로 해석하지 않는다.
- 좁은 창의 Sidebar는 펼쳐지는 패널로 제공하고 그래프/표는 필요할 때 내부 스크롤을 허용한다.

## 3. 전체 화면과 컴포넌트

Navigation Rail → 접을 수 있는 Workspace Sidebar → App Bar → Main Content 구조다.
Home, Workflows, Workflow Preview, Runs, Run Detail, Artifacts, Artifact Detail, Review, Settings의 9개 화면과 Home 내부 실제 채팅 화면을 구현했다.
기존 의존성을 사용하며 별도 라우팅·상태 라이브러리를 설치하지 않았다. 타입이 있는 WorkspaceRoute 상태로 화면을 선택한다.

| 파일 | 변경 및 역할 |
| --- | --- |
| src/app/App.tsx | 화면 상태·공통 테마 연결, Home 상시 마운트 |
| src/layouts/AppLayout.tsx | 레일·사이드바·헤더·반응형 탐색 |
| src/layouts/WorkspaceIcon.tsx | 공통 탐색 아이콘 확장 |
| src/pages/MainPage.tsx | A Home 및 기존 채팅 연결 |
| src/features/user-input/components/UserInputForm.tsx | 입력창 스타일·예시 입력·액션 배치 |
| src/features/user-input/components/UserInputRequestForm.tsx | 예시 props 전달, 기존 제출 재사용 |
| src/styles/global.css | 디자인 토큰·공통 스타일·반응형·Dark |
| src/pages/workspaceDemo.ts (신규) | 명시적 정적 데모 데이터·화면 타입 |
| src/pages/WorkflowPreview.tsx (신규) | 그래프·Steps·노드 상세·확대/축소·화면 맞춤 |
| src/pages/WorkspacePages.tsx (신규) | 목록·실행 상세·결과물·검토·설정 화면 |
| tests/user-input.test.tsx | 새 제목과 탐색 순서에 맞춰 기존 검증 보존 |
| tests/workspace.test.tsx | 새 메뉴 구조에 맞춰 기존 검증 보존 |
| tests/workspace-redesign.test.tsx (신규) | UI-01~16 |
| docs/poc/user-input/workspace-ui-test-results.md (신규) | 이 보고서 |

## 4. 실제 PoC 연동과 상태 보존

기존 입력 검증 → 요청 생성 → receive_user_input → Core 응답 검증 → ChatConversation 흐름을 재사용한다.
기존 useUserInput, useTransmission, 요청 DTO, 응답 검증, Rust Core 및 API v0.2 계약을 변경하지 않았다.
원문 보존, UUID, UTF-8 8,192바이트 제한, 이모지만 입력 차단 등 기존 검증 정책을 유지한다.
중복 제출 방지, 10초 타임아웃, IPC 오류, 지연 응답 무시와 요청별 결과 연결을 유지한다.

Home을 화면 전환 시 숨기되 마운트 상태를 유지하여 초안, 진행 요청, 대화 기록 및 대화 DOM을 보존한다.
예시 카드는 입력만 채우고 자동 전송하지 않는다. 새 업무 시작은 Home으로 이동하며 기존 대화를 지우지 않는다.
대화는 메모리 상태다. 앱 재시작 후 영구 복원 기능은 추가하지 않았다.

## 5. 실제 기능과 데모 범위

| 영역 | 현재 동작 |
| --- | --- |
| Home/Chat | 실제 검증·Tauri IPC·Rust Core 수신·기록 누적 |
| 탐색/검색/Preview | 실제 화면 전환, 정적 데이터 검색·탭·노드 선택·확대·맞춤 |
| Workflows/Runs/Artifacts | UI 검토용 정적 예시 표시; 실제 저장·실행·생성 아님 |
| Review | 데모 입력 편집 가능, 승인/재개는 비활성 |
| Settings | 기존 테마 실제 적용·로컬 저장, 나머지 설정은 준비 중 |

가짜 AI 응답, 지연 후 실행 성공, 실제인 것처럼 보이는 보고서 생성은 구현하지 않았다.
Workflow 실행·자연어 수정·승인·설정 저장 등 미연동 동작은 안내와 disabled 상태로 표시한다.

## 6. 자동화 검증

최종 FE 재검증: 11개 테스트 파일, **279/279 PASS**, 실패 0. 기존 263개 + 신규 16개.
기존 테스트의 입력·키보드 검증 의도를 유지했다. IPC 모킹 테스트와 실제 Tauri 확인을 아래에서 구분한다.

| ID | 검증 내용 | 결과 |
| --- | --- | --- |
| UI-01 | 기본 Workspace 영역 | PASS |
| UI-02 | Rail 화면 전환 및 활성 상태 | PASS |
| UI-03 | Sidebar 접기/펼치기 | PASS |
| UI-04 | Home 입력 표시·예시 입력, 자동 전송 없음 | PASS |
| UI-05 | Home 제출의 Command/DTO/원문 (IPC 모킹) | PASS |
| UI-06 | 정상 수신 결과 표시 | PASS |
| UI-07 | 여러 대화 누적 | PASS |
| UI-08 | 화면 왕복 후 대화 DOM 유지 | PASS |
| UI-09 | 무효 입력 차단, 호출·기록 없음 | PASS |
| UI-10 | IPC 오류·타임아웃·늦은 응답 무시 | PASS |
| UI-11 | 화면 이동 중 초안·진행 요청 및 결과 유지 | PASS |
| UI-12 | Workflow 검색·Guidance 탭 | PASS |
| UI-13 | Canvas/Steps 및 노드 상세 | PASS |
| UI-14 | 실행 상세·검토·결과물 탐색 | PASS |
| UI-15 | 데모 표시와 미구현 버튼 비활성 | PASS |
| UI-16 | 키보드 메뉴 이동·테마 전환 유지 | PASS |

프로젝트의 scripts/dev-env.cmd로 아래 명령을 실행했다.

| 명령 | 결과 |
| --- | --- |
| pnpm test | PASS, 11파일 279개 |
| pnpm exec tsc --noEmit -p tsconfig.test.json | PASS |
| pnpm build | PASS |
| cargo fmt --manifest-path src-tauri/Cargo.toml --check | PASS |
| cargo clippy --locked --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings | PASS |
| cargo test --locked --manifest-path src-tauri/Cargo.toml | PASS, 단위 5 + IPC 통합 1 |
| git diff --check | PASS |

Rust 검사는 실제 앱 QA 실행 전에 완료했다. 이후 Rust 코드 변경은 없다.
Git의 LF/CRLF 안내는 공백 오류가 아니며 diff 검사는 종료 코드 0이다.

## 7. 실제 Windows Tauri 및 시각 검증

실제 Tauri 개발 앱을 실행하고 WebView의 실제 DOM·화면 캡처·Core 응답으로 확인했다.
이는 사용자 수행 수동 테스트가 아니라 개발 에이전트가 수행한 실제 앱 검증이다.
검증용 추가 브라우저 인수는 무시되는 .cache의 로컬 설정으로만 적용했으며 제품 Tauri 설정은 변경하지 않았다.

| 항목 | 결과·근거 |
| --- | --- |
| Workspace 표시·페이지 탐색 | PASS, 각 화면 실제 렌더링/캡처 |
| 원문 및 다국어 전송 | PASS, 앞뒤 공백·줄바꿈 포함 안녕하세요 Hello 123 😀 / こんにちは 漢字 입력과 Core received 확인 |
| 다중 요청 | PASS, 2회 실제 Core 왕복 및 기록 누적 |
| 화면 이동 후 기록 | PASS, Workflows 왕복 후 2개 기록 유지 |
| 예시 업무 | PASS, 입력만 채워지고 전송되지 않음 |
| Preview 및 검토 | PASS, 노드 선택/상세, 승인 비활성 |
| Light/Dark | PASS, 실제 테마 전환 및 기록 유지 |
| 1440×960, 1024×768, 640×800 | PASS, Home/Workflows/Preview 화면 캡처 |
| 좁은 창 탐색 | PASS, Sidebar 펼침·선택 후 접힘 |
| 작은 창 넘침 | PASS, 문서/메인 페이지 가로 넘침 없음; 그래프 내부 스크롤 허용 |
| 긴 채팅 | PASS, 640px에서 1,200자 이상 실제 요청·응답, 입력창 노출 및 기록 유지 |
| 네이티브 환경 IPC 오류·타임아웃 강제 재현 | 미검증, 자동화 테스트로 검증 |
| 스크린리더·모든 Windows 배율 조합 | 미검증, 추가 사용자 확인 권장 |

캡처 증거는 Git에서 제외되는 .cache에 보관했다.
정확한 viewport로 캡처한 비교 파일:
- workspace-reference-1440.png, workspace-reference-preview.png: 원본 A 시안
- workspace-home-1440.png, workspace-home-1024.png, workspace-home-640.png
- workspace-workflows-1440.png, workspace-workflows-1024.png, workspace-workflows-640.png
- workspace-preview-1440.png, workspace-preview-1024.png, workspace-preview-640.png
- workspace-chat-640.png, workspace-settings-640.png 등

다른 초기 캡처의 파일명 -1440은 CSS 화면 기준이며 Windows 배율에 따라 PNG 픽셀 크기가 다를 수 있다.
레일·사이드바 비율, 헤더 정렬, Hero·입력창, 카드 여백, 색상·경계선, 그래프 및 좁은 화면을 시안과 비교했다.
공통 레이아웃은 레일 64px, 사이드바 226px, 헤더 55px를 기본으로 사용하며 좁은 화면에서 조정한다.

## 8. 사용자 수동 재검증 절차

1. 프로젝트에서 scripts/dev-env.cmd pnpm tauri dev 실행.
2. Light Home의 레일·Sidebar·입력창·예시 카드를 확인.
3. 앞뒤 공백과 줄바꿈을 포함한 안녕하세요 Hello 123을 입력하고 전송.
4. 사용자 원문과 Core 정상 수신 표시를 확인하고 두 번째 요청을 전송.
5. Workflows → Preview → Steps/Canvas를 탐색하고 Home으로 돌아와 기존 대화를 확인.
6. 실행 이력 → 상세 → 검토, 결과물 → 상세를 탐색. 예시 안내와 비활성 실행·승인 버튼을 확인.
7. Settings에서 Dark/Light 전환 후 Home 기록이 유지되는지 확인.
8. 창을 줄이고 Sidebar를 접거나 펼쳐 입력창·메뉴·긴 채팅의 가독성을 확인.

## 9. 후속 개발 및 제한

- Workflow 저장·실행, AI Agent 호출, 자연어 Workflow 수정 및 실제 Artifact 생성은 별도 백엔드 구현이 필요하다.
- 검토 승인/재개와 실행 이력·결과물 영속화도 미구현이다.
- 정적 데모 데이터는 향후 실제 데이터 계층으로 대체하되 기존 PoC 요청·응답 계약과 분리한다.
- Review의 데모 편집값과 검색/선택 상태는 페이지 재진입 시 초기화될 수 있다.
- 대화 영구 저장·새 대화 초기화 기능은 이번 범위가 아니다.
- 기존 I/D/T/R/O 및 채팅형 검증 보고서는 변경하지 않았다. 의존성 설치, Rust 변경, 새 IPC/API 추가도 없다.
