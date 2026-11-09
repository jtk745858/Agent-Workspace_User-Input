# User Input PoC · O 수신 결과 검증 보고서

## 범위와 기준

2026-11-09, Windows, `feat/user-input-output`. 작업 시작 시 HEAD와 로컬 main은 T 영역 PR #5 병합 커밋 `e238761`이었다. 제출 한 건의 원문, Core 응답 검증, 최종 수신 결과 표시를 검증했다.

상세기능 6개의 범위는 [상세 구현 명세서 O 영역](https://docs.google.com/spreadsheets/d/1c5geYDtLm2X5B9cZzp-b03OnzviUmuezXJ3GdCrov_I/edit), 폐쇄형 응답과 오류 우선순위는 [API 명세 v0.2](https://docs.google.com/spreadsheets/d/1cCvW75jHMKFOgNA5l3kssnQoURdGGD5wj9vMIR8Stao/edit)를 확인했다. 전체 프로젝트에서 Workspace가 담당하는 역할은 [GitBook 프로젝트 개요](https://cprtmchzh.gitbook.io/orchestration)를 참고했다.

## 기능별 구현

| ID | 판정 및 화면 동작 |
| --- | --- |
| O-000 | `null`, 배열, 객체가 아닌 값은 `RESPONSE_INVALID`로 판정한다. 객체는 `status`별 필수 필드만 허용하며 모든 필드가 문자열이어야 한다. `received`에는 `requestId`, `status`, `receivedText`가, `rejected`에는 `requestId`, `status`, `errorCode`, `message`가 필요하다. 필드 누락·추가·타입 오류, 미등록 상태나 거부 코드, 비어 있거나 공백만 있는 거부 사유도 `RESPONSE_INVALID`로 처리한다. |
| O-001 | 스키마 통과 후 제출 ID와 응답 ID를 그대로 대조한다. 다르면 RESPONSE_MISMATCH이다. received에서만 원문을 정확히 비교해 다르면 RESPONSE_TEXT_MISMATCH로 판정한다. |
| O-100 | 최신 요청의 rawText를 React 텍스트 노드로 출력한다. break-spaces로 공백과 줄바꿈을 보존한다. 편집 중인 입력과 제출 원문을 독립적으로 표시한다. |
| O-101 | 스키마, 요청 ID, 수신 원문이 모두 일치할 때 “Core가 사용자 입력을 정상적으로 수신했습니다.”를 표시한다. |
| O-102 | 유효한 거부 응답만 코드별 한국어 안내, errorCode, Core message를 표시한다. 제출 전에는 입력 조건, UTF-8 크기 초과, 잘못된 유니코드에 대한 FE 안내를 입력창과 연결한다. 초기 빈 입력에는 기존 비활성 버튼과 입력 안내를 표시한다. |
| O-103 | 응답 대기, IPC_ERROR, 10초 경과 RESPONSE_UNCONFIRMED, 세 가지 응답 검증 오류를 구분한다. 통신 오류와 시간 초과는 수신 여부 미확인으로 표시한다. |

D는 유효한 제출마다 crypto.randomUUID()로 requestId를 생성하고 rawText와 묶는다. T의 useTransmission은 send와 state를 제공하며 같은 요청에 원시 response를 보존한다. T가 분류한 received와 rejected는 모두 O의 validateCoreResponse로 들어간다. T의 통신 오류 및 시간 초과는 해당 상태로 표시한다. 유효한 거부 코드는 INVALID_REQUEST_ID, INVALID_INPUT, INPUT_TOO_LONG이다. message의 trim은 공백 전용인지 검사할 때만 사용한다. ID와 원문 비교는 문자열 그대로 수행한다.

기존 MainPage는 FE 전달 글자·줄 수와 통신 상태를 표시했고, 입력 폼은 무효 입력의 버튼과 제출을 차단했다. 새 UI는 같은 제출 스냅샷에 결과를 연결하며 추가 IPC 호출, 타이머, 요청 저장소가 없다.

## 변경 파일

| 파일 | 역할 |
| --- | --- |
| src/features/user-input/validateCoreResponse.ts | 런타임 스키마 검사와 요청별 판정 |
| src/features/user-input/components/SubmissionResult.tsx | 최신 제출 원문과 판정별 한국어 안내 |
| src/pages/MainPage.tsx | 기존 T 상태를 결과 컴포넌트에 전달 |
| src/features/user-input/isValidUserInput.ts | 기존 판정 조건으로 실패 사유를 제공하고 boolean 호출 API 유지 |
| src/features/user-input/hooks/useUserInput.ts | 입력 상태에서 유효성과 안내를 파생 |
| src/features/user-input/components/UserInputForm.tsx | 입력 오류 설명과 접근성 연결 |
| src/styles/global.css | 원문 공백 보존, 긴 줄 처리, 상태별 테두리 |
| tests/output-validation.test.ts | 계약과 우선순위 검증 |
| tests/output.test.tsx | MainPage를 통한 I/D/T/O 통합 검증 |
| docs/poc/user-input/output-test-results.md | 검증 기록과 수동 확인 절차 |

## 구현 당시 자동 검증 기록 · Codex

프로젝트 루트에서 아래 pnpm 및 cargo 명령을 각각 `.\scripts\dev-env.cmd`로 실행했다.

| 실행 명령 | 결과 |
| --- | --- |
| `pnpm exec vitest run tests/output-validation.test.ts tests/output.test.tsx --reporter=default --hideSkippedTests=false --silent=passed-only` | 신규 56/56 통과 |
| `pnpm test` | 9개 파일, 245/245 통과. 기존 189건 포함 |
| `pnpm exec tsc --noEmit -p tsconfig.test.json` | 통과 |
| `pnpm build` | TypeScript 컴파일 및 Vite 배포 빌드 통과 |
| `cargo fmt --manifest-path src-tauri/Cargo.toml --check` | 통과 |
| `cargo clippy --locked --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings` | 통과 |
| `cargo test --locked --manifest-path src-tauri/Cargo.toml` | 라이브러리 5건, IPC 통합 1건 통과. 실패 0건 |
| `git diff --check`, `git status` | 추적 파일 공백 오류 없음. 변경 파일과 기존 미추적 파일 확인 |

- 순수 함수 46건은 상태별 정상 응답과 필드 누락·추가·타입 오류, 거부 코드·사유, ID 불일치, 여러 오류의 우선순위를 검증한다. 공백, CRLF/LF, 대소문자, NFC/NFD 한글, 이모지 및 다른 Unicode 문자열을 비교한다.
- UI 10건은 제출 즉시 대기, 원문 보존, 마크업의 문자 그대로 표시, 입력 편집 후 성공, 세 거부 코드, 통신 및 계약 오류, 시간 초과, B 완료 후 A 지연 응답 무시, FE 제출 차단과 재제출을 검증한다.
- UI 테스트는 Tauri invoke를 대체하고 Promise와 시간을 제어했다. Rust 테스트는 수신 로직과 등록된 Command 디스패치를 검증했다. 아래 Windows WebView 실기 항목은 이번 자동 검증 건수에 포함되지 않는다.

## 구현 당시 수동 검증 계획 · 2026-11-09

아래 체크박스는 구현 당시의 최초 계획을 보존한 기록이다. 실제 수행한 21건의 PASS/FAIL 판정은 다음 「Windows Tauri 수동 검증 결과 · 사용자 수행」 절에 기록했다. 21건에서 개별 결과를 확인할 수 없는 항목은 문서 끝의 후속 확인 표에서 관리한다.

프로젝트 루트에서 `.\scripts\dev-env.cmd pnpm tauri dev --config .cache/tauri.local.json`으로 개발 앱을 연다. 오류 응답과 지연은 정상 Core에서 임의로 발생하지 않으므로 해당 시나리오는 제어 가능한 별도 검증 환경에서 확인한다.

| 확인 | ID | 조작과 기대 결과 |
| --- | --- | --- |
| [ ] | O-100, O-101 | 앞뒤 공백이 있는 한글·영문·이모지를 두 줄로 제출한다. 원문 배치와 Core 정상 수신 안내를 확인한다. 입력창을 편집해도 제출 원문은 유지되어야 한다. Light/Dark 양쪽에서 긴 줄과 상태를 읽을 수 있어야 한다. |
| [ ] | O-000, O-001 | 개발자 도구의 validateCoreResponse 중단점에서 실제 요청·응답의 ID와 원문이 같은지 확인한다. 제어 응답에서 추가 필드, 다른 ID, 다른 원문을 각각 사용하면 해당 오류만 표시되어야 한다. |
| [ ] | O-102 | 이모지만 입력하거나 ASCII 문자 8,193개를 입력한다. 입력창에 사유가 표시되고 전송이 차단되어야 한다. 유효한 입력으로 바꾸면 전송이 가능해야 한다. 제어 환경에서는 동일 ID의 유효한 rejected 응답에만 Core 거부 사유가 표시되어야 한다. |
| [ ] | O-103 | IPC 실패와 10초 지연을 각각 재현해 서로 다른 안내와 재제출 가능 여부를 확인한다. A 시간 초과 후 B를 제출하고 A의 지연 응답이 B 원문·상태를 덮어쓰지 않는지 확인한다. |

구현 당시 계획한 전체 PoC의 후속 E2E 확인은 Windows WebView에서 I 입력 → D 요청 생성 → T IPC → 실제 R Command → O 정상 수신 표시를 한 번에 관찰하고 결과를 기록하는 것이다. 정상 경로와 제어 응답을 사용한 오류 경로는 재현 조건을 함께 기록한다.

## Windows Tauri 수동 검증 결과 · 사용자 수행

2026-11-10 문서 반영. 사용자는 Windows Tauri 개발 앱의 입력 UI와 DevTools Console, Sources, Elements를 사용했다. 아래 PASS는 사용자의 최종 완료 보고에 근거한다. 오류·예외 14건에는 개발용 QA 계측을 사용했고, 원복 후 정상 제품 경로 7건을 확인했다. Codex의 직접 실행 결과는 마지막 자동 검사 절에 기록한다.

| 검증 ID | 기능 ID | 검증 경로 | 사용자 관찰 결과 | 사용자 보고 |
| --- | --- | --- | --- | --- |
| MT-O000-01 | O-000 | 실제 Core | 정상 응답의 requestId, status=received, receivedText를 해석했다. | PASS |
| MT-O000-02 | O-000 | QA 입력 → 실제 Core | FE 검증을 우회해 보낸 `!!!`에 대해 Rust가 반환한 rejected 응답을 해석했다. | PASS |
| MT-O000-03 | O-000 | 응답 변조 | null, 배열, 필수 필드 누락을 각각 RESPONSE_INVALID로 처리했다. | PASS |
| MT-O000-04 | O-000 | 응답 변조 | 추가 필드, 필드 타입 오류, 미등록 status를 RESPONSE_INVALID로 처리했다. | PASS |
| MT-O000-05 | O-000 | 응답 변조 | 미등록 errorCode, 공백 message, rejected의 추가 필드를 RESPONSE_INVALID로 처리했다. | PASS |
| MT-O000-06 | O-000 | 복합 오류 주입 | 동시에 여러 오류가 있을 때 스키마 오류 → ID 불일치 → 수신 원문 불일치 순으로 첫 오류를 표시했다. | PASS |
| MT-O001-01 | O-001 | 실제 Core | 응답 ID가 해당 제출의 requestId와 일치했다. | PASS |
| MT-O001-02 | O-001 | 응답 ID 변조 | 다른 ID의 응답에 RESPONSE_MISMATCH를 표시하고 해당 제출의 성공 판정을 차단했다. | PASS |
| MT-O001-03 | O-001 | FE 완료 지연 | 시간 초과된 A의 늦은 완료 이후에도 새 요청 B의 결과를 유지했다. | PASS |
| MT-O100-01 | O-100 | 제품 UI | 제출 시점 rawText가 최근 제출 원문에 표시됐다. 이 영역은 응답 대기 중에도 표시된다. | PASS |
| MT-O100-02 | O-100 | 제품 UI | 공백, 줄바꿈, 한글, 일본어, 한자, 이모지가 제출 원문에 보존됐다. | PASS |
| MT-O100-03 | O-100 | 제품 UI | 제출 후 입력창을 편집해도 기존 제출 원문이 유지됐다. | PASS |
| MT-O101-01 | O-101 | 실제 Core | received 응답 구조, ID 및 receivedText와 rawText의 일치 확인 후 최종 정상 수신을 표시했다. | PASS |
| MT-O101-02 | O-101 | 수신 원문 변조 | 제출 원문과 다른 receivedText에 RESPONSE_TEXT_MISMATCH를 표시했다. 비교 시 공백·줄바꿈·Unicode를 정규화하지 않는다. | PASS |
| MT-O101-03 | O-101 | FE 완료 3초 지연 | 대기 중에는 대기 안내만 표시했고 유효한 응답 완료 후 정상 수신을 표시했다. | PASS |
| MT-O102-01 | O-102 | 제품 입력 UI | 빈 입력, 공백·특수문자·이모지만 있는 입력, 이모지 안에만 숫자가 있는 입력을 FE에서 차단했다. 이모지 밖에 Unicode Letter 또는 Number를 포함한 유효한 입력은 제출할 수 있었다. | PASS |
| MT-O102-02 | O-102 | QA 입력 → 실제 Core | Rust가 반환한 INVALID_INPUT과 거부 사유를 화면에서 확인했다. | PASS |
| MT-O102-03 | O-102 | 거부 응답 주입 | 유효한 rejected 응답에 넣은 INPUT_TOO_LONG 및 INVALID_REQUEST_ID의 코드와 사유를 확인했다. | PASS |
| MT-O103-01 | O-103 | 미등록 Command 호출 | IPC_ERROR 및 수신 여부 미확인 안내를 확인했다. | PASS |
| MT-O103-02 | O-103 | FE 완료 15초 지연 | 약 10초 후 RESPONSE_UNCONFIRMED가 표시됐고 새 요청을 정상 제출할 수 있었다. | PASS |
| MT-O103-03 | O-103 | 오류 주입 후 정상 제출 | RESPONSE_INVALID 이후 새 requestId로 제출한 요청에 정상 수신 결과가 표시됐다. | PASS |

사용자 보고 총 21건, PASS 21건, FAIL 0건, 미완료·미검증 보고 0건이다. 기능별 건수는 O-000 6건, O-001 3건, O-100 3건, O-101 3건, O-102 3건, O-103 3건이다.

### 관찰 근거와 검증 한계

- 정상 왕복에서는 실제 Rust Core의 응답을 사용했다. T의 received는 원시 응답을 O에 전달하는 중간 상태다. O가 구조·ID·원문을 모두 검사해야 최종 수신을 확정한다. 제출 원문 표시는 제출 시점의 UI 기록이며, FE에서 차단한 입력에는 Core 거부 결과가 생기지 않는다.
- 거부 검증에서 실제 Rust 응답으로 관찰한 코드는 INVALID_INPUT이다. 나머지 두 거부 코드와 잘못된 스키마·ID·원문은 O의 판정 및 표시를 확인하기 위해 FE에서 주입했다. IPC_ERROR는 개발용 미등록 Command 호출로 재현했다.
- 3초·15초 지연은 FE가 응답 완료를 처리하는 시점에 적용했다. 실제 Rust 장시간 처리, 운영 통신 장애, 네트워크 문제는 이번 검증 범위 밖이다.

### QA 임시 코드 원복 · Codex 소스 검수

`src/features/user-input/hooks/useTransmission.ts` 전체를 읽고 HEAD와 대조했다. 변경 차이는 없으며 outputQaResponse(), QA-O-* 분기, 미등록 Command 호출, requestForCore 무효 입력 주입, 3초·15초 지연, [O-QA] 로그가 남아 있지 않다. 실제 호출은 `invoke("receive_user_input", { request })`이다. sending 상태와 중복 제출 차단, 10,000ms 제한, received/rejected/error/unconfirmed 분류를 확인했다. 완료 시 현재 요청과 pending을 대조하므로 종료된 요청의 지연 응답은 새 요청을 덮어쓰지 않는다.

## QA 원복 후 최종 자동 검사 · Codex 직접 실행

2026-11-10 같은 브랜치에서 위 ‘구현 당시 자동 검증 기록’ 표의 명령 중 전체 FE 테스트, 테스트 포함 TypeScript 검사, 빌드, Rustfmt, Clippy, Rust 테스트, git diff --check를 다시 실행했다. pnpm과 cargo에는 동일한 프로젝트 개발 환경 스크립트를 사용했다.

| 검사 | 최종 결과 |
| --- | --- |
| pnpm test | 9개 파일, 245건 통과, 실패 0건. O 테스트 56건 포함 |
| pnpm exec tsc --noEmit -p tsconfig.test.json | 통과 |
| pnpm build | TypeScript 및 Vite 빌드 통과 |
| cargo fmt / cargo clippy | 포맷 검사 및 모든 대상 경고 오류 처리 검사 통과 |
| cargo test | 라이브러리 5건과 IPC 통합 1건 통과, 실패 0건 |
| git diff --check | 추적 파일 공백 검사 통과. 미추적 보고서는 별도로 검증 ID 21개 고유성 및 행 끝 공백 검사 |

### 후속 확인과 커밋 준비

실제 Windows 앱에서 입력부터 Rust Core 왕복 및 O 정상 표시까지는 사용자 보고로 확인했다. 전체 PoC 릴리스 후보에서 같은 경로를 재현하면 통합 버전의 E2E 기록으로 남길 수 있다. 커밋·PR 준비 시 미추적 상태인 O 보고서와 구현·테스트 파일을 포함하고, 별도 VS Code MCP 문서와 스크립트는 대상에서 구분한다.

### 후속 수동 검증 및 End-to-End 확인 항목

아래 항목은 사용자 수동 검증 21건의 집계에서 제외한다.

| 후속 확인 항목 | 검증 목적 | 현재 상태 |
| --- | --- | --- |
| Light/Dark 테마 | 두 테마에서 제출 원문과 결과 안내를 읽을 수 있는지 확인 | 별도 수동 확인 필요 |
| 긴 문자열 줄바꿈 | 공백 없이 긴 원문이 결과 영역 안에서 줄바꿈되는지 확인 | 별도 수동 확인 필요 |
| UTF-8 8,192바이트 | 내용 조건을 충족하는 원문이 허용 경계에서 정상 제출되는지 확인 | 별도 수동 확인 필요 |
| UTF-8 8,193바이트 | 유효한 글자를 포함해도 크기 초과로 FE에서 차단되고 안내가 표시되는지 확인 | 별도 수동 확인 필요 |
| 전체 PoC End-to-End | I 입력 → D 요청 생성 → T IPC → 실제 R 수신 → O 정상 수신 표시를 한 번에 확인 | 릴리스 후보에서 재확인 권장 |

FE는 `TextEncoder`의 `encode(value).byteLength`로 UTF-8 바이트 수를 측정한다. 8,192바이트 이하는 길이 조건을 충족하고, 8,193바이트 이상은 길이 초과다. 길이 조건을 충족해도 유효한 유니코드 텍스트와 이모지 밖의 글자 또는 숫자가 필요하다. 기존 자동화 테스트 DT-036~DT-039는 ASCII와 다중 바이트 입력의 두 경계를 다룬다. 위 표의 경계 항목은 Windows 앱에서의 수동 확인을 뜻한다.
