# User Input PoC

## 목표
사용자 → Frontend → Rust Core → Frontend → 사용자 흐름에서 사용자의 자연어 원문을 Core가 실제로 수신했는지 검증합니다.

## 현재 단계
프로젝트 및 공통 개발 환경 초기화. 최소 안내 화면만 구현했습니다.
실제 사용자 입력, 제출, Core 수신 및 응답 검증은 **미구현**입니다.

## 향후 PoC 구현 범위
- I-000~I-102: 사용자 입력 UI
- D-000~D-100: 입력 상태, 원문 보존, 입력 검증
- FE 내부 transport 추상화 및 Mock Gateway
- 합의 후 실제 Core IPC 연결과 수신 검증

세부 ID의 정의는 아래 명세서를 기준으로 팀과 확인합니다. 이번 초기화 과정에서 명세서의 세부 내용을 읽거나 기능 완료 여부를 판단하지 않았습니다.

참조 상세기능 명세서:
https://docs.google.com/spreadsheets/d/1c5geYDtLm2X5B9cZzp-b03OnzviUmuezXJ3GdCrov_I/edit

## 제외 범위
Agent/LLM 호출, LangGraph Workflow, SQLite, Stronghold, 인증, CI/CD 배포, 원격 저장소 생성/Push.
FE–Core Command 이름과 요청·응답·오류 형식은 미확정이며 초기화 작업에서 결정하지 않습니다.
