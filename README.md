# Office Tool

## 한 줄 소개

오피스 문서에 바로 붙여넣기 좋은 구조형 시각화 이미지를 만드는 프론트엔드 웹앱입니다.

## 문제 정의

- 실무자는 일정표, 조직도, 흐름도 같은 구조형 시각화를 문서와 발표 자료에 자주 붙여 넣어야 합니다.
- 엑셀이나 범용 문서 도구로 이런 이미지를 빠르게 만들기는 번거롭습니다.
- 이 프로젝트는 구조 데이터를 입력하면 문서 친화적인 시각화 결과를 빠르게 만드는 것을 목표로 합니다.

## 목표

- 프론트엔드 중심으로 실행 가능한 웹앱을 만든다.
- 홈 허브에서 여러 시각화 도구로 확장할 수 있는 구조를 둔다.
- 첫 실제 도구는 기본 간트 차트로 시작한다.

## 비목표

- 실행 시 외부 AI/LLM/API 기능
- 백엔드, 로그인, 협업, 클라우드 저장, 결제
- 고급 drag/drop 편집기
- 전체 MVP 기능을 실행 골격 단계에서 한 번에 구현하는 것

## 대상 사용자

- 1차 타겟: 기획자, PM, 개발 리드 등 실무 직장인
- 대표 사용 시나리오: 작업 일정이나 구조를 입력하고 PNG 등 문서용 이미지로 저장해 보고서/PPT에 붙여 넣는다.

## 현재 범위

- 구현됨: Next.js App Router, TypeScript, 홈 허브, 간트 에디터, 마인드맵 에디터, tool registry
- 간트 MVP: 타입 선택, 날짜 단위/표시 범위 선택, Frappe Gantt preview, task 추가/수정/삭제, validation, PNG export, opt-in debug mode
- 마인드맵 MVP: Mind Elixir preview, 계층 outline 편집, 색상 선택 dialog, PNG export, opt-in debug mode
- 이후 확장: 담당자별, baseline, critical path 간트 타입과 다른 구조형 도구

## 기술 개요

- 프론트엔드: Next.js App Router, React, TypeScript
- 백엔드: 없음
- 저장소/배포: 단일 repo, Vercel 정적 배포를 고려한 구조

## 로컬 실행

```bash
npm install
npm run dev
```

## 검증 명령

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## 문서 지도

- `AGENTS.md`: Codex 작업 규칙
- `docs/project/PROJECT_BRIEF.md`: 제품/범위 요약
- `docs/project/DECISIONS.md`: 확정된 결정
- `docs/project/BACKLOG.md`: 후보 아이디어
- `docs/product/UIUX_SPEC.md`: 화면/상호작용 규칙
- `docs/engineering/TESTING.md`: 검증 기준
- `docs/engineering/PLANS.md`: 큰 작업용 실행 계획 템플릿
- `docs/adr/`: 주요 기술/제품 결정 기록

## 운영 원칙

- 결정되지 않은 기능은 바로 구현하지 않는다.
- 테스트 기준 없는 변경은 완료로 취급하지 않는다.
- 새 기능은 범위/가치/리스크를 먼저 정리한다.
