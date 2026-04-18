# GANTT_FEATURE_SPEC.md

## 목적

간트 차트 도구가 어떤 입력을 받고 어떤 renderer로 preview와 export를 만드는지 정의한다. 현재 구현 범위는 기본 일정형, 마일스톤형, WBS/단계형 3가지다.

## 오픈소스 선택

- 기본 일정형 interactive preview: `frappe-gantt`
  - drag 기반 일정/진행률 수정과 Day/Week/Month/Quarter view에 적합하다.
- 마일스톤형, WBS형 interactive preview: `jsgantt-improved`
  - `pMile`, `pGroup`, `pParent`, `pOpen`, `pDepend`, `setAdditionalHeaders`로 milestone과 계층 구조 표현에 적합하다.
- 문서용 정적 preview: `mermaid`
  - Gantt의 `milestone`, `after`, `vert`, WBS의 `treeView-beta`, 발표용 `mindmap` DSL을 제공한다.
- 화면 컴포넌트는 오픈소스 API를 직접 섞지 않고 renderer adapter를 통해 결과만 사용한다.
- 이미지 출력은 PNG를 우선 지원하고, Mermaid SVG는 문서 preview 용도로 사용한다.

## 공통 구조

- editor shell은 type selector, toolbar, 날짜 단위/표시 범위, preview, row editor로 구성한다.
- 데이터는 `GanttTask` DSL을 중심 구조로 유지한다.
- chart type별 입력 UI는 달라지지만 preview에는 adapter가 변환한 renderer 전용 데이터만 전달한다.
- 인터랙티브 preview와 문서용 정적 preview를 분리한다.
- validation 실패 row는 preview에서 제외하고 입력 영역 아래에 오류를 표시한다.
- debug mode는 `?debug=gantt` 또는 `localStorage.officeTool.gantt.debug=true`로만 켠다.
- 색상은 `Enterprise Light` palette token과 deterministic task color resolver를 사용한다.

## 지원 타입

| 타입        | 목적                            | renderer                                   | 주요 입력                                                                                            |
| ----------- | ------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| 기본 일정형 | 일반 task 기간과 진행률 조정    | Frappe Gantt                               | name, owner, color, start, end, progress                                                             |
| 마일스톤형  | 단일 날짜 milestone 흐름 관리   | jsGanttImproved + Mermaid Gantt            | id, name, date, section, status, dependsOn, owner, notes, critical                                   |
| WBS/단계형  | 계층 구조와 일정/단계 동시 관리 | jsGanttImproved + Mermaid TreeView/Mindmap | id, code, name, parentId, nodeType, start, end, date, progress, owner, stage, dependsOn, notes, open |

Roadmap형과 진행률 추적형은 제거했다. 목적과 입력 차이가 충분하지 않아 사용자에게 비슷한 차트로 보이기 때문이다.

## 기본 일정형

### 입력 필드

- name
- owner
- color
- start
- end
- progress

### preview 규칙

- Frappe Gantt를 사용한다.
- 기본 일정형의 Start/End 입력은 항상 `YYYY-MM-DD` date input을 사용한다.
- 기본 일정형에서 Start가 End보다 늦어지면 End를 Start와 같은 날짜로 자동 보정한다.
- 기본 일정형에서 End가 Start보다 이르면 변경을 막고 토스트 메시지로 안내한다.
- 작업이 현재 표시 범위를 벗어나면 가장 이른 start와 가장 늦은 end를 기준으로 표시 시작/종료를 최소 범위만 자동 확장해 배경 그리드와 task bar가 함께 늘어난다.
- Day/Week/Month 보기에서는 주말 배경이 별도 회색 열처럼 보이지 않도록 line 중심으로 표현한다.
- Day 보기에서는 일 단위 세로선을 회색 점선으로, 월 경계는 실선으로 표시한다.
- Week 보기에는 월 헤더 아래에 `1주`, `2주`, `3주` 형태의 lower header를 보여준다.
- Week 보기에는 주 단위 세로선을 회색 점선으로, 월 경계는 실선으로 표시한다.
- Month 보기에는 월 단위 세로선을 회색 점선으로, 연도 경계는 실선으로 표시한다.
- Quarter 보기에는 분기 단위 세로선을 회색 점선으로, 연도 경계는 실선으로 표시한다.
- 표시 시작/종료는 항상 `YYYY-MM-DD` date input으로 관리한다.
- Week/Month 보기에는 column width slider로 배경 간격을 조절한다.

