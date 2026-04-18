# MINDMAP_FEATURE_SPEC.md

## 목적

마인드맵 도구는 사용자가 계층 구조를 빠르게 입력하고, 문서/PPT에 바로 붙여넣기 좋은 정돈된 preview를 확인한 뒤 PNG로 저장하는 것을 목표로 한다.

## 오픈소스 조사

조사 기준은 2026-04-18 기준의 무료 사용 가능 여부, 현재 사용 사례의 넓이, 문서형 preview 적합성, 브라우저 통합 난이도였다.

| 후보 | 라이선스 | 확인한 사용성 | 장점 | 이번 선택 여부 |
| --- | --- | --- | --- | --- |
| Mind Elixir | MIT | GitHub 약 3k stars, npm `mind-elixir` 5.10.0 | interactive editing, framework-agnostic, PNG/SVG/HTML export, CSS 변수 theme | 선택 |
| Markmap | MIT | GitHub 약 12.7k stars | Markdown 기반 mindmap에 강하고 문서형 공유가 쉽다 | 입력 폼 중심 편집 UX와는 거리 있음 |
| jsMind | BSD-3-Clause | GitHub 약 3.8k stars | 오래된 사용 사례와 canvas/svg 기반 preview | UI/테마와 입력 흐름을 별도로 더 많이 감싸야 함 |

### 선택

기본 renderer는 `Mind Elixir`를 사용한다.

선정 이유:

1. 무료 사용이 가능한 MIT 라이선스다.
2. 브라우저에서 바로 동작하고 Next.js client component와 붙이기 쉽다.
3. 단일 preview, 계층 입력, 색상 커스터마이즈, PNG export 흐름을 한 화면 안에서 무리 없이 맞출 수 있다.
4. 문서형 결과를 위한 theme 제어가 가능하다.

## 기능 구조

### 화면 흐름

입력 -> preview -> PNG 다운로드

### 레이아웃

- 상단 toolbar: 예시 데이터 / 전체 초기화 / 이미지로 내보내기
- 좌측: outline + 선택 노드 편집
- 우측: Mind Elixir preview 1개

### 입력 필드

- 이름
- 설명
- 색상
- 하위 노드 펼침 여부

### 계층 조작

- 하위 노드 추가
- 같은 레벨 추가
- 노드 삭제
- 맞춤 보기

## 색상 규칙

- Enterprise Light palette를 재사용한다.
- 루트는 중립색으로 유지한다.
- 1단계 브랜치는 palette 원색을 사용한다.
- 하위 노드는 같은 hue의 tint 배경으로 표시해 문서에서 읽기 쉽게 한다.
- 색상 선택 UI는 간트와 같은 preset + color picker + HEX 입력 dialog를 사용한다.

## 이미지 출력

- preview surface만 PNG로 저장한다.
- preview와 동일한 구조/비율을 유지하도록 렌더된 map canvas 기준으로 export한다.

## 검증 포인트

- sample data가 첫 진입부터 균형 있게 보이는가
- 노드 추가/삭제/선택이 outline과 preview에 함께 반영되는가
- 색상 선택이 preview와 export에 같은 값으로 반영되는가
- validation 오류가 즉시 보이는가
- PNG export가 빈 이미지 없이 실제 preview를 저장하는가
