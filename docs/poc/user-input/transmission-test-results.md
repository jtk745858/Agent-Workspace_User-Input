# User Input PoC · T 전송 검증 결과

2026-11-09 · Windows

작업 브랜치: feat/user-input-transmission

구현 기준 커밋: eb5f9c0 (R 구현 커밋이자 T 작업의 출발점)

## 근거와 변경 범위

[상세 명세](https://docs.google.com/spreadsheets/d/1c5geYDtLm2X5B9cZzp-b03OnzviUmuezXJ3GdCrov_I/edit)의 I/D/T/R/O와 T의 3개 주기능·10개 상세기능, [API 계약 v0.2](https://docs.google.com/spreadsheets/d/1cCvW75jHMKFOgNA5l3kssnQoURdGGD5wj9vMIR8Stao/edit)의 송수신 형식·대기·오류 규칙을 확인했다. 로컬 fe-core-api-contract.md는 v0.1 Draft여서 통신 규칙은 온라인 v0.2를 적용했다. [GitBook 개요](https://cprtmchzh.gitbook.io/orchestration)에서 제품 목표를 확인했다. 온라인 기술 하위 페이지 본문은 조회되지 않아 React→Rust Command 경계는 기존 기획서 기술 사본과 프로젝트 코드에서 확인했다.

T 최초 구현은 R 커밋 `eb5f9c0` 위에서 시작했다. 이후 만든 `feat/user-input-transmission`의 생성 reflog와 현재 HEAD도 `eb5f9c0`이며, T 변경은 작업 트리에 있다. 로컬 `main`과의 공통 조상은 `894822e`다. 원격 `main`은 R을 PR #4로 병합한 `91d4b12`이며 로컬 `main`보다 두 커밋 앞선다. 원격 병합 커밋과 R 커밋의 파일 트리는 동일하다. 이번 재검사에서도 브랜치 전환은 없었다.

| 변경 파일 | 역할 |
|---|---|
| src/features/user-input/hooks/useTransmission.ts | Tauri invoke, 요청별 상태, 잠금·기한 및 O가 사용할 원시 결과 |
| src/pages/MainPage.tsx | D의 onRequest를 send에 연결하고 기존 FE 확인 및 대기·오류 문구 표시 |
| src/features/user-input/components/UserInputRequestForm.tsx | 대기 중 다시 제출된 폼의 요청 생성을 차단 |
| src/features/user-input/components/UserInputForm.tsx | 입력 유효성과 전송 상태로 버튼 disabled를 파생 |
| tests/transmission.test.tsx | 모의 IPC, 제어 가능한 Promise, 가상 시계 및 폼 통합 검증 |
| docs/poc/user-input/transmission-test-results.md | 이 보고서 |

## 동작과 책임 경계

D에서 만든 동일 객체를 invoke("receive_user_input", { request })에 전달한다. 입력창은 편집 가능하며 응답은 제출 당시 객체와 연결된다. idle에서 sending으로 전이하며, 동기식 ref 잠금으로 React의 다음 렌더 전에도 추가 호출을 막는다. 호출 직전 단조 시계로 10,000ms 기한을 설정한다. 타이머와 Promise가 경합하면 요청별 토큰으로 첫 종료만 반영하며, 콜백 실행이 지연된 경우에도 기한을 다시 검사한다. 종료·언마운트 시 타이머와 잠금을 정리한다.

T는 IPC 호출, 응답 대기, 원시 응답 확보, 기술 오류와 시간 초과 처리를 담당한다. Promise가 resolve되면 원래 `request`와 `response: unknown`을 함께 보관한다. 원시 응답의 태그가 `rejected`이면 전송 상태를 `rejected`로, 나머지는 `received`로 기록한다. 이 `received`는 응답을 확보했다는 전송 계층의 중간 판정이다. 최종 Core 정상 수신 표시는 O의 검증을 거쳐야 한다. 기술적 호출 실패는 `error / IPC_ERROR`, 시간 초과는 `unconfirmed / RESPONSE_UNCONFIRMED`로 처리한다. 일반 로그에는 입력·응답·오류 원문을 쓰지 않는다.

## 검증 단계별 기록

| 시점 | 수행 주체 | 방법 | 결과 |
|---|---|---|---|
| T 최초 구현 당시 | Codex | 자동화 테스트와 빌드 | FE 189/189, Rust 6/6 통과. 타입·빌드·포맷·Clippy 통과 |
| 구현 후 수동 검증 | 사용자 | Windows Tauri 앱과 DevTools로 직접 검증 | 16/16 PASS, FAIL 0, 미검증 0 |
| 임시 코드 원복 확인 후 최종 재검사 | Codex | 현재 작업 트리에서 자동화 및 Git 검사 재실행 | FE 189/189, Rust 6/6 통과. 아래 명령별 결과 참조 |

## 최초 자동화 검증 · 필수 테스트 추적

| ID | 확인 내용 | 결과 |
|---|---|---|
| MT-T000-01 | IPC 연결 | PASS |
| MT-T001-01 | 등록된 Command 이름 | PASS |
| MT-T001-02 | 최상위 request 인수와 내부 두 필드 | PASS |
| MT-T100-01 | 공백·CRLF·분해형 문자·이모지 원문 보존 | PASS |
| MT-T100-02 | D가 부여한 ID 유지 | PASS |
| MT-T101-01 | Promise 대기 중 sending 유지 | PASS |
| MT-T102-01 | 정상 resolve와 요청 연결 | PASS |
| MT-T102-02 | Core 거부 resolve 구분 | PASS |
| MT-T200-01 | 요청 시작·대기·종료 상태 | PASS |
| MT-T201-01 | 동일 프레임 연속 호출 및 대기 중 폼 직접 제출 차단 | PASS |
| MT-T202-01 | Promise rejection 분류 | PASS |
| MT-T202-02 | Command·인수 오류 분류 | PASS |
| MT-T203-01 | 9,999ms 대기·10,000ms 종료 | PASS |
| MT-T203-02 | 늦은 resolve/reject 무시 | PASS |
| MT-T204-01 | 네 종료 경로 잠금 해제·편집값 재제출 | PASS |
| MT-T204-02 | 타임아웃 후 새 ID 발급·새 요청 격리 | PASS |

16개 ID를 신규 테스트 20건에 매핑했다. 추가로 호출의 동기 예외, 마감 직전 응답, 마감 후 타이머 실행이 밀린 경우, 새 요청 전의 지연 응답, 언마운트와 잘못된 원시 응답을 검사했다.

## 구현 당시 실행 기록

프로젝트 루트의 scripts/dev-env.cmd로 실행했다.

```powershell
pnpm exec tsc --noEmit -p tsconfig.test.json
pnpm test --reporter=default --reporter=json --outputFile.json=.cache/transmission-vitest.json
pnpm build
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo clippy --locked --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --locked --manifest-path src-tauri/Cargo.toml
pnpm tauri dev --config .cache/tauri.local.json
```

FE 189/189 통과(기존 169, 신규 20). 타입 검사·Vite 프로덕션 빌드 성공. Rust 6/6 통과(단위 5건, Tauri 등록 경로 통합 1건). 최종 테스트 실패·건너뜀 0건. rustfmt와 전체 타깃 Clippy도 경고 없이 통과했다.

## 구현 당시 실제 데스크톱 왕복

Windows Tauri 개발 앱의 입력 폼에서 앞뒤 공백·한글·분해형 문자·이모지·줄바꿈을 포함한 테스트 문자열을 제출했다. 실제 invoke가 반환된 지점에서 status=received, 응답 ID와 제출 ID 일치, receivedText와 제출 원문 일치, 키 3개, 제출 버튼 복구를 확인했다. 처음에는 디버거가 변환된 소스 줄을 찾지 못해 관측 지점을 수정하고 다시 실행했다. 제품 코드에는 디버깅용 로그나 우회 경로를 추가하지 않았다.

무효 입력은 폼이 먼저 차단하므로 별도로 같은 WebView에서 실제 Command에 통제된 무효 입력을 호출했다. rejected/INVALID_INPUT과 동일 ID 반환을 확인했다. 운영체제에서 실제 장애나 10초 지연을 유발하지 않았으며 타이밍·기술 오류 경로는 자동화에서 재현했다.

## 수동 검증 환경 및 결과 (사용자 수행)

사용자가 Windows Tauri 개발 앱과 DevTools Console에서 직접 수행하고 최종 보고한 결과다. 총 16건 중 PASS 16건, FAIL 0건, 미검증 0건이다.

| 검증 ID | 기능 ID | 확인 내용 | 사용자 보고 결과 |
|---|---|---|---|
| MT-T000-01 | T-000 | 실제 Tauri IPC 연결 | PASS |
| MT-T001-01 | T-001 | Frontend에서 Rust Core Command 호출 | PASS |
| MT-T001-02 | T-001 | 최상위 request와 내부 DTO 인수 구조 확인 | PASS |
| MT-T100-01 | T-100 | 제출 원문과 반환 원문 일치 | PASS |
| MT-T100-02 | T-100 | 제출 ID와 응답 ID 일치 | PASS |
| MT-T101-01 | T-101 | 응답 대기 중 sending 유지 | PASS |
| MT-T102-01 | T-102 | Core의 received 응답 수신 | PASS |
| MT-T102-02 | T-102 | Core의 rejected 응답 수신 | PASS |
| MT-T200-01 | T-200 | idle → sending → received 전이 | PASS |
| MT-T201-01 | T-201 | 전송 중 반복 제출 시 추가 IPC 호출 차단 | PASS |
| MT-T202-01 | T-202 | 존재하지 않는 Command 호출 시 IPC_ERROR | PASS |
| MT-T202-02 | T-202 | 추가 필드가 있는 DTO 전달 시 IPC_ERROR | PASS |
| MT-T203-01 | T-203 | 10,000ms 응답 대기 제한 처리 | PASS |
| MT-T203-02 | T-203 | 타임아웃 이후 이전 요청의 늦은 완료 무시 | PASS |
| MT-T204-01 | T-204 | 종료 후 잠금 해제 및 정상 재제출 | PASS |
| MT-T204-02 | T-204 | 타임아웃 후 새 요청 제출 | PASS |

### 관찰 근거 및 검증 범위

- **실제 IPC와 원문 보존.** DevTools에서 `invoke("receive_user_input", { request: { requestId, rawText } })`를 직접 호출해 `received`를 받았다. 이어 앱 입력 폼으로 제출하고 `useTransmission.ts`의 IPC 호출 지점에 중단점을 두어 제출 이벤트 → D 요청 생성 → `useTransmission.send()` → Tauri IPC → Rust Core 경로를 확인했다. 제출값과 반환값의 비교 결과는 `sameId: true`, `sameText: true`, `status: "received"`였다.
- **대기와 중복 제출.** FE의 응답 완료 처리를 약 3초 지연시켰을 때 `idle → sending → received`로 전이했다. 대기 중 반복 제출해도 IPC 호출 횟수는 증가하지 않았고, 완료 후 새 요청을 제출할 수 있었다.
- **기술 오류와 복구.** 존재하지 않는 Command 호출과 허용되지 않은 DTO 필드 추가를 각각 주입했다. 두 경우 모두 `sending → error / IPC_ERROR`가 관찰됐고, 이후 정상 요청을 다시 제출해 `received`를 확인했다.
- **타임아웃과 요청 격리.** 요청 A의 FE 응답 완료 처리를 15초 지연시켰다. A는 약 10초에 `sending → unconfirmed / RESPONSE_UNCONFIRMED`로 종료됐다. 이후 제출한 B는 `received`로 완료됐고, 15초 시점에 A의 처리가 끝나도 B의 상태는 유지됐다. 이 시험이 검증한 범위는 FE의 대기 종료와 늦은 완료 무시다. 실제 Rust Command의 장시간 처리와 네트워크 장애는 재현하지 않았다.
- **Core 입력 거부.** D 검증을 우회해 테스트용 무효 입력 `!!!`을 주입했다. Core는 동일 요청 ID와 `rejected / INVALID_INPUT`을 반환했고, FE는 이를 기술 오류 `IPC_ERROR`로 분류하지 않았다.

### 임시 코드 원복 및 최종 검사

Codex가 최종 재검사 전에 `src/features/user-input/hooks/useTransmission.ts` 전문을 읽고 관련 제품 코드도 검색했다. 상태·호출 횟수 Console 출력, 3초·15초 지연, 잘못된 Command 호출, DTO 추가 필드와 무효 입력 강제 주입은 발견되지 않았다. 실제 `invoke("receive_user_input", { request })` 호출과 정상 10,000ms 타임아웃을 확인했다.

다음은 2026-11-09 Windows에서 임시 코드 원복 확인 후 Codex가 실행한 결과다. FE·Rust 명령은 프로젝트 루트에서 `scripts/dev-env.cmd`를 통해 실행했다.

| 실행 명령 | 최종 결과 |
|---|---|
| `pnpm test` | PASS · 7개 파일, 189건 통과, 실패·건너뜀 0건 |
| `pnpm exec tsc --noEmit -p tsconfig.test.json` | PASS · 테스트 포함 타입 검사 |
| `pnpm build` | PASS · TypeScript 컴파일 및 Vite 프로덕션 빌드 |
| `cargo fmt --manifest-path src-tauri/Cargo.toml --check` | PASS |
| `cargo clippy --locked --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings` | PASS |
| `cargo test --locked --manifest-path src-tauri/Cargo.toml` | PASS · 단위 5건과 Tauri 등록 경로 통합 1건 통과, 실패·무시 0건 |
| `git diff --check` | PASS · 공백 오류 없음. 미추적 보고서도 별도 검사 |
| `git status` | 현재 T 브랜치 확인. 보고서는 미추적, 스테이징된 파일 없음 |

## 후속 O 연동

O는 원래 요청을 기준으로 원시 응답을 검증한다. 상태별 폐쇄형 스키마 위반은 `RESPONSE_INVALID`, `requestId` 불일치는 `RESPONSE_MISMATCH`, 정상 수신 응답의 `receivedText`와 제출 당시 `rawText` 불일치는 `RESPONSE_TEXT_MISMATCH`로 판정한다. O가 이 검사들을 마친 뒤 운영 화면에 최종 수신 결과를 표시한다. 수동 재확인은 개발 앱에서 유효한 문자열을 제출하고 편집 후 재제출하는 순서로 진행하며, ID와 원문은 `useTransmission`의 invoke 직후 중단점에서 확인할 수 있다.
