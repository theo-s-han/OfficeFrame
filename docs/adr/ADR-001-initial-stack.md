# ADR-001: Initial Stack

## 상태
Accepted

## 날짜
2026-04-18

## 맥락
이 프로젝트는 오피스 문서용 시각화 웹앱이며, 초기에는 백엔드 없이 프론트엔드 중심으로 시작한다.
단일 repo에서 시작하되, 이후 여러 시각화 도구를 plugin처럼 확장할 수 있어야 한다.

## 결정
- Next.js App Router를 사용한다.
- TypeScript를 사용한다.
- React 기반 컴포넌트 구조로 구현한다.
- 백엔드, DB, 인증은 초기 범위에 넣지 않는다.
- 도구 목록은 `toolRegistry`처럼 얇은 registry로 시작한다.

## 근거
- Vercel 배포와 정적 웹앱 운영에 적합하다.
- React 생태계에서 Frappe Gantt 같은 렌더러를 얇게 감싸기 쉽다.
- 초기 단계에서 과한 plugin loader를 만들지 않아도 확장 지점을 확보할 수 있다.

## 결과
- 초기 실행 골격은 `src/app`, `src/components`, `src/lib` 중심으로 둔다.
- 실제 도구 구현이 늘어나면 registry와 도구별 폴더 구조를 점진적으로 정리한다.
