# User Input PoC · 채팅형 출력 UI 구현 및 검증

## 화면과 상태 관리

기존 화면은 최신 제출 한 건의 원문과 처리 결과를 보여 줬다. 채팅 화면은 제출 순서대로 오른쪽에 사용자 원문을, 그 아래 왼쪽에 Rust Core의 수신 결과를 표시한다. 대화가 비었을 때는 기존 시작 화면을 사용한다. 작성 영역은 스크롤되는 기록 아래에 둔다. 제출 직후 편집기로 포커스를 돌리고 제출한 텍스트를 선택해 다음 입력으로 교체하거나 수정할 수 있게 했다. 기존 줄바꿈 및 버튼 제출 정책을 유지한다.

| 파일 | 역할 |
| --- | --- |
| src/pages/MainPage.tsx | 메모리에 보관한 종료 기록 뒤에 현재 전송 중인 요청을 표시한다. |
| src/features/user-input/hooks/useTransmission.ts | 기존 요청 잠금, IPC 호출, 종료 시각과 요청 격리를 사용한다. 해당 요청의 종료가 확정됐을 때 선택적 콜백으로 한 번 전달한다. |
| src/features/user-input/chatEntry.ts | 제출 당시 request와 검증된 화면 상태·안내 문구를 묶는다. 원시 응답은 기존 validateCoreResponse로 검사한다. |
| src/features/user-input/components/ChatConversation.tsx | 순서 있는 목록을 requestId로 렌더링한다. 목록 하단을 보고 있으면 최신 출력으로 이동하고, 위로 스크롤하면 읽던 위치를 유지한다. |
| src/features/user-input/components/SubmissionResult.tsx | 요청당 사용자·Core 말풍선 한 쌍, 발화자, 상태 문구 및 제출 글자·줄 수를 표시한다. 최신 상태는 보조 기술에 알린다. |
| src/features/user-input/components/UserInputForm.tsx | 제출 후 편집 포커스와 선택 범위를 설정한다. 기존 오류 설명과 버튼 비활성화를 유지한다. |
| src/styles/global.css | 짙은 파란 사용자 말풍선과 테마에 맞는 중립색 Core 말풍선, 긴 원문 줄바꿈, 독립적인 세로 스크롤을 정의한다. |
| tests/chat-ui.test.tsx | CHAT-01~18 화면·요청 수명주기 회귀 검증을 담당한다. |

I/D가 유효 입력에 UUID v4를 부여하면 T가 기존 receive_user_input Command를 호출한다. 대기 중에는 해당 ID로 원문과 대기 안내를 표시한다. 완료 시 T가 보존한 요청으로 O가 응답 스키마 → ID → 원문 순서로 검증한다. React는 같은 요청 ID를 key로 사용해 기존 말풍선을 갱신한다. 시간 초과된 요청의 지연 완료는 T에서 무시하므로 기록에 다시 추가되지 않는다. 종료 기록은 화면이 마운트된 동안만 유지한다.

| Core 말풍선 상태 | 판정과 안내 |
| --- | --- |
| 대기 | IPC 진행 중이며 Core 응답을 기다리는 중 |
| 정상 수신 | 제출 ID와 원문이 모두 일치하는 received 응답 확인 |
| 거부 | 검증된 rejected 응답의 한국어 사유, 오류 코드 및 Core 메시지 |
| 응답 검증 오류 | RESPONSE_INVALID, RESPONSE_MISMATCH, RESPONSE_TEXT_MISMATCH 중 첫 실패 |
| 통신 오류 / 시간 초과 | IPC_ERROR 또는 10초 경과 RESPONSE_UNCONFIRMED와 수신 여부 미확인 안내 |

## 자동 검증

프로젝트 루트에서 pnpm 및 cargo는 `.\scripts\dev-env.cmd`를 통해 실행했다.

| 검사 | 실행 결과 |
| --- | --- |
| pnpm test | 10개 파일 263/263 통과. 신규 18건, 기존 245건, 실패 0건 |
| pnpm exec tsc --noEmit -p tsconfig.test.json | 통과 |
| pnpm build | TypeScript 및 Vite 배포 빌드 통과 |
| cargo fmt --manifest-path src-tauri/Cargo.toml --check | 통과 |
| cargo clippy --locked --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings | 통과 |
| cargo test --locked --manifest-path src-tauri/Cargo.toml | 라이브러리 5건 및 IPC 통합 1건 통과 |
| git diff --check | 추적 파일 공백 검사 통과 |

| 신규 테스트 | 확인 내용 |
| --- | --- |
| CHAT-01~04 | 사용자 및 대기 말풍선, 제출 후 포커스, 동일 DOM에서 정상 수신 갱신, 같은 텍스트의 별도 요청 누적 |
| CHAT-05~10 | ID·원문·스키마 오류, 거부 코드와 사유, IPC 실패, 10초 경계 |
| CHAT-11~15 | 늦은 A 완료와 B 격리, 편집과 원문 독립, 공백·Unicode 보존, 중복 제출 방지, 오류 이력 유지와 재제출 |
| CHAT-16~18 | 무효 입력 차단, HTML의 안전한 텍스트 표시, 제출 순서 및 기존 DOM 노드 유지 |

## Windows Tauri 확인 절차와 결과

`.\scripts\dev-env.cmd pnpm tauri dev --config .cache/tauri.local.json`으로 개발 앱을 실행한다. 다음 정상 경로는 실제 Windows WebView에서 입력과 클릭을 자동 조작해 확인했다. 사용자 수행 수동 PASS로 집계하지 않았다.

1. 한글, 이모지, 줄바꿈, 앞뒤 공백이 있는 요청을 보낸다. 실제 Core 응답이 정상 수신으로 바뀌고 원문이 그대로 유지됨을 확인했다.
2. 두 번째 요청을 보내고 두 쌍의 말풍선과 각 정상 결과를 확인한다. 사용자 말풍선이 오른쪽, Core 결과가 왼쪽에 있는지 실제 요소 좌표로 대조했다. 제출 후 편집기 포커스와 텍스트 선택도 확인했다.
3. Light/Dark를 전환하고 긴 영문 입력을 제출한다. 테마가 전환됐고, 390px 폭에서 페이지와 대화 영역에 가로 넘침이 없으며 하단 입력창이 화면 안에 유지됐다.
4. 기록을 위로 스크롤하고 새 요청을 보낸다. 새 결과 도착 후에도 읽던 위치가 유지됐다.
5. 오류·거부·시간 초과의 실제 데스크톱 화면은 별도 수동 확인 대상이다. 제어 가능한 QA 환경에서 오류 응답 또는 10초 이상의 완료 지연을 재현하고, 해당 말풍선만 갱신되며 다음 요청 후에도 앞 기록이 유지되는지 확인한다. 이번 자동 테스트는 IPC Mock과 가상 타이머로 이 경로를 검증했다.

## 범위와 후속 확인

메모리와 DOM에 대화가 누적되고 화면을 다시 마운트하면 이력이 비워진다. 장시간 세션의 최대 기록 수와 보조 기술의 실제 낭독 경험은 별도 검증 대상이다. 향후 AI 응답을 도입할 때 요청 ID 기반 대화 묶음과 스크롤 영역을 재사용할 수 있다. 현재 왼쪽 말풍선의 성공 의미는 Rust Core의 원문 수신 확인이다.
