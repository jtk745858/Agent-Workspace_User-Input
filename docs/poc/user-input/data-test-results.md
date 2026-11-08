# User Input PoC · D 영역 검증 결과

2026-11-09 · Windows x64 · feat/user-input-data · 기준 origin/main 4b07e88

## 범위와 판단 근거

제출 순간의 문자열을 검증해 FE 콜백에 요청 객체를 전달하는 범위다. Input과 Workspace가 통합된 main에서 분기했다. [상세 명세](https://docs.google.com/spreadsheets/d/1c5geYDtLm2X5B9cZzp-b03OnzviUmuezXJ3GdCrov_I/edit)의 D-000~D-102와 [API v0.2](https://docs.google.com/spreadsheets/d/1cCvW75jHMKFOgNA5l3kssnQoURdGGD5wj9vMIR8Stao/edit)의 DTO·검증 순서·공통 예제를 확인했다. 로컬 v0.1 초안에서는 길이와 Unicode 정책이 미확정이어서 구현에는 확정된 v0.2를 적용했다. [GitBook 개요](https://cprtmchzh.gitbook.io/orchestration)에서 전체 제품 목표를 확인했다. 기술 스택과 React→Rust Command 경계는 기획서의 로컬 기술 문서 사본에서 확인했고 온라인 하위 페이지의 최신성은 확인하지 못했다.

## 환경과 실행

Node 22.23.4, pnpm 10.34.9, React 19.2.9, TypeScript 5.9.3, Vitest 5.1.0, jsdom 31.0.0, Vite 8.3.6. 프로젝트 루트에서 실행했다.

```powershell
.\scripts\dev-env.cmd pnpm exec tsc --noEmit -p tsconfig.test.json
.\scripts\dev-env.cmd pnpm test --reporter=default --reporter=json --outputFile.json=.cache/data-vitest.json
.\scripts\dev-env.cmd pnpm build
.\scripts\dev-env.cmd pnpm tauri dev --config .cache/tauri.local.json
```

## 기능별 구현과 결과

| 기능 | 기존 → 현재 | 테스트 | 결과 | 구현 파일 |
|---|---|---|---|---|
| D-000 현재 상태 | 구현 완료 → 기존 controlled textarea와 단일 React 상태 재사용 | DT-001~005 | 5/5 | useUserInput.ts, UserInputForm.tsx |
| D-001 제출 시점 | 부분 구현 → 기존 동기 제출 문자열을 독립된 요청으로 확정 | DT-006~009 | 4/4 | useUserInput.ts, UserInputRequestForm.tsx |
| D-002 원문 | 부분 구현 → DTO까지 동일 문자열 유지 | DT-010~015 | 6/6 | userInputRequest.ts |
| D-100 유효성 | 부분 구현 → Unicode 판정, 고립 surrogate 및 UTF-8 상한 검증 | DT-016~042 | 27/27 | isValidUserInput.ts |
| D-102 요청 ID | 미구현 → 검증 후 crypto.randomUUID() 호출 | DT-043~047 | 5/5 | userInputRequest.ts |
| D-101 DTO | 미구현 → requestId·rawText 두 필드와 onRequest 콜백 | DT-048~053 | 6/6 | userInputRequest.ts, UserInputRequestForm.tsx, MainPage.tsx |

입력 검증과 DTO 생성 경계에서 같은 함수를 호출한다. 유효한 제출마다 새 객체와 ID를 발급하고 편집 중인 값과 기존 요청을 별도로 보관할 중복 상태는 두지 않는다. CRLF는 문자열이 Data 처리부에 도달하는 시점부터 그대로 유지된다. HTML textarea가 자체적으로 LF로 제공한 줄바꿈의 원래 파일 형식은 복원할 수 없다. DT-012는 CRLF를 직접 DTO 생성 함수에 전달해 검증했다.

## Unicode와 길이

고립 surrogate를 UTF-8 인코딩 전에 검출하고 TextEncoder의 바이트 수를 검사한다. 8,192바이트까지 허용한 뒤 Intl.Segmenter의 확장 그래핌 단위에서 이모지 시퀀스 밖의 Letter·Number를 찾는다. Node의 Unicode는 17.0, ICU는 78.3이다. [공식 Emoji 17.0 테스트 데이터](https://www.unicode.org/Public/17.0.0/emoji/emoji-test.txt)에서 Letter·Number가 있는 항목은 숫자 키캡의 두 표기와 ℹ의 두 표기 총 22개였다. 이 부분만 검사용 문자열에서 제외한다. 공식 5,225개 각각에 대해 단독 입력 거부와 뒤에 A를 붙인 입력 허용을 제품 함수로 별도 실행해 10,450개 판정이 일치했다. 이 수치는 Vitest 합계와 별개다.

## 단위 및 통합 테스트

상태·요청 단위 테스트는 tests/user-input-data.test.ts, 실제 입력 폼을 조작하는 통합 테스트는 tests/input-data-integration.test.tsx에 있다. 아래 61개 ID는 실행된 Vitest JSON 결과와 대조했다.

| 테스트 ID | 테스트 조건 | 예상 결과 | 실제 결과 | 판정 |
|---|---|---|---|---|
| DT-001 | 빈 초기값 | 빈 값 | 빈 값 | PASS |
| DT-002 | 한글 입력 | 한글 상태 일치 | 한글 상태 일치 | PASS |
| DT-003 | 영문·숫자 입력 | 영문·숫자 상태 일치 | 영문·숫자 상태 일치 | PASS |
| DT-004 | 기존 값 수정 | 수정값 일치 | 수정값 일치 | PASS |
| DT-005 | 전체 삭제 | 빈 값 | 빈 값 | PASS |
| DT-006 | A 제출 | A 확보 | A 확보 | PASS |
| DT-007 | A 제출 후 B 편집 | A 유지 | A 유지 | PASS |
| DT-008 | A와 B 연속 제출 | 독립된 두 요청 | 독립된 두 요청 | PASS |
| DT-009 | 제출 직전 수정 | 최종 수정값 | 최종 수정값 | PASS |
| DT-010 | 앞뒤 공백 | 원문 일치 | 원문 일치 | PASS |
| DT-011 | LF | 원문 일치 | 원문 일치 | PASS |
| DT-012 | CRLF | 원문 일치 | 원문 일치 | PASS |
| DT-013 | 한글과 이모지 | 원문 일치 | 원문 일치 | PASS |
| DT-014 | 분해형 결합 문자 | 원문 일치 | 원문 일치 | PASS |
| DT-015 | 탭과 연속 공백 | 원문 일치 | 원문 일치 | PASS |
| DT-016 | "" | 무효 | 무효 | PASS |
| DT-017 | "   " | 무효 | 무효 | PASS |
| DT-018 | "\t\n\r" | 무효 | 무효 | PASS |
| DT-019 | "!@#$%" | 무효 | 무효 | PASS |
| DT-020 | "😀🔥👍" | 무효 | 무효 | PASS |
| DT-021 | "👨‍👩‍👧‍👦" | 무효 | 무효 | PASS |
| DT-022 | "🇰🇷" | 무효 | 무효 | PASS |
| DT-023 | "1️⃣" | 무효 | 무효 | PASS |
| DT-024 | "1⃣" | 무효 | 무효 | PASS |
| DT-025 | "😀!!!" | 무효 | 무효 | PASS |
| DT-026 | "안녕하세요" | 유효 | 유효 | PASS |
| DT-027 | "Hello" | 유효 | 유효 | PASS |
| DT-028 | "こんにちは" | 유효 | 유효 | PASS |
| DT-029 | "漢字" | 유효 | 유효 | PASS |
| DT-030 | "12345" | 유효 | 유효 | PASS |
| DT-031 | "1️⃣2" | 유효 | 유효 | PASS |
| DT-032 | "안녕하세요 😀" | 유효 | 유효 | PASS |
| DT-033 | "Hello!!!" | 유효 | 유효 | PASS |
| DT-034 | "가나다\nHello" | 유효 | 유효 | PASS |
| DT-035 | ASCII 8191B | 유효 | 유효 | PASS |
| DT-036 | ASCII 8192B | 유효 | 유효 | PASS |
| DT-037 | ASCII 8193B | 무효 | 무효 | PASS |
| DT-038 | 다바이트 8192B | 유효 | 유효 | PASS |
| DT-039 | 다바이트 8193B | 무효 | 무효 | PASS |
| DT-040 | 고립 high surrogate | 무효 | 무효 | PASS |
| DT-041 | 고립 low surrogate | 무효 | 무효 | PASS |
| DT-042 | 정상 surrogate pair | 유효 | 유효 | PASS |
| DT-043 | 유효 제출 | ID 발급 | ID 발급 | PASS |
| DT-044 | UUID 표기 | 소문자 UUID v4 | 소문자 UUID v4 | PASS |
| DT-045 | 연속 제출 | 서로 다른 ID | 서로 다른 ID | PASS |
| DT-046 | 무효 입력 | ID 미발급 | ID 미발급 | PASS |
| DT-047 | 동일 요청 재참조 | 동일 ID | 동일 ID | PASS |
| DT-048 | 정상 DTO | 두 필드 존재 | 두 필드 존재 | PASS |
| DT-049 | 필드 목록 | 정확히 두 필드 | 정확히 두 필드 | PASS |
| DT-050 | 공백 포함 | 원문 일치 | 원문 일치 | PASS |
| DT-051 | 줄바꿈 포함 | 원문 일치 | 원문 일치 | PASS |
| DT-052 | 무효 원문 | DTO 없음 | DTO 없음 | PASS |
| DT-053 | 연속 제출 | ID와 원문 연결 | ID와 원문 연결 | PASS |
| IT-001 | 유효 입력 클릭 | DTO 한 건 | DTO 한 건 | PASS |
| IT-002 | 공백 폼 직접 제출 | DTO 없음 | DTO 없음 | PASS |
| IT-003 | 수정 후 제출 | 수정값 일치 | 수정값 일치 | PASS |
| IT-004 | 제출 후 편집 | 첫 요청 불변 | 첫 요청 불변 | PASS |
| IT-005 | 동일 원문 두 번 제출 | 서로 다른 ID | 서로 다른 ID | PASS |
| IT-006 | 8193바이트 직접 제출 | DTO 없음 | DTO 없음 | PASS |
| IT-007 | 기호·이모지 직접 제출 | DTO 없음 | DTO 없음 | PASS |
| IT-008 | 유효↔무효 입력 전환 | 버튼 상태와 검증 일치 | 버튼 상태와 검증 일치 | PASS |

## 회귀·빌드와 실제 앱

기존 입력 폼 47건, 입력 검증 11건, Workspace 16건이 모두 통과했다. 신규 61건을 합해 5개 파일 135건 통과, 실패·미실행 0건이다. 테스트 포함 TypeScript 검사와 Vite 프로덕션 빌드도 성공했다. 별도의 lint 및 typecheck 패키지 스크립트는 없다.

Tauri 개발 WebView2(Edge 157)에서 secure context와 실제 crypto.randomUUID()의 소문자 UUID v4 형식을 확인했다. 800×600 및 480×360에서 무효 입력 차단, 문자 추가 후 버튼 포커스·클릭 및 FE 확인 표시를 확인했다. 가로 넘침이나 입력창과 버튼의 겹침은 없었다.

## 실패·수정 및 남은 검증

기존 코드에는 UTF-8 상한, 고립 surrogate 차단, 요청 ID와 DTO 생성이 없어 보완했다. 최종 자동화에 실패한 사례는 없다. 첫 창 크기 측정에서 800×600만 관찰돼 검증 창을 다시 열고 두 크기를 실제 뷰포트 값으로 확인했다. 실제 OS IME 재시험, 다른 WebView 버전의 Unicode 데이터, Rust 구현과의 공통 fixture 대조는 이번에 검증하지 않았다.

## 최종 판정과 다음 경계

D 기능 6개는 FE 범위에서 구현 및 검증 완료다. 이후 T는 onRequest가 받은 UserInputRequest를 receive_user_input의 request 인수로 전달한다. R은 요청 구조 → ID → UTF-8 길이 → Unicode 내용 순으로 독립 검증한다. 계약상 구조 오류는 IPC_ERROR, 이후 실패는 각각 INVALID_REQUEST_ID, INPUT_TOO_LONG, INVALID_INPUT에 해당한다. 현재 제품은 Core 응답을 표시하거나 원문을 로그에 남기지 않는다.
