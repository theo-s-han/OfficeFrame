# TESTING.md

## 목적

변경 완료 판단 기준과 수동 검증 절차를 정의한다.

## 현재 명령

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

임의 명령을 새로 만들어 실행하지 않는다. 명령이 없으면 없는 사실을 보고한다.

## 자동 검증

- lint
- typecheck
- unit/component test
- production build

## 간트 수동 검증

- `/gantt` 페이지가 렌더링된다.
- 타입 selector에 기본 일정표, 마일스톤형, WBS/단계형만 보인다.
- Roadmap형과 진행률 추적형은 보이지 않는다.
- 기본 일정표는 Task/Owner/색상/Start/End/Progress 입력을 제공한다.
- 기본 일정표 색상 선택 창에서 프리셋, color input, HEX 입력이 동작한다.
- 기본 자동 색상은 Enterprise Light palette에서 안정적으로 배정되고 새로 렌더링해도 유지된다.
- progress fill은 task hue의 더 진한 tone, remaining 영역은 연한 tint로 보인다.
- milestone/group/dependency/grid 색상이 task palette와 분리되어 보인다.
- 기본 일정표 배경 템플릿이 preview와 PNG 대상에 반영된다.
- 주 단위 preview는 월 header 아래 1주, 2주, 3주 header를 표시한다.
- 날짜 단위는 1일/주/월/분기 입력으로 전환된다.
- 표시 시작/종료 범위를 현재 날짜와 무관하게 지정할 수 있다.
- preview 내부 스크롤이 끝나면 페이지 스크롤이 이어진다.
- row editor는 내부 고정 스크롤 없이 작업 수만큼 아래로 확장된다.
- preview task 클릭 시 해당 입력 row가 선택되고 focus 된다.
- invalid drag 결과는 기존 task 값을 유지하고 debug event를 남긴다.
- 마일스톤형은 id/name/date/section/status/dependsOn/owner/notes/critical 입력을 제공한다.
- 마일스톤형 date 입력은 표시 단위와 무관하게 `YYYY-MM-DD` 하루 단위로 유지된다.
- 마일스톤형 기본 샘플은 2026-04-20 ~ 2026-05-27 범위에 8개 milestone이 section별로 분산되어 보인다.
- 마일스톤형 status는 별도 row가 아니라 badge/marker style로만 보이며 `planned/on-track/done`만 선택된다.
- 마일스톤형 validation은 월 단위 date, self dependency, 존재하지 않는 dependency, 허용되지 않은 status를 오류로 표시한다.
- 마일스톤형은 jsGanttImproved interactive preview와 Mermaid Gantt document preview를 분리해 보여준다.
- WBS형은 id/code/name/parentId/nodeType/start/end/date/progress/owner/stage/dependsOn/notes/open 입력을 제공한다.
- WBS형은 group/task/milestone nodeType별로 필요한 날짜 입력이 달라진다.
- WBS형은 jsGanttImproved schedule preview, Mermaid TreeView, Mermaid Mindmap을 분리해 보여준다.
- 이미지 만들기를 누르면 현재 preview가 이미지 preview로 생성된다.
- DOM 캡처가 지연되는 경우에도 canvas fallback 이미지가 생성된다.
- 이미지 다운로드가 현재 preview 영역을 PNG 파일로 저장한다.
- debug mode가 꺼진 일반 실행에서는 debug log가 출력되지 않는다.
- `?debug=gantt`에서는 `window.__OFFICE_TOOL_GANTT_DEBUG__`에 주요 event가 누적된다.

## 완료 보고 형식

1. 실행한 검증 항목
2. 통과/실패 결과
3. 실행하지 못한 항목과 이유
4. 남은 리스크
