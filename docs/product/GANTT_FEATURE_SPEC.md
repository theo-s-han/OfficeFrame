# GANTT_FEATURE_SPEC.md

## 목적

간트 차트 도구가 사용자에게 어떤 입력을 받고, 어떤 방식으로 preview와 PNG 결과물을 만드는지 정의한다.
이 문서는 구현된 기능과 가까운 다음 단계 기능을 함께 관리한다.

## 오픈소스 선택

- 1차 렌더러는 `frappe-gantt`를 사용한다.
- 선택 이유는 MIT 라이선스, 가벼운 의존성, drag 기반 일정 수정, progress 수정, 보기 단위 전환을 제공하기 때문이다.
- PNG export는 preview DOM을 기준으로 생성한다.

## MVP 포함 범위

- 작업 목록 추가, 수정, 삭제
- 작업명, 시작일, 종료일, 진행률 입력
- 간트 타입 선택
- 1일, 주, 월, 분기 날짜 단위 전환
- 표시 시작/종료 범위 지정
- 차트 막대 drag/resize를 통한 일정 수정
- 차트 진행률 drag를 통한 진행률 수정
- 빈 작업명, 잘못된 날짜, 종료일이 시작일보다 빠른 경우, 진행률 범위 오류 validation
- 예시 데이터 복원, 전체 초기화
- preview PNG 다운로드
- opt-in debug mode에서 값 흐름 로그 확인

## MVP 제외 범위

- 백엔드 저장, 로그인, 협업, 클라우드 저장
- 외부 AI/LLM/API 기능
- resource management
- critical path
- 고급 baseline 계산/차이 분석
- MS Project import/export
- 고급 drag/drop 편집기

## 사용자 입력값

| 필드        | 타입        | 필수          | 설명                                                 |
| ----------- | ----------- | ------------- | ---------------------------------------------------- |
| 간트 타입   | enum        | 예            | 출력 목적에 맞는 프리셋                              |
| 날짜 단위   | enum        | 예            | 1일, 주, 월, 분기 중 선택                            |
| 표시 시작   | 단위별 날짜 | 예            | preview에 표시할 최소 날짜                           |
| 표시 종료   | 단위별 날짜 | 예            | preview에 표시할 최대 날짜                           |
| 작업명      | string      | 예            | 문서에 보이는 작업 이름                              |
| 시작일      | 단위별 날짜 | 예            | 작업 시작 날짜 또는 기간                             |
| 종료일      | 단위별 날짜 | 타입별        | 작업 종료 날짜 또는 기간                             |
| 진행률      | number      | 타입별        | 0부터 100까지의 완료율                               |
| 단계        | string      | WBS/로드맵    | 묶음 또는 영역 이름                                  |
| 담당자      | string      | 타입별        | 작업 책임자 또는 항목 owner                          |
| 상태        | enum        | 타입별        | 계획, 정상, 위험, 차단, 완료 중 선택                 |
| 계획 시작   | 단위별 날짜 | 진행률 추적형 | baseline 또는 원래 계획의 시작                       |
| 계획 종료   | 단위별 날짜 | 진행률 추적형 | baseline 또는 원래 계획의 종료                       |
| 선행 작업   | string[]    | WBS           | 쉼표로 구분한 선행 작업 ID                           |
| 색상        | HEX color   | 기본 일정표   | task 막대 색상. 팔레트, 컬러 피커, HEX 입력으로 선택 |
| 배경 템플릿 | enum        | 기본 일정표   | preview와 PNG 배경 스타일                            |

## 내부 상태

| 필드                 | 설명                                                |
| -------------------- | --------------------------------------------------- |
| `tasks`              | 현재 편집 중인 작업 목록                            |
| `chartType`          | 선택된 간트 타입                                    |
| `viewMode`           | `Day`, `Week`, `Month`, `Quarter` 중 현재 날짜 단위 |
| `timelineStart`      | preview 표시 시작일                                 |
| `timelineEnd`        | preview 표시 종료일                                 |
| `backgroundTemplate` | 기본 일정표 preview 배경 템플릿                     |
| `debugEnabled`       | 디버그 로그 출력 여부                               |
| `selectedTaskId`     | 사용자가 최근 선택하거나 편집한 작업                |

## 타입별 입력 모델

| 타입          | 주 사용 맥락                                                  | 입력 방식                                                     |
| ------------- | ------------------------------------------------------------- | ------------------------------------------------------------- |
| 기본 일정표   | 작업 목록을 일정표로 입력하고 기간과 진행률을 조정한다.       | Task, Owner, 색상 선택 창, Start, End, Progress, 배경 템플릿  |
| 로드맵형      | 월/분기 단위로 큰 흐름, 영역, 책임자, 상태를 공유한다.        | 영역, Item, Owner, 상태, Start, End                           |
| 마일스톤형    | 승인, 릴리스, 마감처럼 하루짜리 주요 시점을 표시한다.         | Milestone, Owner, 상태, Date                                  |
| 진행률 추적형 | 실제 일정과 원래 계획 또는 baseline을 비교해 상태를 점검한다. | Task, Owner, 상태, Start, End, Progress, 계획 시작, 계획 종료 |
| WBS/단계형    | 작업 분해 구조와 선후 관계를 설명한다.                        | 단계, Work package, Owner, Start, End, Progress, 선행 작업    |

