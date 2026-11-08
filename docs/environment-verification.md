# 개발 환경 구축 및 검증 기록

검증일: 2026-11-07 (Asia/Seoul)
프로젝트: C:\Users\user\JTK7458\Desktop\agent-orchestration

## 환경
- Windows x64 25H2, 빌드 26200.9711. 레지스트리 ProductName은 Windows 10 Home으로 표시되어 제품명은 확정하지 않음.
- Git 2.51.0.windows.1, PowerShell 7.6.9, VS Code 1.144.0.
- Visual Studio Community 2022 17.14.14, NativeDesktop 워크로드와 VC.Tools.x86.x64 확인.
- Windows SDK 10.0.26100.0, WebView2 156.0.4314.58 재사용.
- 프로젝트 전용 Node 22.23.4, pnpm 10.34.9, Rust / Cargo 1.99.1.
- React / React DOM 19.2.9, TypeScript 5.9.3.
- Tauri Rust 2.12.3, JS API / CLI 2.12.4.
- Vite 8.3.6, React plugin 6.2.1.
- React types 19.2.18, React DOM types 19.2.7.

## 설치 및 변경
- 공식 Node ZIP을 SHA256 확인 후 .tools/에 압축 해제.
- pnpm 10.34.9와 create-tauri-app 4.7.5를 .tools/package-manager에 설치. npm 설치 스크립트 비활성화.
- 공식 Rustup 실행 파일을 공식 SHA256과 비교한 후 설치.
- Rustup은 --no-modify-path --profile minimal --default-toolchain 1.99.1 --default-host x86_64-pc-windows-msvc 사용.
- CARGO_HOME, RUSTUP_HOME, npm 캐시, pnpm store와 임시 디렉터리를 프로젝트 내부로 설정.
- 환경변수는 설치 프로세스 또는 dev-env.cmd의 setlocal 범위에만 적용.
- React 최소 안내 화면, FE 구조, 문서, Git 및 버전 고정 파일 작성.
- 예제 greet Command와 미사용 opener 플러그인 제거. 실제 IPC 미구현.
- 미사용 Frontend 템플릿 로고 제거. Rust 자동 생성 파일과 아이콘은 유지.

## 주요 실행 명령
아래 명령은 프로젝트 루트에서 실행.

    npm install --prefix .tools/package-manager --ignore-scripts --no-audit --no-fund pnpm@10.34.9 create-tauri-app@4.7.5
    create-tauri-app scaffold --manager pnpm --template react-ts --identifier com.capstone.agentorchestration --tauri-version 2 --yes
    rustup-init.exe -y --no-modify-path --profile minimal --default-toolchain 1.99.1 --default-host x86_64-pc-windows-msvc
    scripts\dev-env.cmd pnpm install --ignore-scripts
    scripts\dev-env.cmd pnpm build
    scripts\dev-env.cmd cargo check --manifest-path src-tauri/Cargo.toml
    scripts\dev-env.cmd pnpm install --frozen-lockfile --ignore-scripts
    scripts\dev-env.cmd pnpm tauri dev --config .cache/tauri.local.json
    git init --initial-branch=main
    git status --short --untracked-files=all
    git check-ignore .tools .cache node_modules dist src-tauri/target

도구 설치 명령 실행 시에도 프로젝트 전용 Node, npm 캐시, TEMP/TMP를 사용.
공식 템플릿은 프로젝트 내부 임시 scaffold/에서 생성 후 루트로 이동하고 이름을 agent-orchestration으로 변경.

## 검증
- Frontend 의존성 설치: 성공. 설치 스크립트 허용 없이 빌드 가능.
- pnpm frozen-lockfile 재설치: 성공, lockfile 변경 없음.
- Frontend 빌드: 성공, TypeScript 검사 및 Vite 17개 모듈 빌드 완료.
- Rust cargo check: 성공, 1m 28s.
- Git 제외 규칙: .tools, .cache, node_modules, dist, src-tauri/target 제외 확인.
- lockfile: pnpm-lock.yaml과 src-tauri/Cargo.lock은 제외되지 않음.
- 데스크톱 실행 및 화면 확인: 아래 최종 확인 항목에 기록.