## 마일스톤형

### 입력 필드

| 필드        | 필수   | 설명                          |
| ----------- | ------ | ----------------------------- |
| id          | 예     | milestone 고유 id             |
| name        | 예     | 표시 이름                     |
| date        | 예     | `YYYY-MM-DD` 하루 단위 날짜   |
| section     | 아니오 | Mermaid Gantt section         |
| status      | 아니오 | `planned`, `on-track`, `done` |
| dependsOn[] | 아니오 | 선행 milestone id 목록        |
| owner       | 아니오 | 담당자                        |
| notes       | 아니오 | tooltip/문서용 메모           |
| critical    | 아니오 | 중요 마감 표시                |

### adapter 규칙

- jsGanttImproved
  - `pMile=1`
  - `pStart=date`
  - `pEnd=date`
  - domain string id는 adapter에서 numeric row id로 매핑하고 `pDepend`에는 numeric id만 전달한다.
  - `status`는 row 구조가 아니라 badge/style에만 사용한다.
- Mermaid Gantt
  - `milestone` 태그 사용
  - `section` 기준 그룹화
  - `dependsOn`은 `after`로 출력
  - `critical=true`는 `crit`와 `vert` marker로 출력
  - milestone-only preview는 compact range를 사용한다.

### validation

- `date`는 `YYYY-MM-DD` 형식만 허용
- `id` unique
- `dependsOn`은 존재하는 id만 허용
- self dependency 금지
- 순환 dependency 금지
- `status`는 `planned`, `on-track`, `done`만 허용

### 기본 샘플

- 2026-04-20 ~ 2026-05-27 범위의 8개 milestone
- section은 기획/설계/개발/검수/릴리즈로 분리
- status는 badge/marker style로만 반영

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
| date        | milestone 필수 | milestone 하루 날짜    |
| progress    | task 필수      | 0~100 진행률           |
| owner       | 아니오         | 담당자                 |
| stage       | 아니오         | 단계/상태 그룹         |
| dependsOn[] | 아니오         | 선행 row id 목록       |
| notes       | 아니오         | tooltip/문서용 메모    |
| open        | group          | 초기 펼침 상태         |

### adapter 규칙

- jsGanttImproved schedule renderer
  - group row: `pGroup=1`
  - hierarchy: `pParent=parentId`
  - initial expand: `pOpen=open`
  - milestone row: `pMile=1`, `pStart=pEnd=date`
  - additional columns: `code`, `stage`, `owner`
- Mermaid TreeView
  - parent-child tree를 indentation 기반 `treeView-beta` DSL로 출력
- Mermaid Mindmap
  - 발표/요약용 preview로 `mindmap` DSL 출력

### validation

- `id` unique
- `parentId` 존재 검증
- `code` 중복 금지
- leaf task는 `start/end` 필수
- `end >= start`
- milestone은 `date` 필수
- dependsOn은 존재하는 id만 허용하고 순환 의존성 금지

## Export

- toolbar에는 `이미지로 내보내기` 버튼만 둔다.
- 버튼은 현재 차트 surface만 PNG로 캡처해 즉시 다운로드한다.
- DOM 캡처가 지연되면 동일한 timeline/palette 규칙의 canvas PNG를 fallback으로 생성한다.
- 기본 일정형, 마일스톤형, WBS형 모두 PNG export 대상이다.

## Theme

- 기본 색상 체계는 `docs/product/GANTT_THEME_SPEC.md`의 Enterprise Light palette를 따른다.
- 일반 task, semantic status, milestone, group, dependency, grid 색상은 분리한다.
- 선택/hover 상태는 bar 색상을 바꾸지 않고 outline/stroke/shadow로만 강조한다.

## 검증 기준

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `/gantt`에서 타입 전환, 입력, preview, 이미지 export, interval slider를 수동 확인한다.
