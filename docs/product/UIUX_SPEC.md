# UIUX_SPEC.md

## 화면 목록

1. 홈
2. 간트 에디터

## 1. 홈

### 목적

사용자가 현재 제공되는 문서 시각화 도구를 빠르게 파악하고 간트 에디터로 진입한다.

### 성공 기준

- 간트 차트 카드만 우선 진입점으로 보인다.
- 준비 중인 도구는 실제 기능처럼 오해되지 않는다.

## 2. 간트 에디터

### 목적

사용자가 일정 데이터를 입력·수정하고 preview를 확인한 뒤 문서에 붙여넣기 좋은 차트 이미지로 내보낸다.

### 레이아웃

- 상단: 간트 타입 selector
- 그 아래: 예시 데이터, 전체 초기화, 이미지로 내보내기 toolbar
- 그 아래: 날짜 단위, 표시 범위, 배경/간격 제어
- 본문 상단: preview 영역
- 본문 하단: 타입별 row editor
- preview 내부 스크롤이 끝나면 페이지 스크롤이 자연스럽게 이어져야 한다.
- row editor는 내부 고정 스크롤을 두지 않고 작업 수만큼 아래로 확장된다.

### 타입 selector

지원 타입은 3개다.

- 기본 일정형
- 마일스톤형
- WBS/단계형

Roadmap형과 진행률 추적형은 제공하지 않는다.

### 기본 일정형 UX

- 입력 필드: Task, Owner, 색상, Start, End, Progress
- 색상은 작은 select가 아니라 별도 색상 선택 창에서 고른다.
- 색상 선택 창은 미리보기, 브라우저 색상 선택기, HEX 직접 입력을 제공한다.
- 기본 자동 색상은 Enterprise Light palette에서 deterministic 하게 배정한다.
- selected/hover 상태는 색을 바꾸지 않고 outline/shadow로만 강조한다.
- 배경 템플릿을 선택할 수 있다.
- 기본 일정형의 Start/End 입력은 보기 단위와 무관하게 항상 `YYYY-MM-DD` date input으로 받는다.
- 기본 일정형에서 Start를 End보다 늦게 바꾸면 End는 자동으로 같은 날짜로 보정된다.
- 기본 일정형에서 End를 Start보다 이르게 입력하려 하면 변경을 막고 토스트로 즉시 안내한다.
- 기본 일정형에서 일정이 현재 표시 범위를 넘어가면 가장 이른 start와 가장 늦은 end를 기준으로 표시 시작/종료만 최소한으로 확장한다.
- Day/Week/Month 보기에서는 주말이나 보조 배경이 별도 회색 열처럼 보이지 않도록 정리해, 하나의 시간 간격이 하나의 열처럼 읽혀야 한다.
- Day 보기에서는 일 단위 세로선은 회색 점선, 월 경계는 실선으로 구분한다.
- Week 보기에서는 월 헤더 아래에 1주, 2주, 3주 형태의 주차 헤더를 보여준다.
- Week 보기에서는 각 주 경계를 회색 점선으로, 월 경계는 실선으로 표시해 간격을 읽기 쉽게 한다.
- Month 보기에서는 월 단위 세로선은 회색 점선, 연도 경계는 실선으로 표시한다.
- Quarter 보기에서는 분기 단위 세로선은 회색 점선, 연도 경계는 실선으로 표시한다.
- Week/Month 보기에서는 배경 간격을 range slider로 마우스 조절할 수 있다.
- preview는 Frappe Gantt를 사용하고 drag/resize로 일정을 수정할 수 있다.
- 유효하지 않은 drag 결과는 이전 값으로 되돌리고 debug event를 남긴다.

### 마일스톤형 UX

- 입력 필드: 이름(name), 날짜(date), 섹션(section), 이전 단계, 상태(status), 담당자(owner), 설명(notes)
- `id`는 사용자에게 노출하지 않고 내부에서 자동 생성한다.
- "Depends on" 같은 개발자 용어는 노출하지 않는다.
- 기간형 작업처럼 Start/End/Progress를 요구하지 않는다.
- date 입력은 표시 단위와 무관하게 항상 `YYYY-MM-DD` date input으로 유지한다.
- "이전 단계"는 기존 milestone 목록에서 고르는 선택 UI로 제공하고, "없음" 옵션을 포함한다.
- status는 `planned`, `on-track`, `done`만 제공하고 row를 늘리는 구조 데이터가 아니라 badge/label 정보로만 표시한다.
- preview는 1개만 보여주며 Mermaid Timeline 기반 문서형 결과만 사용한다.
- renderer 이름, DSL 같은 개발자 중심 용어는 milestone 화면에 노출하지 않는다.
- milestone-only sample은 6~8개 milestone, 5~10일 간격, 3~5개 section 기준으로 처음부터 자연스럽게 보이도록 구성한다.

### WBS/단계형 UX

- 입력 필드: id, code, name, parentId, nodeType, start, end, date, progress, owner, stage, dependsOn, notes, open
- `nodeType=group`은 날짜 없이 계층 row로 입력할 수 있다.
- `nodeType=task`는 start/end/progress를 입력한다.
- `nodeType=milestone`은 date만 입력한다.
- parentId는 기존 row 목록에서 선택할 수 있다.
- interactive preview는 jsGanttImproved schedule renderer를 사용한다.
- document preview는 Mermaid TreeView와 Mermaid Mindmap을 분리해 보여준다.

### 날짜 범위

- 1일 단위, 주 단위, 월 단위, 분기 단위를 선택할 수 있다.
- 주 단위 preview에는 월 헤더 아래에 1주, 2주, 3주차 주간 헤더를 표시한다.
- 표시 시작/종료는 항상 `YYYY-MM-DD` 형식의 date input으로 입력한다.
- 표시 시작/종료는 현재 시점이 아니라 작업 데이터와 사용자의 입력을 기준으로 정한다.

### Validation

- 잘못된 row는 preview 반영 전에 제외한다.
- 오류는 row 아래에 표시한다.
- 마일스톤형은 `YYYY-MM-DD` date 필수, id unique, self dependency 금지, dependsOn 유효성, 순환 의존성, status 허용값을 검증한다.
- WBS형은 id unique, parentId 존재, code unique, leaf task start/end, end >= start, milestone date를 검증한다.

### Debug Mode

- 일반 사용자에게는 console log가 보이지 않는다.
- `?debug=gantt` 또는 `localStorage.officeTool.gantt.debug=true`일 때만 주요 상태/validation/export/renderer event를 기록한다.
- 기록 위치는 console과 `window.__OFFICE_TOOL_GANTT_DEBUG__`다.

### 이미지 출력

- `이미지로 내보내기` 버튼은 현재 차트 surface만 PNG로 생성해 바로 다운로드한다.
- 입력 폼, badge, 편집 컨트롤은 export 대상에 포함하지 않는다.
- DOM 캡처가 지연되면 사용자가 빈 상태로 기다리지 않도록 문서형 canvas 이미지로 fallback 생성한다.
- 입력값이 바뀌면 다음 export 시 최신 차트를 다시 캡처한다.

### 완료 기준

- 타입 전환 시 입력 필드와 preview가 타입 목적에 맞게 달라진다.
- jsGanttImproved와 Mermaid 출력은 화면 컴포넌트가 아니라 adapter를 통해 이어진다.
- 이미지로 내보내기 버튼은 validation 통과 및 preview 존재 시만 사용할 수 있다.
