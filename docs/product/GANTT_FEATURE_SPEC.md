# GANTT_FEATURE_SPEC.md

## 목적

간트 차트 도구가 사용자에게 어떤 입력값을 받고, 어떤 렌더러로 preview와 PNG 결과물을 만드는지 정의한다. 현재 구현 범위는 기본 일정표, 마일스톤형, WBS/단계형 3가지다.

## 오픈소스 선택

- 기본 일정표: `frappe-gantt`
  - drag 기반 일정/진행률 수정과 Day/Week/Month 커스텀 view에 적합하다.
- 마일스톤형/WBS 일정 preview: `jsgantt-improved`
  - `pMile`, `pGroup`, `pParent`, `pOpen`, `pDepend`, `setAdditionalHeaders`를 제공해 milestone과 WBS 계층 표현에 적합하다.
- 문서용 정적 preview: `mermaid`
  - Gantt의 `milestone`, `after`, `vert`, WBS용 `treeView-beta`, 발표용 `mindmap` DSL을 제공한다.
- 화면 컴포넌트는 오픈소스 API를 직접 호출하지 않고 renderer adapter를 통해 변환된 결과만 사용한다.
- PNG 이미지 생성/다운로드를 우선 지원한다. Mermaid preview는 SVG로 렌더링되므로 SVG 저장 확장은 후속 작업에서 추가할 수 있다.

## 공통 구조

- editor shell은 type selector, toolbar, 날짜 단위/표시 범위, preview, row editor로 구성한다.
- 내부 데이터는 `GanttTask` DSL을 중심으로 유지한다.
- chart type별 입력 필드는 UI에서 분기하지만, preview에는 adapter가 변환한 renderer 전용 데이터만 전달한다.
- 문서용 정적 preview와 인터랙티브 preview를 분리한다.
- validation 실패 row는 preview에서 제외하고, 입력 영역에 오류를 표시한다.
- debug mode는 `?debug=gantt` 또는 `localStorage.officeTool.gantt.debug=true`로 켠다.
- 색상은 `Enterprise Light` palette token과 deterministic task color resolver를 통해 배정한다.

## 지원 타입

| 타입        | 목적                                   | 렌더러                                     | 주요 입력                                                                                            |
| ----------- | -------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| 기본 일정표 | 일반 작업 기간과 진행률 조정           | Frappe Gantt                               | name, owner, color, start, end, progress                                                             |
| 마일스톤형  | 승인, 릴리즈, 마감 같은 단일 시점 관리 | jsGanttImproved + Mermaid Gantt            | id, name, date, section, status, dependsOn, owner, notes, critical                                   |
| WBS/단계형  | 작업 분해 구조와 일정/계층 관리        | jsGanttImproved + Mermaid TreeView/Mindmap | id, code, name, parentId, nodeType, start, end, date, progress, owner, stage, dependsOn, notes, open |

Roadmap형과 진행률 추적형은 타입 간 차이가 충분하지 않아 제거했다. baseline 비교형은 별도 입력/렌더러 설계가 필요하면 후속 PLAN으로 다시 정의한다.

## 마일스톤형

### 입력 필드

| 필드        | 필수   | 설명                             |
| ----------- | ------ | -------------------------------- |
| id          | 예     | 마일스톤 고유 id                 |
| name        | 예     | 표시 이름                        |
| date        | 예     | `YYYY-MM-DD` 하루 단위 단일 날짜 |
| section     | 아니오 | Mermaid Gantt section            |
| status      | 아니오 | planned, on-track, done          |
| dependsOn[] | 아니오 | 선행 마일스톤 id 목록            |
| owner       | 아니오 | 담당자                           |
| notes       | 아니오 | tooltip/문서용 메모              |
| critical    | 아니오 | 중요 마감 표시                   |

### adapter 규칙

- jsGanttImproved
  - `pMile=1`
  - `pStart=date`
  - `pEnd=date`
  - domain string id는 adapter에서 numeric row id로 매핑하고 `pDepend`에는 numeric id만 전달
  - `status`는 row 구조가 아니라 caption badge/style에만 사용
