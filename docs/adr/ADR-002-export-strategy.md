# ADR-002: Export Strategy

## 상태
Accepted

## 날짜
2026-04-18

## 맥락
제품의 핵심 가치는 문서와 PPT에 붙여넣기 쉬운 시각화 결과물을 빠르게 만드는 것이다.
초기 사용자에게 가장 직접적인 출력 형식은 PNG다.

## 결정
- 첫 출력 목표는 PNG로 둔다.
- 실행 골격 단계에서는 PNG export를 구현하지 않는다.
- MVP 단계에서 현재 preview 기준으로 PNG를 생성하는 방식을 검증한다.
- SVG export, 클립보드 복사, 고해상도 옵션은 후순위로 둔다.

## 근거
- PNG는 오피스 문서와 발표 자료에서 호환성이 높다.
- export 품질은 실제 렌더러와 preview DOM 구조가 정해진 뒤 판단해야 한다.
- 실행 골격 단계에서 export 라이브러리를 먼저 도입하면 불필요한 의존성이 생길 수 있다.

## 결과
- `frappe-gantt`와 export 관련 라이브러리는 MVP 구현 단계에서 추가한다.
- export 관련 결정이 바뀌면 `docs/project/DECISIONS.md` 변경 이력에 기록한다.
