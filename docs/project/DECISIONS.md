# DECISIONS.md

## 목적

이 파일에는 확정된 결정만 기록한다. 아이디어, 초안, TODO는 `BACKLOG.md` 또는 `PLANS.md`에 둔다.

## 기록 규칙

- 상태는 `Locked`만 사용한다.
- 결정을 바꾸면 기존 내용을 지우지 말고 변경 이력으로 남긴다.
- 이유 없는 결정을 적지 말고 근거를 함께 남긴다.

## 결정 목록

| 날짜       | 주제             | 결정                                                                                              | 이유                                                                             | 상태   |
| ---------- | ---------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------ |
| 2026-04-18 | 제품 방향        | 오피스 문서용 구조 시각화 도구를 만든다.                                                          | 작업/문서/PPT에 직접 붙여 넣기 좋은 결과물이 핵심이기 때문이다.                  | Locked |
| 2026-04-18 | 주요 사용자      | PM, 개발 리드, 운영 담당 등 문서 중심 B2B 사용자                                                  | 일정과 구조를 보고서로 자주 전달하는 사용자가 핵심이기 때문이다.                 | Locked |
| 2026-04-18 | 실행 구조        | 프론트엔드 중심, 백엔드 없음                                                                      | 초기 비용과 복잡도를 줄이기 위해서다.                                            | Locked |
| 2026-04-18 | AI 기능          | 실행 중 외부 AI/LLM/API 기능을 제품에 넣지 않는다.                                                | 비용, 보안, 재현성, 테스트 복잡도를 줄이기 위해서다.                             | Locked |
| 2026-04-18 | repo 전략        | 단일 repo로 시작하되 plugin 확장을 고려한다.                                                      | 초기 속도와 공통 UI 재사용성을 우선하기 위해서다.                                | Locked |
| 2026-04-18 | 첫 화면          | 홈 대시보드                                                                                       | 이후 여러 도구로 확장하기 쉽기 때문이다.                                         | Locked |
| 2026-04-18 | 첫 도구          | 기본 간트 차트                                                                                    | 업무 수요가 명확하고 입력 구조가 비교적 단순하기 때문이다.                       | Locked |
| 2026-04-18 | 기본 렌더러      | 기본 일정형은 Frappe Gantt를 사용한다.                                                            | drag 기반 일정/진행률 수정에 적합하기 때문이다.                                  | Locked |
| 2026-04-18 | 출력 우선순위    | 첫 출력 목표는 PNG다.                                                                             | 문서/PPT 붙여넣기 사용성이 가장 높기 때문이다.                                   | Locked |
| 2026-04-18 | 실행 골격 범위   | Next.js App Router, TypeScript, 홈 shell, 간트 에디터 shell, registry/model/test/CI까지 구성한다. | MVP 이전에 구현 가능성과 구조를 안정화하기 위해서다.                             | Locked |
| 2026-04-18 | 간트 타입        | Roadmap형과 진행률 추적형은 제거하고 기본 일정형, 마일스톤형, WBS/단계형만 유지한다.              | 목적과 입력 방식 차이가 충분하지 않아 비슷한 기능처럼 보였기 때문이다.           | Locked |
| 2026-04-18 | 간트 확장 렌더러 | 마일스톤형은 Mermaid Timeline 단일 preview만 사용하고, WBS형은 react-d3-tree 기반 WBS Tree 단일 preview만 사용한다. | milestone은 시점 중심 문서형 결과가 목적이고, WBS는 일정표보다 계층 구조와 WBS 코드가 먼저 보여야 하기 때문이다. | Locked |
| 2026-04-19 | WBS 오픈소스     | WBS Tree는 `react-d3-tree`를 기본 renderer로 사용하고, 입력은 프로젝트명/구조 유형/항목명/상위 항목/담당자/상태/설명만 노출한다. 내부 `id`, `parentId`, `wbsCode`는 자동 관리한다. | `react-d3-tree`는 MIT 라이선스이며 계층 데이터, custom node rendering, 단일 SVG preview 구성이 쉬워 문서용 WBS Tree와 PNG export 흐름에 맞기 때문이다. | Locked |
| 2026-04-18 | 렌더러 경계      | 화면 로직은 jsGanttImproved/Mermaid를 직접 다루지 않고 renderer adapter 결과만 사용한다.          | DSL 중심 구조와 plugin 확장성을 유지하기 위해서다.                               | Locked |
| 2026-04-18 | 간트 색상 체계   | 기본 palette는 Enterprise Light token과 deterministic task color resolver를 사용한다.             | 문서/PPT에 붙여넣기 좋은 B2B 시각 품질을 유지하기 위해서다.                      | Locked |
| 2026-04-18 | 이미지 출력 UX   | 이미지는 단일 `이미지로 내보내기` 버튼으로 차트 surface만 PNG 다운로드한다.                       | 중복된 버튼과 결과 preview 단계를 줄이고 문서 export 흐름을 단순화하기 위해서다. | Locked |
| 2026-04-18 | 마일스톤 입력    | 마일스톤 UI는 `name/date/section/이전 단계/status/owner/notes`만 노출하고, `id`는 내부 자동 생성한다. `date`는 `YYYY-MM-DD`, status는 planned/on-track/done 스타일 정보로만 사용한다. | milestone-only 데이터가 compact한 차트로 자연스럽게 보이고, 개발자 용어 없이 입력할 수 있어야 하기 때문이다. | Locked |
| 2026-04-18 | 마인드맵 오픈소스 | 마인드맵은 `Mind Elixir`를 기본 renderer로 사용하고, 입력은 좌측 폼/outline, preview는 우측 단일 surface, export는 PNG 1개 흐름으로 구성한다. | `Mind Elixir`는 MIT 라이선스이며 interactive editing, framework-agnostic 구조, PNG/SVG/HTML export, CSS 변수 기반 theme를 공식 문서에서 제공해 문서형 preview와 사용자 편집을 함께 만족시키기 때문이다. | Locked |

## 변경 이력

| 날짜       | 바뀐 결정      | 이전 값                                            | 새 값                                                      | 사유                                                         |
| ---------- | -------------- | -------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| 2026-04-18 | 문서 구조      | 루트에 다수의 중복 markdown                        | 루트 `AGENTS.md`/`README.md` + `docs/` 하위 문서           | Codex가 읽을 기준 문서를 단순화하기 위해서다.                |
| 2026-04-18 | 간트 타입      | 기본/로드맵/마일스톤/진행률/WBS                    | 기본/마일스톤/WBS                                          | 타입별 목적과 입력 방식을 더 명확히 하기 위해서다.           |
| 2026-04-18 | 이미지 출력 UX | 이미지 만들기 후 결과 preview를 보고 다시 다운로드 | 단일 `이미지로 내보내기` 버튼으로 차트만 즉시 PNG 다운로드 | export 흐름을 단순하게 만들고 중복 버튼을 제거하기 위해서다. |
| 2026-04-18 | 간트 확장 렌더러 | milestone/WBS 모두 jsGanttImproved + Mermaid      | milestone은 Mermaid Timeline 단일 preview, WBS는 react-d3-tree 단일 preview | milestone과 WBS 모두 사용자 관점에서 결과물 1개만 보이도록 정리하고, WBS를 일정형이 아닌 계층형 구조로 다시 맞추기 위해서다. |