- Mermaid Gantt
  - `milestone` 태그 사용
  - `section`별 그룹 출력
  - `dependsOn`은 `after`로 출력
  - `critical=true`는 `crit` 및 `vert` deadline marker로 출력
  - milestone-only preview는 `dateFormat YYYY-MM-DD`, `%m/%d` axis, 1주 tick 기준으로 compact하게 출력

### validation

- `date`는 필수이며 `YYYY-MM-DD` 형식만 허용
- `id` unique
- `dependsOn`은 존재하는 id만 허용
- `dependsOn`에 자기 자신 id 입력 금지
- 순환 의존성 금지
- `status`는 `planned`, `on-track`, `done`만 허용하며 별도 row/section 생성에는 사용하지 않음

### 기본 샘플

- milestone-only 샘플은 2026-04-20부터 2026-05-27까지 약 5주 범위에 8개 milestone을 배치한다.
- section은 기획/설계/개발/검수/릴리즈로 나누고, `done`, `on-track`, `planned`는 badge와 marker style에만 사용한다.
- `ms-schema`는 `ms-scope`, `ms-research` 두 선행 milestone을 참조해 일직선만 있는 화면을 피한다.

## WBS/단계형

### 입력 필드

| 필드        | 필수           | 설명                   |
| ----------- | -------------- | ---------------------- |
| id          | 예             | row 고유 id            |
| code        | 예             | WBS code, 중복 금지    |
| name        | 예             | row 이름               |
| parentId    | 아니오         | 상위 row id            |
| nodeType    | 예             | group, task, milestone |
| start       | task 필수      | leaf task 시작일       |
| end         | task 필수      | leaf task 종료일       |
| date        | milestone 필수 | milestone 단일 날짜    |
| progress    | task 필수      | 0-100 진행률           |
| owner       | 아니오         | 담당자                 |
| stage       | 아니오         | 단계/상태 그룹         |
| dependsOn[] | 아니오         | 선행 row id 목록       |
| notes       | 아니오         | tooltip/문서용 메모    |
| open        | group          | 초기 펼침 상태         |

### adapter 규칙

- jsGanttImproved schedule renderer
  - group row: `pGroup=1`, 날짜는 비워둘 수 있음
  - hierarchy: `pParent=parentId`
  - initial expand: `pOpen=open`
  - milestone row: `pMile=1`, `pStart=pEnd=date`
  - additional columns: `setAdditionalHeaders`로 code, stage, owner 출력
- Mermaid TreeView
  - parent-child tree를 indentation 기반 `treeView-beta` DSL로 출력
- Mermaid Mindmap
  - 발표/요약용 선택 preview로 WBS 계층을 `mindmap` DSL로 출력

### validation

- `id` unique
- `parentId` 존재 검증
- `code` 중복 금지
- leaf task는 `start/end` 필수
- `end >= start`
- milestone은 `date` 필수
- dependsOn은 존재하는 id만 허용하고 순환 의존성은 금지

## Export

- 이미지 만들기 버튼은 현재 preview DOM 전체를 PNG data URL로 생성하고 화면 아래에 결과 preview를 표시한다.
- DOM 이미지 생성이 지연되면 같은 DSL/timeline/palette 규칙으로 그린 문서용 canvas PNG를 fallback으로 생성한다.
- 이미지 다운로드 버튼은 생성된 PNG가 있으면 그대로 다운로드하고, 없으면 먼저 생성한 뒤 다운로드한다.
- 기본 일정표, 마일스톤형, WBS/단계형 모두 PNG 이미지 출력 대상이다.
- Mermaid SVG 단독 export는 후속 확장 후보로 둔다.

## Theme

- 기본 색상 체계는 `docs/product/GANTT_THEME_SPEC.md`의 Enterprise Light palette를 따른다.
- 일반 task, semantic status, milestone, group, dependency, grid 색상을 분리한다.
- 선택/hover 상태는 bar 색상을 변경하지 않고 outline/stroke/shadow로만 강조한다.

## 검증 기준

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `/gantt`에서 기본 일정표/마일스톤형/WBS 전환, 타입별 입력 필드, adapter preview, 이미지 만들기/다운로드 버튼 상태를 수동 확인한다.
