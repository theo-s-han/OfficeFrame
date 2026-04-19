# DIAGRAM_TOOLKIT_SPEC.md

## 문제 정의

조직도, 플로우차트, 타임라인은 모두 문서/PPT에 붙여 넣기 좋은 구조 시각화 도구지만, 라이브러리 특성에 따라 입력 방식과 preview 방식이 쉽게 제각각으로 흩어진다.

이 문서는 새 구조형 도구를 추가할 때 다음 문제를 막기 위한 공통 기준이다.

- renderer가 2개 이상 떠서 결과물이 중복되는 문제
- preview와 PNG export 결과가 달라지는 문제
- 개발자용 필드가 그대로 UI에 노출되는 문제
- 샘플 데이터가 빈약해서 첫 화면이 허전해지는 문제
- 잘못된 입력이 들어오면 preview가 통째로 깨지는 문제

## 사용자 목표

- 입력은 쉬워야 한다.
- preview는 하나만 보여야 한다.
- 결과는 문서형 이미지로 깔끔해야 한다.
- PNG 다운로드가 preview와 같은 형태로 동작해야 한다.

## 공통 제품 원칙

1. 기능당 preview는 1개만 둔다.
2. renderer 이름은 사용자 화면에 노출하지 않는다.
3. 공통 shell은 유지한다.
4. `예시 데이터`, `전체 초기화`, `이미지로 내보내기` 버튼 형식을 최대한 통일한다.
5. 색상 선택은 기존 color dialog/preset/HEX 입력 방식을 재사용한다.
6. preview와 export는 같은 surface를 기준으로 한다.
7. debug mode는 opt-in으로만 동작한다.
8. invalid 입력은 즉시 보이되, 마지막 정상 preview는 유지한다.

## 공통 화면 구조

- 상단: 기능 제목, 짧은 설명, action bar
- 본문: 좌측 editor / 우측 preview 기본 구조
- preview: 문서용 결과물 1개만 표시
- editor: 기능별 row/card/list 입력 UI

예외가 필요한 경우에도 아래는 유지한다.

- action bar 위치
- preview 1개 원칙
- 이미지 export 위치와 이름
- validation 메시지 패턴

## 공통 입력/출력 구조

### 사용자 입력값

- 업무 용어 중심으로 노출한다.
- 사용자가 이해하기 어려운 `id`, `parentId`, `dependsOn`, `depth`, `sortOrder`, 좌표값은 숨긴다.
- 날짜는 가능한 한 `YYYY-MM-DD` 형식의 day-level 입력을 우선한다.
- 관계 입력은 자유 텍스트보다 선택 UI를 우선한다.

### 내부 값

- 내부 id는 자동 생성한다.
- renderer가 numeric id 또는 좌표를 요구하면 adapter에서 변환한다.
- 내부 구조 값은 export나 preview 설명문에 노출하지 않는다.

### 출력값

- preview 1개
- PNG export 1개
- 필요 시 내부적으로 doc/static renderer를 따로 둘 수는 있지만, 화면에서는 단일 결과로 합쳐 보이게 한다.

## 공통 export 원칙

1. 버튼 이름은 `이미지로 내보내기`로 통일한다.
2. chart area만 export한다.
3. editor, toolbar, 빈 여백 레이아웃은 export 대상에서 제외한다.
4. preview가 보이는 비율과 export 결과 비율이 크게 어긋나지 않아야 한다.
5. DOM 캡처가 실패할 수 있는 renderer는 fallback export 경로를 별도로 둔다.

## 공통 validation 원칙

- 필수 입력 누락은 즉시 표시한다.
- 존재하지 않는 참조는 허용하지 않는다.
- self reference는 기본적으로 금지한다.
- cycle은 기능 특성에 따라 금지 또는 경고로 구분한다.
- invalid 변경은 이전 정상 상태로 되돌리거나 반영을 차단한다.

## 공통 sample data 원칙

- 첫 진입 시 바로 그럴듯하게 보여야 한다.
- 너무 적어서 휑해 보이지 않아야 한다.
- 상태/섹션/그룹이 자연스럽게 읽혀야 한다.
- 실제 validation 규칙을 통과해야 한다.
- 문서/PPT에 바로 붙여도 이상하지 않은 데이터 밀도를 가져야 한다.

## 공통 debug 원칙

- 일반 사용 시 console 로그를 남기지 않는다.
- 기능별 query/localStorage opt-in만 허용한다.
- 추천 키:
  - `?debug=orgchart`
  - `?debug=flowchart`
  - `?debug=timeline`
- 전역 확인 값:
  - `window.__OFFICE_TOOL_ORGCHART_DEBUG__`
  - `window.__OFFICE_TOOL_FLOWCHART_DEBUG__`
  - `window.__OFFICE_TOOL_TIMELINE_DEBUG__`

## 공통 테스트 체크리스트

### 자동 검증

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

### 기능 테스트

- 예시 데이터가 즉시 preview에 반영되는가
- 전체 초기화가 정상 동작하는가
- validation 에러가 row/card 단위로 보이는가
- preview가 1개만 보이는가
- 이미지 내보내기가 preview와 같은 surface를 기준으로 동작하는가

### 회귀 방지 테스트

- invalid 입력 후 preview 전체가 사라지지 않는가
- selection/focus가 렌더 재생성 때문에 튀지 않는가
- export 이미지가 빈 공간까지 과하게 포함하지 않는가
- preview와 export의 가로세로 비율 차이가 허용 오차 안에 있는가

## 구현 순서

1. 오픈소스 후보 조사
2. 사용 예시 확인
3. 추천 라이브러리 결정
4. 사용자 입력값과 내부 값 분리
5. preview 정의
6. export 범위 정의
7. sample data 설계
8. validation 설계
9. debug 포인트 설계
10. 구현
11. 자동/수동 검증

## 구현 완료 기준

- 기능별 명세 문서가 있다.
- preview가 1개다.
- 입력값이 업무 용어 중심이다.
- export가 preview와 맞는다.
- sample data가 자연스럽다.
- validation과 rollback/차단 규칙이 있다.
- 공통 action bar와 색상 선택 방식이 어긋나지 않는다.