## 상호작용

- 하단 편집 패널에서 값을 수정하면 상단 preview가 갱신된다.
- 상단 간트 막대를 이동하거나 resize하면 하단 날짜 입력값이 갱신된다.
- 차트 클릭 선택만으로는 Frappe Gantt 인스턴스를 다시 생성하지 않는다.
- 차트 드래그 결과가 유효하지 않은 날짜이거나 종료일이 시작일보다 빠르면 이전 task 값을 유지하고 debug mode에 rollback 이벤트를 남긴다.
- 날짜 단위를 바꾸면 task와 표시 범위 입력 방식이 1일/주/월/분기 단위로 바뀐다.
- 주 단위 preview는 상단 월 헤더 아래에 1주, 2주, 3주처럼 월 내부 주차를 표시한다.
- 표시 시작/종료 범위는 task 날짜와 별개로 정할 수 있으며 preview는 내부 스크롤로 확인한다.
- 기본 일정표 task 색상은 색상 선택 창에서 프리셋 팔레트, 브라우저 컬러 피커, HEX 입력으로 지정할 수 있다.
- 기본 일정표 task 색상과 배경 템플릿은 preview와 PNG export 대상에 반영된다.
- task 입력 영역은 내부 스크롤 대신 행 개수만큼 아래로 확장된다.
- 상단 간트 진행률 핸들을 움직이면 하단 진행률 입력값이 갱신된다.
- validation 오류가 있는 행은 preview 반영 전에 사용자에게 이유를 보여준다.
- PNG 다운로드는 현재 preview 영역을 문서용 이미지로 저장한다.

## 차트 타입 로드맵

| 타입            | 단계   | 설명                                     |
| --------------- | ------ | ---------------------------------------- |
| 기본 일정표     | 구현됨 | 작업 기간과 진행률 중심                  |
| 로드맵형        | 구현됨 | 월 단위 주요 흐름과 영역 중심            |
| 마일스톤형      | 구현됨 | 승인, 릴리스, 마감 같은 주요 시점 중심   |
| 진행률 추적형   | 구현됨 | 현재 진행률과 예상 진행률을 함께 확인    |
| WBS/단계형      | 구현됨 | phase와 task를 묶어 프로젝트 구조를 표현 |
| 담당자별 간트   | 3차    | 담당자 또는 팀 기준 grouping             |
| 계획 대비 실제  | 후순위 | baseline과 actual 비교                   |
| critical path형 | 후순위 | 선후행 관계와 위험 경로 중심             |

## 조사 요약

- Microsoft Project는 기본 Gantt Chart 외에도 Detail Gantt, Milestone Rollup, Multiple Baselines Gantt, Tracking Gantt 같은 목적별 Gantt view를 제공한다.
- Google Gantt는 Task ID, Task Name, Resource, Start, End, Duration, Percent Complete, Dependencies를 핵심 데이터로 사용하고 critical path 표시도 지원한다.
- Frappe Gantt는 Day/Week/Month/Year view mode, 진행률 편집, 날짜 편집, 예상 진행률 표시 옵션을 제공한다.
- 이 제품은 문서용 이미지 생성이 목적이므로 resource/critical path/baseline 계산 엔진은 후순위로 두고, 현재 단계에서는 타입 선택 프리셋으로 사용성을 높인다.

### 2026-04-18 재조사 반영

- Microsoft Project 기준으로 일반 Gantt는 작업 입력/스케줄링, Milestone Rollup은 주요 시점 요약, Tracking Gantt와 Multiple Baselines Gantt는 baseline 대비 실제 일정 비교에 쓰인다. 그래서 진행률 추적형에는 baseline 입력을 분리했다.
- Google Gantt의 Resource와 Dependencies 컬럼을 반영해 로드맵/기본 일정에는 Owner, WBS에는 선행 작업 입력을 둔다.
- Frappe Gantt는 날짜/진행률 드래그 편집을 제공하지만, preview용 baseline 보조 막대는 실제 task 변경 대상이 아니므로 읽기 전용 preview 행으로 취급한다.
- 마일스톤은 TeamGantt 사용 사례처럼 주요 목표/마감 시점을 diamond marker로 두고, 기간/진행률 대신 날짜/owner/status 중심으로 입력한다.

## 디버그 모드

- URL query `?debug=gantt` 또는 브라우저 localStorage의 `officeTool.gantt.debug=true`로 켠다.
- 일반 사용자 흐름에서는 로그를 출력하지 않는다.
- 로그는 `window.__OFFICE_TOOL_GANTT_DEBUG__`에도 누적되어 Codex가 브라우저 실행 뒤 값 흐름을 확인할 수 있다.
- 주요 이벤트는 초기화, task 변경, validation, Frappe Gantt 이벤트, PNG export 시도/완료/실패다.

## 검증 기준

- lint, typecheck, test, build가 통과한다.
- `/gantt`에서 task 추가/수정/삭제가 preview에 반영된다.
- 차트 drag로 바뀐 날짜와 진행률이 하단 입력값에 반영된다.
- 잘못된 입력은 저장/preview 반영 전에 오류로 표시된다.
- debug mode가 꺼진 일반 실행에서는 console log가 발생하지 않는다.
