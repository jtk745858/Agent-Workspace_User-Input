# AI Agent Orchestration

자연어 입력을 기반으로 AI Agent와 Workflow를 활용하는 로컬 우선 데스크톱 업무 오케스트레이션 시스템입니다.

현재 단계는 **User Input PoC 개발 환경 초기화**입니다. 최종 PoC가 검증할 흐름은 사용자 → Frontend → Rust Core → Frontend → 사용자입니다. 현재 저장소는 환경 확인 화면만 제공하며 입력, 전송, IPC 수신 기능은 구현하지 않았습니다.

## 기술 스택

| 영역 | 계획 | 현재 구성 |
|---|---|---|
| UI | React 19.2.x | React / React DOM 19.2.9 |
| 언어 | TypeScript 5.9.x | 5.9.3 |
| 데스크톱 | Tauri 2.12.x | Rust crate 2.12.3, JS API / CLI 2.12.4 |
| Core | Rust 1.99.1 | 1.99.1, Windows MSVC x64 |
| 런타임 | Node.js 22 LTS | 22.23.4 |
| 패키지 관리 | pnpm 권장 | 10.34.9 고정 |
| 개발 서버 / 빌드 | 공식 템플릿 | Vite 8.3.6 / React plugin 6.2.1 |
| Workflow | LangGraph.js 1.x | 미도입 |
| DB | SQLite 3 | 미도입 |
| 보안 저장소 | Stronghold 2.4.0 | 미도입 |
| CI/CD | GitHub Actions | 미구성 |

Tauri 하위 crate들은 각자의 버전 체계를 사용합니다. 모든 하위 crate를 2.12로 강제하지 않습니다. 정확한 의존성 그래프는 pnpm-lock.yaml과 src-tauri/Cargo.lock으로 고정합니다.

공식 create-tauri-app 4.7.5의 react-ts 템플릿에서 시작했습니다. 생성 도구 자체 도움말은 4.8.0으로 표시되었으나 설치 패키지 메타데이터는 4.7.5입니다. 템플릿의 Rust 구조, 아이콘, 빌드 설정은 유지하고 샘플 greet Command와 사용하지 않는 opener 플러그인만 제거했습니다.

## 필수 개발 도구

- 공통: Git, Node 22.23.4, pnpm 10.34.9, rustup / Rust 1.99.1.
- Windows: Desktop development with C++ 워크로드, MSVC x64/x86 도구, Windows SDK, WebView2.
- macOS: Xcode Command Line Tools와 플랫폼에 맞는 Rust toolchain.
- Linux: 배포판에 맞는 C/C++ 도구, WebKitGTK 4.1 및 Tauri 네이티브 의존성.
- 공식 안내: https://v2.tauri.app/start/prerequisites/

macOS / Linux 실행은 이 PC에서 검증하지 않았습니다. 시스템 도구 설치와 영구 PATH 변경은 각 개발자가 승인한 범위에서 진행합니다.

## 이 PC에서 실행

개발 기준은 Node.js 22.23.4와 pnpm 10.34.9입니다. 지원 범위는 Node.js 22.22.2 이상, 23 미만입니다. 현재 잠금 파일의 jsdom 31.0.0은 Node 22 계열에서 22.22.2 이상을 요구합니다. nvm-windows에서는 프로젝트에 진입하는 것만으로 .nvmrc가 자동 적용되지 않을 수 있으므로 node --version으로 확인합니다.

이 PC에서 프로젝트 폴더를 VS Code로 열고 새 PowerShell 터미널을 만들면 프로젝트 전용 로컬 설정이 .tools의 Node와 pnpm을 우선합니다. 기존 터미널 또는 일반 PowerShell에서는 프로젝트 루트에서 다음 명령으로 같은 환경의 하위 PowerShell을 열 수 있습니다. exit로 원래 셸에 돌아갑니다.

    .\scripts\dev-env.cmd powershell -NoProfile
    node --version
    pnpm test
    pnpm build

프로젝트 루트에서 다음 명령을 실행합니다. 별도의 PowerShell 실행 정책 변경은 필요하지 않습니다.

    .\scripts\dev-env.cmd node --version
    .\scripts\dev-env.cmd pnpm install --frozen-lockfile --ignore-scripts
    .\scripts\dev-env.cmd pnpm build
    .\scripts\dev-env.cmd cargo check --locked --manifest-path src-tauri/Cargo.toml
    .\scripts\dev-env.cmd pnpm tauri dev --config .cache/tauri.local.json

마지막 명령은 실제 데스크톱 앱을 실행합니다. Frontend만 확인하려면 다음 명령을 사용합니다.

    .\scripts\dev-env.cmd pnpm dev

개발 서버는 localhost:1420을 사용합니다. 다른 프로세스가 이 포트를 사용하면 먼저 충돌 원인을 확인합니다.

이 PC의 Node, pnpm, Rust는 .tools/에 있고 캐시와 임시 데이터는 .cache/에 있습니다. dev-env.cmd는 하위 프로세스에만 환경변수를 적용하며 종료 시 복원합니다. .cache/tauri.local.json은 로컬 검증용 WebView2 저장 경로를 프로젝트 내부로 지정합니다. 이 두 디렉터리는 Git에 포함하지 않습니다.

## 다른 팀원의 Clone 후 실행

.tools/는 저장소에 포함되지 않습니다. 팀원은 위 필수 개발 도구를 먼저 준비해야 합니다. pnpm 10.34.9를 설치한 환경에서:

    pnpm install --frozen-lockfile --ignore-scripts
    pnpm build
    cargo check --locked --manifest-path src-tauri/Cargo.toml
    pnpm tauri dev

.nvmrc와 rust-toolchain.toml을 기준으로 버전을 맞춥니다. 로컬 전용 dev-env.cmd는 이 PC의 격리 설치용이므로 다른 팀원은 일반 명령을 사용합니다. 신규 의존성에서 설치 스크립트가 필요해지면 내용을 검토한 후 필요한 패키지만 허용합니다.

## 구조와 책임

- src/app/App.tsx: 애플리케이션 조립
- src/pages/MainPage.tsx: 개발 환경 확인 화면
- src/styles/global.css: 최소 전역 스타일
- src/features/user-input/: 입력 기능을 위한 영역. 실제 구현 시 components, hooks, model, transport를 추가
- src/shared/components/: 공통 UI 영역
- src-tauri/: Core 담당 영역. 공식 Rust 실행 구조 유지
- docs/architecture/fe-core-boundary.md: FE / Core 역할과 미확정 계약
- docs/poc/user-input/README.md: PoC 목표와 제외 범위
- docs/environment-verification.md: 이 PC의 구축 및 검증 결과

## 현재 범위와 다음 단계

현재는 프로젝트 초기화와 개발 환경 확인만 수행합니다. 입력 UI, 입력 상태/검증, API 계약, Mock Gateway, Agent/LLM, Workflow, DB, 인증은 구현하지 않았습니다.

다음 단계는 I-000~I-102 입력 UI와 D-000~D-100 입력 상태·원문 보존·검증입니다. 이후 transport 추상화와 Mock Gateway를 구현하고, 실제 IPC는 Core 담당자와 계약을 합의한 뒤 연결합니다.

## Git

lockfile 두 개는 추적하고 .tools/, .cache/, node_modules/, dist/, Rust target/, 환경변수 파일은 제외합니다.
첫 커밋과 원격 저장소 연결은 자동 수행하지 않습니다.

권장 첫 커밋 메시지: chore: initialize Tauri React Rust project
