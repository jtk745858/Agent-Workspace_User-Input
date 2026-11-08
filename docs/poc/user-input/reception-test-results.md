# User Input PoC · Rust 수신 검증

2026-11-09 · feat/user-input-reception · Windows x64 · Rust 1.99.1 · Tauri crate 2.12.3 · Node 22.23.4

## 계약과 범위

[상세 명세](https://docs.google.com/spreadsheets/d/1c5geYDtLm2X5B9cZzp-b03OnzviUmuezXJ3GdCrov_I/edit)의 R-000~R-102와 [API 계약 v0.2](https://docs.google.com/spreadsheets/d/1cCvW75jHMKFOgNA5l3kssnQoURdGGD5wj9vMIR8Stao/edit)의 호출, 요청 구조, 검증 우선순위, 응답 필드를 대조했다. 로컬 fe-core-api-contract.md는 v0.1 Draft이며 이번 구현은 v0.2를 따른다. R-002의 구조 오류는 Tauri 인수 역직렬화에서 실패하므로 계약에 따라 IPC 호출 오류로 전달된다. [GitBook](https://cprtmchzh.gitbook.io/orchestration)의 프로젝트 개요를 확인했다. 온라인 기술 하위 페이지 본문은 확인하지 못해 기술 경계는 로컬 기술 문서 사본과 API 계약을 사용했다.

| 기능 | 구현 | 검증 |
|---|---|---|
| R-000 등록 | lib.rs의 register_commands를 실제 앱과 테스트가 공유 | 모의 런타임에서 이름으로 dispatch |
| R-001 수신 | reception.rs의 receive_user_input(request)는 타입이 지정된 DTO를 받음 | 서로 다른 ID·원문의 연속 호출 |
| R-002 구조 | camelCase, 두 필수 String, deny_unknown_fields | 필드 누락·추가·타입·null·고립 surrogate, 최상위 request 누락 |
| R-100 검증 | UUID v4 소문자 → UTF-8 길이 → 그래핌별 내용 | UUID 버전·variant·표기, ID 우선, 길이 우선, ASCII 및 다바이트 8192/8193 경계 |
| R-101 원문 | 수신한 String 소유권을 응답 필드로 이동 | 앞뒤 공백·탭·LF·CRLF·NFD 포함 정확한 문자열 동등성 |
| R-102 결과 | Serde 태그 enum으로 received 또는 rejected를 반환 | 직렬화한 JSON의 정확한 키와 값, 비어 있지 않은 거부 메시지 |

## D–R 공통 판정

tests/reception-content.json의 유효 18건·무효 16건을 FE와 Rust가 같은 기대값으로 검사한다. Rust는 unicode-segmentation 1.13.3의 확장 그래핌과 unicode-properties 0.1.4의 Letter/Number 범주를 사용한다. 두 crate의 데이터 버전 17.0.0을 테스트에서 확인한다. D 구현과 마찬가지로 Emoji 17.0 중 문자·숫자가 포함되는 숫자 키캡(두 표기)과 ℹ(두 표기)를 내용 인정 대상에서 제외한다. 숫자 단독과 키캡 뒤 숫자는 허용한다. 고립 surrogate는 JS에서 인코딩 전에 차단되며 Rust String에 담을 수 없다. 제품 FE 코드는 변경하지 않았다.

## 실행과 변경 범위

프로젝트 루트에서 scripts/dev-env.cmd를 통해 아래 명령을 실행했다.

```powershell
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo clippy --locked --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --locked --manifest-path src-tauri/Cargo.toml
pnpm test
pnpm exec tsc --noEmit -p tsconfig.test.json
pnpm build
```

Rust 구현은 src-tauri/src/lib.rs와 reception.rs, Rust 단위·등록 경로 테스트는 src-tauri/src/reception_tests.rs와 src-tauri/tests/reception_ipc.rs에 있다. Cargo.toml과 Cargo.lock에는 신규 unicode-properties 한 개와 기존 잠금 버전 regex·unicode-segmentation의 직접 참조를 반영했다. Tauri의 test 기능은 개발 의존성이다. FE는 tests/reception-contract.test.ts에서 공통 입력만 추가 검사한다.

## 검증 결과

Rust 단위 테스트 5건과 Tauri MockRuntime 통합 테스트 1건이 통과했다. 실패·무시·필터링 0건이다. FE 169건(기존 135건과 D–R 공유 입력 34건)이 모두 통과했다. fmt, 전체 타깃 Clippy(-D warnings), 테스트 포함 TypeScript 검사 및 프로덕션 빌드가 성공했다.

첫 시도에서 모의 IPC를 포함한 Windows 테스트 실행 파일이 시작 전에 0xc0000139로 종료됐다. Windows Common Controls v6의 TaskDialogIndirect가 필요한 실행 파일을 독립된 통합 테스트 타깃으로 분리하고 build.rs에서 Windows MSVC 테스트 타깃에만 v6 매니페스트를 포함시켰다. 동일 수신 등록 코드를 사용하는 모의 호출과 구조 오류 경로를 재검증했다. 프로젝트 전용 Rust 1.99.1 도구에는 검사를 위해 rustfmt 및 clippy를 설치했다.

R-000~R-102 수동 검증 40개 항목의 확인을 완료하였다. 추가 검증에서는 잘못된 자료형 거부, 한글 UTF-8 바이트 경계값, 혼합 Unicode 원문 보존 및 사용자 입력 원문의 로그 노출 여부를 확인하였다.

## 후속 연결

T는 receive_user_input에 { request: { requestId, rawText } }를 전달한다. resolve된 rejected의 허용 코드는 INVALID_REQUEST_ID, INPUT_TOO_LONG, INVALID_INPUT이다. 인수 역직렬화 또는 기술적 호출 실패는 IPC_ERROR로 분류한다. O는 응답 구조와 ID를 확인하고 received일 때만 원문을 대조한다. 실제 데스크톱 WebView에서 FE와 Core 간 왕복, 여러 OS의 WebView Unicode 데이터 호환성은 후속 통합 검증 대상이다.
