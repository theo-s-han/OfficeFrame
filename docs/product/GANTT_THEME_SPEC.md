# GANTT_THEME_SPEC.md

## 목적

간트 차트 색상이 작업마다 임의로 튀지 않고, 흰색 또는 매우 밝은 회색 배경의 문서/PPT에 붙여넣기 좋은 기업형 색상 체계로 보이도록 규칙을 정의한다.

## 기본 palette

현재 기본 palette는 `Enterprise Light`다.

### Task colors

| 순서 | 색상      | 이름        | 용도          |
| ---- | --------- | ----------- | ------------- |
| 1    | `#5B6EE1` | Indigo Blue | 핵심 일정     |
| 2    | `#2F7E9E` | Teal Blue   | 기획/분석     |
| 3    | `#4E8B63` | Muted Green | 안정/운영     |
| 4    | `#A07A2E` | Soft Ochre  | 검토/주의     |
| 5    | `#A65D7B` | Dusty Rose  | 승인/의사결정 |
| 6    | `#7A68B8` | Soft Violet | 기술/지원     |

### Neutral colors

| token          | value     | 사용처                     |
| -------------- | --------- | -------------------------- |
| background     | `#FFFFFF` | export surface, chart bg   |
| surface        | `#F7F8FA` | header, meta, panel bg     |
| gridLine       | `#E6E8EC` | 세로 grid                  |
| rowDivider     | `#ECEEF2` | row divider, panel border  |
| textPrimary    | `#1F2937` | label/title                |
| textSecondary  | `#667085` | meta/sub text              |
| groupBar       | `#667085` | group/summary row          |
| secondaryBar   | `#98A2B3` | 보조 bar/progress fallback |
| disabled       | `#CBD5E1` | disabled state             |
| dependencyLine | `#98A2B3` | dependency arrow/line      |

### Semantic colors

| token     | value     | 사용처                       |
| --------- | --------- | ---------------------------- |
| success   | `#4E8B63` | `done`, `on-track` 명시 상태 |
| warning   | `#D9A441` | `at-risk` 명시 상태          |
| danger    | `#D95C5C` | `blocked` 명시 상태          |
| milestone | `#C59B3A` | milestone marker             |

## 색상 배정 규칙

- 일반 task는 `phase`, `section`, `stage`, `parentId` 순서로 grouping key를 찾고, 값이 있으면 같은 key에 같은 색을 배정한다.
- grouping key가 없으면 task `id`의 stable hash로 palette index를 결정한다.
- 같은 chart를 다시 렌더링해도 같은 task는 같은 색을 유지한다.
- 사용자가 직접 색상을 선택한 project task는 manual color로 저장한다.
- 상태색은 일반 task palette와 분리한다. `done`/`on-track`은 success, `at-risk`는 warning, `blocked`는 danger로만 override한다.
- group row는 neutral `groupBar`, milestone은 semantic `milestone`을 항상 사용한다.
- dependency line, grid, row divider는 neutral gray 계열을 사용해 chart 본문보다 튀지 않게 한다.

## Progress 색상

- task의 remaining/background 영역은 base color의 아주 연한 tint를 사용한다.
- progress fill은 같은 hue에서 14% 어두운 tone을 사용한다.
- border는 같은 hue에서 8% 어두운 tone을 사용한다.
- selected/focused 상태는 색상을 바꾸지 않고 outline/stroke/shadow만 강화한다.

## 구현 위치

- palette token: `src/lib/gantt/theme.ts`
- progress shade/tint: `src/lib/gantt/progressColors.ts`
- task color assignment: `src/lib/gantt/taskColorResolver.ts`
- Frappe/jsGantt/Mermaid 연결: renderer adapter와 preview component
- CSS token 적용: `src/app/globals.css`

## Preview state

현재 기본 예시 데이터는 task별 수동 색상을 저장하지 않는다. 따라서 `task-1`, `task-2`처럼 id 기반 stable hash로 색이 결정되고, 새 작업도 랜덤 색상 없이 같은 규칙으로 배정된다. 색상 선택 창에서 manual color를 적용하면 해당 task에만 저장되어 preview와 이미지 출력에 반영된다.
