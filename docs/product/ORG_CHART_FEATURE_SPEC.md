# ORG_CHART_FEATURE_SPEC.md

## 문제 정의

조직도는 WBS처럼 계층 구조를 보여주지만, 사용자가 기대하는 결과는 "업무 조직 관계가 읽히는 카드형 조직도"다. 단순 트리만 보여주면 WBS와 차이가 약해지고, 반대로 개발자용 id/parent 필드를 직접 노출하면 입력이 어려워진다.

목표는 조직도를 다음 흐름으로 만드는 것이다.

입력 -> preview 1개 -> PNG 다운로드

## 사용자 목표

- 사람/부서 관계를 쉽게 입력한다.
- 결과를 문서용 조직도로 바로 확인한다.
- 이미지로 바로 저장한다.

## 오픈소스 후보 비교

| 후보 | 라이선스 | 공식 문서/예시 | 장점 | 단점 | 결론 |
| --- | --- | --- | --- | --- | --- |
| `d3-org-chart` | MIT | [GitHub](https://github.com/bumbeishvili/org-chart), [React integration](https://stackblitz.com/edit/react-ts-9m6w3z?file=index.tsx), [sample data](https://github.com/bumbeishvili/sample-data/blob/main/data-oracle.csv) | 조직도 전용 기능, custom content, expand/collapse, fit screen, export, React 연동 예시 보유 | React 전용 컴포넌트가 아니라 adapter가 필요 | 추천 |
| `react-d3-tree` | MIT | [GitHub](https://github.com/bkrem/react-d3-tree) | 현재 저장소에서 이미 사용 중, 계층 구조 표현 안정적 | 조직도 전용 카드/툴바/fit/export 경험은 직접 많이 만들어야 함 | 대안 |
| `react-org-chart` 계열 | MIT 계열 후보 존재 | 예시 다양함 | React 중심 사용 가능 | 유지보수 편차가 크고 문서/예시 일관성이 약함 | 보류 |

## 추천 결론

조직도는 `d3-org-chart`를 우선 선택한다.

선택 이유:

1. 조직도 전용 라이브러리라 WBS Tree보다 결과물이 더 목적에 맞다.
2. 공식 README에 React integration 예시와 sample data가 있다.
3. expand/collapse, layout 변경, fit screen, export 같은 조직도용 기능이 이미 준비돼 있다.
4. custom content 기반으로 B2B 카드형 노드를 만들기 쉽다.

## 사용 예시 해석

- 공식 sample data는 `id`, `parentId` 기반의 평면 데이터 배열을 사용한다.
- React integration 예시는 wrapper 안에서 chart instance를 만들고 data/render를 갱신한다.
- README의 full functionality 예시는 fit, fullscreen, export, search 같은 조직도 상호작용이 가능함을 보여준다.

제품 적용 해석:

- 사용자는 카드 내용을 입력한다.
- 내부 adapter가 평면 배열 + parent 관계로 변환한다.
- 화면에는 카드형 조직도 1개만 보여준다.

## 사용자 입력값

- 조직명
- 보기 방향
  - 상하
  - 좌우
- 이름/항목명
- 직책
- 상위 항목
- 부서
- 상태
- 설명
- 색상

## 숨길 내부 값

- `id`
- `parentId`
- `depth`
- `sortOrder`
- renderer 내부 좌표값

## 내부 데이터 모델

```ts
type OrgChartNode = {
  id: string;
  parentId: string | null;
  name: string;
  title?: string;
  department?: string;
  status?: "active" | "vacant" | "planned";
  notes?: string;
  color?: string;
  order: number;
};
```

## validation

- 이름 필수
- 직책 또는 부서 중 최소 하나 권장
- root는 최소 1개 필요
- `parentId`는 존재하는 항목만 참조 가능
- 자기 자신을 상위 항목으로 선택 금지
- 순환 계층 금지
- orphan node 금지

## preview 정의

- preview는 1개만 사용한다.
- renderer 이름은 화면에 노출하지 않는다.
- 카드에는 이름, 직책, 부서, 상태 badge를 중심으로 보여준다.
- 설명은 기본 preview에서 축약한다.
- 문서용 이미지에 맞게 흰색/밝은 회색 배경을 유지한다.

## export 정의

- `이미지로 내보내기` 버튼으로 현재 조직도 surface만 PNG로 저장한다.
- 빈 여백까지 함께 저장하지 않는다.
- fit-to-content 기준으로 export 크기를 맞춘다.

## 샘플 데이터 규칙

- root 1개
- 2~3개 본부/부서 그룹
- 총 7~12개 카드
- 직책 단계가 자연스럽게 읽혀야 함
- 상태는 row 증가 용도가 아니라 badge 용도

## 기존 UI와 맞출 공통 동작

- 좌측 editor / 우측 preview shell 유지
- 상단 action bar 유지
- 색상 선택 dialog 재사용
- debug mode opt-in 유지
- preview/export surface 일치 유지

## 자동 검증

- lint
- typecheck
- test
- build

## 수동 검증

- 예시 데이터 진입 시 조직 구조가 바로 읽히는가
- 상위 항목 변경 시 cycle이 차단되는가
- 카드 색상 변경이 preview/export에 함께 반영되는가
- 이미지 내보내기가 조직도 영역만 저장하는가
