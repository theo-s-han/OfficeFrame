# FLOWCHART_FEATURE_SPEC.md

## 문제 정의

플로우차트는 조직도나 WBS와 달리 "순서 + 분기 + 연결"이 핵심이다. 따라서 계층 트리 renderer를 재활용하면 목적이 흐려지고, Mermaid 텍스트만 바로 노출하면 입력 난도가 높아진다.

목표는 플로우차트를 다음 흐름으로 만드는 것이다.

입력 -> preview 1개 -> PNG 다운로드

## 사용자 목표

- 단계와 분기를 쉽게 입력한다.
- 시작부터 종료까지 흐름을 한눈에 본다.
- 문서용 이미지로 저장한다.

## 오픈소스 후보 비교

| 후보 | 라이선스 | 공식 문서/예시 | 장점 | 단점 | 결론 |
| --- | --- | --- | --- | --- | --- |
| `@xyflow/react` | MIT | [Open Source](https://xyflow.com/open-source), [Examples](https://reactflow.dev/examples), [Preventing Cycles](https://reactflow.dev/examples/interaction/prevent-cycles) | 노드/엣지 편집, custom node, validation, save/restore, Next/React 친화성, 대규모 사용자층 | 문서형 정적 디자인은 별도 스타일링이 필요 | 추천 |
| `Mermaid Flowchart` | MIT | [Official docs](https://mermaid.js.org/syntax/flowchart.html) | 텍스트 기반이라 정적 문서화에 좋음 | 입력을 직접 편집하기 어렵고 parser 제약이 강함 | doc export 보조 후보 |
| 기타 D3/diagram 계열 | 다양함 | 후보별 편차 큼 | 세밀한 제어 가능 | 현재 저장소와의 통합 비용이 큼 | 보류 |

## 추천 결론

플로우차트는 `@xyflow/react`를 기본 renderer로 선택한다.

선택 이유:

1. 공식 examples가 매우 풍부하다.
2. custom nodes, validation, save/restore, cycle 방지 예시가 준비돼 있다.
3. React/Next 환경에 가장 잘 맞는다.
4. preview 1개만 유지하면서도 클릭/연결/선택 UX를 자연스럽게 만들 수 있다.

## 사용 예시 해석

- official examples는 custom nodes, drag/drop, validation, preventing cycles, save/restore 흐름을 제공한다.
- flowchart용 shape node를 직접 정의할 수 있어 start/process/decision/end를 제품 요구에 맞게 스타일링할 수 있다.
- 연결 validation을 callback으로 제어할 수 있어 self-loop나 잘못된 연결을 막기 쉽다.

제품 적용 해석:

- 사용자는 노드와 연결을 업무 용어로 입력한다.
- adapter가 node/edge 구조로 변환한다.
- preview는 플로우차트 surface 1개만 사용한다.

## 사용자 입력값

- 플로우차트명
- 단계명
- 단계 유형
  - 시작
  - 처리
  - 결정
  - 종료
  - 문서
  - 데이터
- 다음 단계
- 조건 라벨
- 그룹/스윔레인
- 상태
- 담당자
- 설명
- 색상

## 숨길 내부 값

- `nodeId`
- `edgeId`
- `sourceHandle`
- `targetHandle`
- 노드 좌표값
- layout engine 내부 값

## 내부 데이터 모델

```ts
type FlowchartNode = {
  id: string;
  label: string;
  nodeType: "start" | "process" | "decision" | "end" | "document" | "data";
  lane?: string;
  status?: "default" | "active" | "warning";
  owner?: string;
  notes?: string;
  color?: string;
};

type FlowchartEdge = {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
};
```

## validation

- 단계명 필수
- 시작 노드 최소 1개
- 종료 노드 최소 1개
- 자기 자신으로 연결 금지
- 존재하지 않는 source/target 금지
- 시작 노드로 들어오는 선 금지
- 종료 노드에서 나가는 선 금지
- 결정 노드는 분기 라벨 사용 권장
- 끊어진 노드는 경고

참고:

- 순환 연결은 업무 흐름에 따라 허용될 수 있으므로 v1에서는 무조건 금지하지 않고, self-loop만 금지한다.

## preview 정의

- preview는 1개만 사용한다.
- 사용자에게 renderer 이름을 보여주지 않는다.
- 시작/처리/결정/종료 shape 차이가 분명해야 한다.
- owner/notes는 기본 카드에서 최소화한다.
- branch label이 읽히도록 edge label spacing을 확보한다.

## export 정의

- `이미지로 내보내기` 버튼으로 현재 플로우차트 surface만 PNG 저장
- viewport 바깥 빈 canvas는 제외
- fit-to-nodes 이후 export

## 샘플 데이터 규칙

- 7~10개 단계
- 시작/결정/종료 포함
- 최소 1개 분기
- 지나치게 많은 교차선 금지
- 첫 진입 시 왼쪽에서 오른쪽 또는 위에서 아래로 흐름이 자연스럽게 읽혀야 함

## 기존 UI와 맞출 공통 동작

- 좌측 editor / 우측 preview shell 유지
- action bar 유지
- 색상 선택 dialog 재사용
- debug mode opt-in 유지
- preview/export surface 일치 유지

## 자동 검증

- lint
- typecheck
- test
- build

## 수동 검증

- 예시 데이터 진입 시 분기 흐름이 자연스럽게 보이는가
- 노드 유형별 shape 구분이 충분한가
- invalid 연결이 즉시 차단되거나 오류로 표시되는가
- 이미지 내보내기가 빈 canvas를 포함하지 않는가
