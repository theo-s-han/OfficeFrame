# TESTING.md

## 목적

완료 판단 기준과 검증 절차를 정의한다.

## 검증 레이어

### 1. 정적 검증

- lint
- typecheck

### 2. 자동 테스트

- smoke test
- registry/model처럼 작고 안정적인 단위 테스트

### 3. 빌드 검증

- production build

### 4. 수동 검증

- 홈 허브 진입이 막히지 않는다.
- 간트 차트만 활성 진입점으로 보인다.
- placeholder 도구는 준비 중으로 보인다.
- `/gantt`에서 toolbar/editor/Frappe Gantt preview가 보인다.
- 간트 타입을 선택하면 샘플, 입력 필드, preview 스타일이 바뀐다.
- preview가 상단 큰 영역 안에 머물고 넘치는 timeline은 내부 스크롤로 확인된다.
- preview 내부 스크롤 끝에서는 페이지 스크롤로 이어진다.
- preview task를 클릭하면 해당 입력 행으로 이동해 편집할 수 있다.
- preview task 클릭만으로 Frappe Gantt가 다시 생성되지 않는다.
- 차트 drag 결과가 invalid date 또는 End < Start이면 이전 task 값이 유지된다.
- 날짜 단위를 1일, 주, 월, 분기로 바꾸면 task 날짜 입력과 표시 범위 입력이 함께 바뀐다.
- 기본 일정표의 주 단위 preview에서 월 헤더 아래에 1주, 2주, 3주처럼 월 내부 주차가 표시된다.
- 로드맵형은 영역/Owner/상태, 마일스톤형은 Date/Owner/상태, 진행률 추적형은 baseline, WBS형은 선행 작업 입력이 보인다.
- 기본 일정표에서 task 색상 선택 창을 열고 팔레트/컬러 피커/HEX 입력으로 색상을 바꾸면 preview와 PNG 대상 스타일이 바뀐다.
- 기본 일정표에서 배경 템플릿을 바꾸면 preview와 PNG 대상 스타일이 바뀐다.
- 하단 task 입력 영역은 내부 스크롤 없이 행 개수만큼 페이지 아래로 확장된다.
- task 추가/수정/삭제가 preview 상태에 반영된다.
- debug mode가 꺼진 상태에서는 debug log가 출력되지 않는다.

## 현재 명령

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## 공통 완료 기준

- 새/수정 기능이 요구사항과 일치한다.
- 정적 검증이 통과한다.
- 자동 테스트가 통과한다.
- production build가 통과한다.
- 실패한 검증이 있으면 이유와 영향 범위를 보고한다.

## 실행 골격 체크리스트

- [ ] 홈 허브가 첫 화면으로 렌더링된다.
- [ ] 간트 차트 카드만 활성이다.
- [ ] 마인드맵, 조직도, 플로우차트, 타임라인은 준비 중이다.

## 간트 MVP 체크리스트

- [ ] `/gantt` 페이지가 렌더링된다.
- [ ] toolbar/editor/Frappe Gantt preview 구조가 보인다.
- [ ] 작업 추가/수정/삭제가 가능하다.
- [ ] 기본 일정표/로드맵형/마일스톤형/진행률 추적형/WBS형 타입 전환이 가능하다.
- [ ] 1일/주/월/분기 날짜 단위 전환이 가능하다.
- [ ] 주 단위 preview가 월/주 2줄 헤더로 보이고, 주 열은 1주, 2주, 3주처럼 표시된다.
- [ ] 표시 시작/종료 범위를 현재 날짜와 무관하게 지정할 수 있다.
- [ ] preview가 화면 밖으로 밀려나지 않고 내부 스크롤을 제공한다.
- [ ] preview 내부 스크롤 끝에서 페이지 스크롤이 이어진다.
- [ ] 하단 task 입력 영역이 내부 스크롤 없이 행 개수만큼 아래로 확장된다.
- [ ] 기본 일정표 task 색상 버튼을 누르면 색상 선택 창이 열린다.
- [ ] 색상 선택 창에서 팔레트/컬러 피커/HEX 입력으로 고른 색상이 preview 막대와 PNG 대상에 반영된다.
- [ ] 기본 일정표 배경 템플릿 선택이 preview 배경과 PNG 대상에 반영된다.
- [ ] preview task 클릭 시 해당 입력 행이 선택되고 포커스된다.
- [ ] preview task 클릭 시 debug event의 `chart.render` 개수가 증가하지 않는다.
- [ ] invalid drag 값은 `chart.date_change.reverted`로 기록되고 이전 task 값이 유지된다.
- [ ] 날짜와 진행률 validation이 동작한다.
- [ ] 간트 타입별 입력 필드가 서로 다르게 보인다.
- [ ] Frappe Gantt preview가 SVG로 렌더링된다.
- [ ] PNG 다운로드가 동작한다.
- [ ] `?debug=gantt`에서 debug event가 누적된다.

## 완료 보고 형식

1. 실행한 검증 항목
2. 통과/실패 결과
3. 실행하지 못한 항목과 이유
4. 남은 리스크
