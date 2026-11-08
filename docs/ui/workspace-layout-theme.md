# Agent Workspace UI

기존 User Input PoC를 Tauri 창 전체에 배치했다. AppLayout의 헤더에는 앱 이름, 현재 화면, 테마 전환 버튼이 있다. 사이드바는 현재 Home과 개발 예정인 Agents·Workflows를 표시한다. MainPage는 안내 제목, 기존 UserInputForm, FE 제출 확인 영역을 구성한다.

## 테마와 반응형 화면

useTheme은 최초 실행 시 Light를 적용하고, 선택한 테마를 localStorage의 agent-workspace-theme 키에 저장한다. 앱을 다시 열면 dark 값만 Dark로 복원하며 값이 없거나 잘못됐으면 Light를 사용한다. 저장소 접근이 실패해도 현재 창의 전환은 동작한다. 루트 요소의 data-theme 속성과 global.css의 색상 변수, color-scheme이 화면과 기본 입력 컨트롤에 함께 적용된다.

너비 650px 이하에서는 왼쪽 탐색을 헤더 아래 가로 메뉴로 바꿔 모든 메뉴 이름을 유지한다. 높이 500px 이하에서는 안내 영역의 심볼을 숨기고 여백을 줄인다. 입력 영역은 최대 760px이며 입력창을 세로로 늘릴 수 있다. 공간이 부족하면 문서를 스크롤할 수 있다.

## 입력과 범위

I-000~I-102의 입력 폼, 유효성 검사, 제출 훅과 원문 전달을 재사용한다. 테마를 바꿔도 편집 중인 내용이 유지된다. FE 제출 확인은 기존 문자 및 줄 수를 표시한다. D(Data) 신규 기능, Transmission, Reception, FE–Core IPC, Agent·Workflow 실행 및 대화 저장은 이번 작업 범위에서 제외했다.

## 2026-11-08 검증

- 프로젝트 루트에서 `.\scripts\dev-env.cmd pnpm test`로 실행한다. 기존 Input 58건과 신규 Workspace 16건 모두 통과했다. UI-001~015와 저장소 접근 실패 시 전환하는 UI-016을 포함한다.
- 기존 입력 테스트의 화면 제목과 키보드 이동 순서를 새 마크업에 맞췄다. Tab으로 헤더 토글을 지나 입력창에 도달하는지 확인한다.
- `.\scripts\dev-env.cmd pnpm exec tsc --noEmit -p tsconfig.test.json`과 `.\scripts\dev-env.cmd pnpm build`가 성공했다.
- 별도 실제 Tauri 개발 앱의 WebView2에서 1440×900, 1024×768, 800×600, 480×360을 검사했다. 각 크기에서 기호 단독 차단, 영문 추가 후 버튼 포커스, 클릭 및 FE 수신을 확인했다. 버튼 겹침, 가로 넘침, 전송을 위한 세로 스크롤은 없었다.
- 실제 앱에서 기본 Light, 양방향 테마 전환과 브라우저 색상 체계를 확인했다. Dark 선택 후 검증 앱 프로세스를 종료하고 같은 사용자 데이터로 재실행해 Dark 복원을 확인했다.
- 후속 수동 검증 대상은 실제 Windows 한글 IME 조합과 화면 읽기 프로그램의 탐색·테마 안내다.
