# WBS_TREE_SPEC.md

## 목적

WBS 기능을 일정형 간트가 아니라 계층형 Work Breakdown Structure Tree로 제공한다.

사용자는 구조를 빠르게 입력하고, 문서/PPT에 붙여넣기 좋은 단일 preview를 확인한 뒤 PNG로 저장한다.

## 오픈소스 선택

- 기본 renderer: `react-d3-tree`
- 라이선스: MIT
- 선택 이유:
  - React 환경에서 계층 데이터를 바로 렌더링할 수 있다.
  - `renderCustomNodeElement`로 문서형 카드 노드를 만들기 쉽다.
  - 단일 SVG surface로 preview와 PNG export 대상을 맞추기 좋다.

## 입력 모델

### 사용자에게 보이는 입력

- 프로젝트명
- 구조 유형
  - 산출물형
  - 단계형
- 항목명
- 상위 항목
- 담당자
- 상태
- 설명

### 사용자에게 숨기는 입력

- `id`
- `parentId`
- `wbsCode`
- `depth`
- `sortOrder`

## 내부 규칙

- `id`는 자동 생성한다.
- `parentId`는 상위 항목 선택값으로만 설정한다.
- `wbsCode`는 트리 순서를 기준으로 자동 생성한다.
- 구조 유형은 branch node의 기본 성격을 정한다.
- leaf node는 `work-package`로 본다.

## Preview 규칙

- preview는 1개만 보여준다.
- renderer 이름, raw adapter 정보는 화면에 노출하지 않는다.
- root에는 프로젝트명을 표시한다.
- 각 노드에는 WBS 코드, 항목명, 유형, 선택적 owner/status를 표시한다.
- notes는 카드 안에서 1~2줄 요약만 보여준다.
- 흰색 또는 밝은 회색 배경의 문서형 스타일을 유지한다.

## Validation

- 항목명 필수
- `id` unique
- `parentId` 존재 검증
- 자기 자신을 부모로 선택 금지
- 순환 구조 금지
- 상태값은 `not-started`, `in-progress`, `done`만 허용

## Export

- `이미지로 내보내기`는 preview와 동일한 단일 WBS Tree surface만 PNG로 저장한다.
- 입력 폼과 편집 컨트롤은 export 대상에서 제외한다.

