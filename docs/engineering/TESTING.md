# TESTING.md

## 목적

변경 완료 판단 기준과 수동 검증 체크리스트를 정의한다.

## 현재 명령

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

위 명령은 새로 만들지 않는다. 명령이 없으면 없는 사실을 보고한다.

## 자동 검증

- lint
- typecheck
- unit/component test
- production build

## 간트 수동 검증

- `/gantt` 페이지가 렌더링된다.
- 타입 selector에는 기본 일정형, 마일스톤형, WBS/단계형만 보인다.
- Roadmap형과 진행률 추적형은 보이지 않는다.
- 기본 일정형은 Task/Owner/색상/Start/End/Progress 입력을 제공한다.
- 기본 일정형의 Start/End 입력은 보기 단위와 무관하게 `YYYY-MM-DD` date input으로 유지된다.
- 기본 일정형에서 Start를 End보다 늦게 바꾸면 End가 자동으로 같은 날짜로 맞춰진다.
- 기본 일정형에서 End를 Start보다 이르게 바꾸려 하면 값 변경이 막히고 토스트 메시지가 뜬다.
- 일정 종료일을 현재 표시 범위 밖으로 늘리면 가장 늦은 end까지만 표시 종료가 함께 확장되어 배경 그리드가 같이 늘어난다.
- 기본 일정형의 색상 선택 창에서 preset, color input, HEX 입력이 동작한다.
- 기본 자동 색상은 Enterprise Light palette에서 안정적으로 배정되고 재렌더링해도 같은 task는 같은 색을 유지한다.
- progress fill은 task hue의 더 진한 tone, remaining 영역은 연한 tint로 보인다.
- milestone/group/dependency/grid 색상은 task palette와 분리되어 보인다.
- 기본 일정형의 배경 템플릿이 preview와 PNG export에 반영된다.
- Day preview는 일 단위 세로선이 회색 점선이고 월 경계가 실선으로 보인다.
- Week preview는 월 헤더 아래에 1주, 2주, 3주 형태의 주차 헤더가 보이고 주 경계는 회색 점선, 월 경계는 실선으로 보인다.
- Day/Week/Month 보기에서 회색 배경이 보조 열처럼 끼어들지 않고 하나의 시간 간격이 하나의 열처럼 읽힌다.
- Month preview는 월 단위 세로선이 회색 점선이고 연도 경계가 실선으로 보인다.
- Quarter preview는 분기 단위 세로선이 회색 점선이고 연도 경계가 실선으로 보인다.
- 표시 시작/종료는 항상 `YYYY-MM-DD` date input으로 입력된다.
- 표시 범위는 현재 날짜와 무관하게 지정할 수 있다.
- Week/Month 보기에서는 간격 range slider를 마우스로 조절할 수 있다.
- preview 내부 스크롤이 끝나면 페이지 스크롤이 자연스럽게 이어진다.
- row editor는 내부 고정 스크롤 없이 작업 수만큼 아래로 확장된다.
- preview task 클릭 시 해당 입력 row가 선택되고 focus 된다.
- invalid drag 결과는 기존 task 값을 유지하고 debug event를 남긴다.
- 마일스톤형은 이름/날짜/섹션/이전 단계/상태/담당자/설명 입력을 제공한다.
- 마일스톤형 date 입력은 표시 단위와 무관하게 `YYYY-MM-DD` 하루 단위다.
- 마일스톤형 기본 샘플은 6~8개 milestone이 5~10일 간격으로 배치되고 3~5개 section으로 묶여 보인다.
- 마일스톤형 status는 별도 row가 아니라 badge/text 정보로만 보이고 `planned/on-track/done`만 선택된다.
- 마일스톤형 validation은 날짜 형식, self dependency, 존재하지 않는 dependency, 순환 dependency, 허용되지 않은 status를 즉시 보여준다.
- 마일스톤형은 Mermaid Timeline preview 1개만 보여주고 jsGantt milestone preview는 노출하지 않는다.
- WBS형은 id/code/name/parentId/nodeType/start/end/date/progress/owner/stage/dependsOn/notes/open 입력을 제공한다.
- WBS형은 group/task/milestone nodeType에 따라 필요한 날짜 입력이 달라진다.
- WBS형은 jsGanttImproved schedule preview, Mermaid TreeView, Mermaid Mindmap을 분리해 보여준다.
- `이미지로 내보내기`는 현재 차트 영역만 PNG로 바로 다운로드한다.
- DOM 캡처가 지연돼도 canvas fallback 이미지가 생성된다.
- debug mode가 꺼진 일반 실행에서는 debug log가 출력되지 않는다.
- `?debug=gantt` 또는 `window.__OFFICE_TOOL_GANTT_DEBUG__`에서 주요 event를 추적할 수 있다.

## 완료 보고 형식

1. 실행한 검증 항목
2. 통과/실패 결과
3. 실행하지 못한 항목과 이유
4. 잔여 리스크
