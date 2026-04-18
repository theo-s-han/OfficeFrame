# UIUX_SPEC.md

## 화면 목록

1. 홈 허브
2. 간트 에디터

## 1. 홈 허브

### 목적

사용자가 현재 제공되는 문서 시각화 도구와 준비 중인 도구를 빠르게 파악하고 간트 에디터로 진입한다.

### 성공 기준

- 간트 차트 카드만 활성 진입점으로 보인다.
- 준비 중인 도구는 실제 기능처럼 오해되지 않는다.

## 2. 간트 에디터

### 목적

사용자가 일정 데이터를 입력/수정하고 preview를 확인한 뒤 문서용 PNG로 저장한다.

### 레이아웃

- 상단: 간트 타입 selector
- 그 아래: 예시 데이터, 전체 초기화, 오늘로 이동, 이미지 만들기, 이미지 다운로드 toolbar
- 그 아래: 날짜 단위와 표시 범위
- 본문 상단: preview 영역
- 본문 하단: 타입별 row editor
- preview 내부 스크롤이 끝나면 페이지 스크롤이 자연스럽게 이어져야 한다.
- row editor는 내부 고정 스크롤을 쓰지 않고 작업 수만큼 아래로 확장된다.

### 타입 selector

지원 타입은 3개다.

- 기본 일정표
- 마일스톤형
- WBS/단계형

Roadmap형과 진행률 추적형은 제공하지 않는다.

### 기본 일정표 UX

- 입력 필드: Task, Owner, 색상, Start, End, Progress
- 색상은 작은 select가 아니라 별도 색상 선택 창에서 고른다.
- 색상 선택 창은 프리셋, 브라우저 색상 선택기, HEX 직접 입력을 제공한다.
- 기본 자동 색상은 Enterprise Light palette에서 deterministic 하게 배정한다.
- selected/hover 상태는 색상을 바꾸지 않고 outline/shadow로만 강조한다.
- 배경 템플릿을 선택할 수 있다.
- preview는 Frappe Gantt를 사용하며 drag/resize로 일정과 진행률을 수정할 수 있다.
- 유효하지 않은 drag 결과는 이전 값으로 되돌리고 debug event를 남긴다.

### 마일스톤형 UX

- 입력 필드: id, name, date, section, status, dependsOn, owner, notes, critical
- 기간형 작업처럼 Start/End/Progress를 요구하지 않는다.
- date 입력은 화면 표시 단위가 Week/Month/Quarter여도 항상 하루 단위 `YYYY-MM-DD` date input으로 유지한다.
- status는 `planned`, `on-track`, `done`만 제공하며 row를 늘리는 구조 정보가 아니라 작은 badge/marker style로만 표시한다.
- interactive preview는 jsGanttImproved milestone row로 보여준다.
- document preview는 Mermaid Gantt DSL과 SVG preview로 보여준다.
- milestone-only sample은 약 4~6주 범위 안에서 5개 이상 milestone이 고르게 퍼져 보이도록 구성한다.
- critical 항목은 Mermaid에서 `crit`와 `vert` marker로 강조된다.

### WBS/단계형 UX

- 입력 필드: id, code, name, parentId, nodeType, start, end, date, progress, owner, stage, dependsOn, notes, open
- `nodeType=group`은 날짜 없이 계층 row로 입력할 수 있다.
- `nodeType=task`는 start/end/progress를 입력한다.
- `nodeType=milestone`은 date만 입력한다.
- parentId는 기존 row 목록에서 선택할 수 있다.
- interactive preview는 jsGanttImproved schedule renderer로 보여준다.
- document preview는 Mermaid TreeView와 Mermaid Mindmap을 분리해 보여준다.

### 날짜 단위

- 1일 단위, 주 단위, 월 단위, 분기 단위를 선택할 수 있다.
- 주 단위 preview는 월 header 아래에 1주, 2주, 3주처럼 주차 header를 표시한다.
- 표시 시작/종료는 현재 날짜가 아니라 작업 데이터와 사용자의 입력을 기준으로 정한다.

### validation

- 잘못된 row는 preview 반영 전에 제외한다.
- 오류는 row 아래에 표시한다.
- 마일스톤형은 `YYYY-MM-DD` date 필수, id unique, self dependency 금지, dependsOn 유효성, 순환 의존성, status 허용값을 검사한다.
- WBS형은 id unique, parentId 존재, code unique, leaf task start/end, end >= start, milestone date를 검사한다.

### debug mode

- 일반 사용에서는 console log가 나오지 않는다.
- `?debug=gantt` 또는 `localStorage.officeTool.gantt.debug=true`일 때만 주요 상태/validation/export/renderer event를 기록한다.
- 기록 위치는 console과 `window.__OFFICE_TOOL_GANTT_DEBUG__`다.

### 이미지 출력

- 이미지 만들기는 현재 preview를 PNG data URL로 생성하고 결과 preview를 표시한다.
- 이미지 다운로드는 이미 생성된 이미지가 있으면 그대로 내려받고, 없으면 먼저 생성한다.
- DOM 캡처가 지연되면 사용자가 빈 상태로 기다리지 않도록 문서용 canvas 이미지로 fallback 생성한다.
- 입력값이 바뀌면 기존 생성 이미지 preview는 무효화한다.

### 완료 기준

- 타입 전환 시 입력 필드와 preview가 타입 목적에 맞게 달라진다.
- jsGanttImproved와 Mermaid 호출은 화면 컴포넌트가 아니라 adapter를 통해 이루어진다.
- 이미지 만들기/다운로드 버튼은 validation 통과 및 preview 존재 시 사용할 수 있다.