## 오류와 해결
- 기본 샌드박스에서 npm DNS 조회 실패 → 해당 공식 배포 서버 접근에 도구 권한 검토를 거쳐 해결.
- CIM 운영체제 조회 접근 제한 → 읽기 전용 레지스트리와 .NET OS 정보 사용.
- Rustup 체크섬 첫 비교 실패 → HTTP 응답이 byte[]였음. UTF-8로 변환하여 해시 일치 확인 후 실행.
- create-tauri-app 패키지 버전 4.7.5와 도움말 표기 4.8.0 차이를 기록. 설치 패키지 및 네이티브 의존성 버전은 4.7.5.

## 시스템 전체 변경 및 제외 작업
시스템 전체 프로그램 설치/제거, 영구 PATH, 레지스트리, 실행 정책, 방화벽, 서비스, 재부팅 명령을 수행하지 않음.
기존 Node 20과 다른 프로젝트는 수정하지 않음.
커밋, 원격 저장소 생성/연결, Push는 수행하지 않음.
macOS/Linux, 배포용 설치 패키지, 실제 IPC 및 PoC 기능은 검증 대상이 아님.
FE–Core Command/요청/응답/오류/수신 성공 기준은 미확정.

## 다음 단계
I-000~I-102 입력 UI → D-000~D-100 입력 상태·원문 보존·검증 → transport / Mock Gateway → 계약 합의 후 실제 IPC 연결.

## 최종 확인
- Tauri 개발 모드: 성공. Rust 개발 빌드 1m 01s 후 agent-orchestration.exe 실행.
- 실제 데스크톱 창: 성공. Computer Use로 AI Agent Orchestration 창을 전면에 표시하고 시각적으로 확인.
- 화면 문구: 프로젝트명, User Input PoC — Development Environment Ready, 한국어 환경 안내 모두 확인.
- 실제 UI에 입력창/전송 버튼/응답 기능 없음.
- 앱 창은 사용자 확인을 위해 열린 상태로 유지.
- npm frozen-lockfile 재설치 성공. 검증 명령의 마지막 git check-ignore lockfile 조회는 종료 코드 1로, lockfile이 제외되지 않았다는 정상 결과.

## 첫 커밋 준비
새 저장소 main 브랜치에 프로젝트 파일을 스테이징했습니다. 커밋과 원격 연결은 수행하지 않았습니다.
git diff --cached --check에서 발견한 파일 끝의 불필요한 빈 줄을 정리했습니다.
기존 Git 줄바꿈 정책에 따른 LF/CRLF 안내는 전역 설정을 변경하지 않고 유지했습니다.

## WebView2 저장 경로 수정 및 외부 잔여물
첫 실행에서 window.dataDirectory에 지정한 절대 경로가 적용되지 않아 아래에 앱 전용 데이터가 생성된 것을 자식 WebView2 프로세스 인자로 확인했습니다.

    C:\Users\user\AppData\Local\com.capstone.agentorchestration\EBWebView

사용자가 지정한 프로젝트 내부 쓰기 범위와 다른 결과이므로 즉시 개발 실행을 중단하고 로컬 설정을 app.appDirectoriesOverride로 수정했습니다.
프로젝트 외부에 생성된 해당 앱 데이터는 삭제하지 않았습니다. 정리하려면 사용자 별도 승인이 필요합니다.
이는 의도한 설치 범위 밖의 런타임 부수 효과이며, 외부 변경이 전혀 없었다고 간주하지 않습니다.

수정 후 재실행 성공. .cache/app-data/ 존재 및 자식 WebView2 프로세스의 --user-data-dir이 프로젝트의 .cache/app-data/EBWebView인 것을 확인했습니다.

## 승인된 잔여 데이터 정리
사용자의 별도 승인 후 C:\Users\user\AppData\Local\com.capstone.agentorchestration\EBWebView만 삭제했습니다.
삭제 전에 절대 경로, 상위 경로, reparse point 부재와 실행 중인 앱의 프로젝트 내부 데이터 사용을 확인했습니다.
삭제 후 해당 폴더가 없고 프로젝트 내부 .cache/app-data/EBWebView는 유지됨을 확인했습니다.
AppData의 상위 com.capstone.agentorchestration 폴더는 삭제 범위에 포함하지 않아 보존했습니다.
