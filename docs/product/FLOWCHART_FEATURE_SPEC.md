# FLOWCHART_FEATURE_SPEC.md

## 문제 정의

현재 `/flowchart` 도구는 업무용 프로세스 카드 다이어그램에 가깝다. 단계와 연결을 입력해 흐름 이미지를 만드는 목적은 충족하지만, 플로우차트 작성기라고 부르기 위해 필요한 두 가지가 부족하다.

1. 노드 shape 자체가 의미를 가져야 한다.
2. 결정(조건) 노드는 분기 규칙을 가져야 한다.

즉, `결정` 노드는 단순한 점선 카드가 아니라 다이아몬드여야 하고, 최소 2개 이상의 분기와 분기 라벨을 가져야 한다. `시작/종료`, `처리`, `문서`, `데이터`도 서로 다른 기호로 읽혀야 한다.

이 문서의 목적은 플로우차트 도구를 "업무 흐름 카드"가 아니라 "표준 기호와 분기 의미를 갖는 플로우차트 작성기"로 다시 정의하는 것이다.

## 사용자 목표

- 사용자는 시작부터 종료까지의 절차를 표준 플로우차트 기호로 표현할 수 있어야 한다.
- 사용자는 조건 분기(`예/아니오`, `승인/반려`, `통과/보완`)를 자연스럽게 입력하고 시각적으로 구분할 수 있어야 한다.
- 사용자는 문서/PPT에 붙여 넣기 좋은 단일 preview 이미지를 바로 얻을 수 있어야 한다.
- 사용자는 내부 좌표나 renderer 개념 없이, 업무 용어 중심 입력만으로 차트를 만들 수 있어야 한다.

## 기준이 되는 플로우차트 기능

### V2 필수 기능

아래 기능은 "플로우차트 작성기"라고 부르기 위해 필수다.

1. 표준 shape 구분
   - 시작/종료: terminator
   - 처리: process rectangle
   - 결정: decision diamond
   - 문서: document
   - 데이터 입출력: data / input-output
   - 서브프로세스: predefined process / subprocess

2. 타입별 연결 규칙
   - `start`: 들어오는 연결 없음, 나가는 연결 1개 이상
   - `end`: 나가는 연결 없음
   - `process`, `document`, `data`, `subprocess`: 기본적으로 다음 단계 1개
   - `decision`: 최소 2개 이상의 분기, 분기 라벨 필수

3. 분기 의미 보존
   - 결정 노드의 분기는 edge label로 반드시 표현한다.
   - 기본 분기 라벨 템플릿은 `예/아니오`를 제공하되 자유 텍스트로 변경 가능해야 한다.

4. 시작점 기준 흐름 검증
   - 시작 노드는 정확히 1개를 기본 규칙으로 둔다.
   - 종료 노드는 1개 이상 허용한다.
   - 모든 노드는 시작 노드에서 도달 가능해야 한다.
   - 고립 노드는 허용하지 않는다.

5. 단일 preview + PNG export
   - preview는 1개만 보여 준다.
   - export는 preview와 같은 surface를 PNG로 저장한다.

### 이후 확장 기능

아래 기능은 바로 막지 않지만 V2 필수 범위 밖이다.

- on-page reference / off-page reference
- database
- manual input
- delay / display / annotation
- Mermaid import/export
- drag 기반 직접 연결 편집
- BPMN 수준 이벤트/게이트웨이

## 오픈소스 후보 비교

| 후보 | 역할 | 라이선스 | 공식 문서 | 장점 | 한계 | 결론 |
| --- | --- | --- | --- | --- | --- | --- |
| `@xyflow/react` | 향후 인터랙티브 편집 확장 후보 | MIT | https://reactflow.dev | custom node, connection validation, save/restore, React/Next 적합 | 현재 V2 범위에서는 정적 preview만으로도 요구사항을 만족할 수 있음 | 후보 유지 |
| `elkjs` | 자동 layout 엔진 | EPL-2.0 | https://github.com/kieler/elkjs | layered graph, 방향성 있는 그래프, port/edge routing, 복잡한 분기 layout에 적합 | editor 자체는 없고 레이아웃 전용 | 채택 |
| `Mermaid Flowchart` | 문법 reference 및 향후 import/export 후보 | MIT | https://mermaid.js.org/syntax/flowchart.html | 다양한 flowchart shape 문법, 텍스트 기반 export 후보, 문서 호환성 좋음 | 주 편집기로 쓰기엔 text-first라 입력 UX가 약함 | 보조 채택 |

## 추천 결론

플로우차트 작성기 V2는 다음 조합으로 간다.

1. `elkjs`
   - 우선 레이어드 flow layout 엔진으로 검토하되, 브라우저 런타임에서 지연되면 동일 입력 모델을 쓰는 정적 fallback layout으로 즉시 대체한다.
2. 커스텀 preview surface
   - 표준 shape, 분기 라벨, 선택 상태를 HTML/CSS/SVG 조합으로 직접 그린다.
3. 현재 PNG export 유틸
   - preview surface를 그대로 이미지로 내보낸다.
4. `Mermaid Flowchart`
   - 주 renderer가 아니라 shape vocabulary reference 및 향후 import/export 후보로 사용한다.

핵심 원칙은 오픈소스가 제품 기능을 결정하는 것이 아니라, 제품이 요구하는 플로우차트 규칙을 만족하기 위해 오픈소스를 조합하는 것이다.

## 공식 기능 근거

- Microsoft Visio 기본 플로우차트 가이드는 템플릿이 방향 화살표로 연결된 다양한 기호를 사용한다고 설명한다. 이는 플로우차트가 단순 카드 목록이 아니라 기호 기반 도식이라는 기준을 뒷받침한다.  
  https://support.microsoft.com/en-us/office/create-a-basic-flowchart-in-visio-e207d975-4a51-4bfa-a356-eeec314bd276
- Mermaid 공식 문서는 flowchart에서 rectangle, diamond, document 등 다양한 shape를 제공한다. 이는 V2 shape vocabulary를 정의할 때 참고 기준으로 삼는다.  
  https://mermaid.js.org/syntax/flowchart.html
- React Flow 공식 예제 문서는 `isValidConnection`으로 연결 validation을 구현할 수 있다고 설명한다. 즉, decision 분기 규칙과 self-loop 금지 같은 의미론을 editor 레벨에서 통제할 수 있다.  
  https://reactflow.dev/examples/interaction/validation
- React Flow 공식 layouting 문서는 `elkjs`가 layered layout과 dynamic node sizes, edge routing 같은 복잡한 그래프 정리에 적합하다고 안내한다. 플로우차트 분기 레이아웃에 유리하다.  
  https://reactflow.dev/learn/layouting/layouting

## 사용자 입력값

사용자 입력은 "노드 목록 + 자유 엣지 목록"이 아니라 "단계 중심 입력"으로 재구성한다.

### 공통 입력

- 플로우차트명
- 방향
  - 위에서 아래
  - 왼쪽에서 오른쪽
- lane 모드
  - 사용 안 함
  - 사용함

### 단계 입력

각 단계는 공통 필드와 타입별 필드를 가진다.

공통 필드:

- 단계명
- 단계 유형
- lane (선택)
- 설명 (선택)
- 담당자 (선택)

타입별 필드:

- `start`
  - 다음 단계 1개 이상
- `process`
  - 다음 단계 0~1개
- `document`
  - 다음 단계 0~1개
- `data`
  - 다음 단계 0~1개
- `subprocess`
  - 다음 단계 0~1개
- `decision`
  - 분기 목록
    - 분기 라벨
    - 연결 대상 단계
  - 최소 2개 분기 필수
- `end`
  - 다음 단계 입력 없음

## 내부 모델 값

UI에서는 숨기되 내부적으로는 아래 모델로 변환한다.

```ts
type FlowchartDirection = "TB" | "LR";

type FlowchartNodeType =
  | "start"
  | "process"
  | "decision"
  | "document"
  | "data"
  | "subprocess"
  | "end";

type FlowchartStep = {
  id: string;
  label: string;
  type: FlowchartNodeType;
  lane?: string;
  owner?: string;
  notes?: string;
  nextStepId?: string;
  branches?: Array<{
    id: string;
    label: string;
    targetStepId: string;
  }>;
};

type FlowchartDocument = {
  title: string;
  direction: FlowchartDirection;
  laneMode: boolean;
  steps: FlowchartStep[];
};
```

Renderer 전용 값은 별도로 파생한다.

- node position
- handle id
- edge id
- elk graph options
- preview bounding box

## renderer adapter 값

`FlowchartDocument`를 직접 renderer에 넘기지 않는다. 아래 adapter 단계를 둔다.

1. `FlowchartDocument`
2. normalized graph
   - node/edge
   - type-safe ports
   - lane buckets
3. `elkjs` layout graph 또는 fallback layout result
4. preview nodes/edges/svg layer

이렇게 해야 나중에 Mermaid export를 붙여도 입력 모델을 바꾸지 않아도 된다.

## validation

### 문서 수준

- 플로우차트명은 비어 있을 수 없다.
- 단계는 2개 이상이어야 한다.
- 시작 노드는 정확히 1개여야 한다.
- 종료 노드는 1개 이상이어야 한다.

### 단계 수준

- 단계명은 필수다.
- 단계 id는 unique 해야 한다.
- lane 모드가 켜져 있지 않으면 lane 입력은 export/preview에 반영하지 않는다.

### 타입 규칙

- `start`
  - incoming = 0
  - outgoing >= 1
- `end`
  - outgoing = 0
- `decision`
  - outgoing >= 2
  - branch label은 모두 필수
  - branch label은 decision 노드 안에서 중복 불가
- `process`, `document`, `data`, `subprocess`
  - 기본 outgoing <= 1

### 그래프 규칙

- self-loop 금지
- 존재하지 않는 단계로 연결 금지
- 시작 노드에서 도달할 수 없는 단계 금지
- 고립 노드 금지
- `end`에서 나가는 연결 금지

### cycle 규칙

- loop 자체는 금지하지 않는다.
- 다만 순환은 decision 분기를 통해 발생하는 업무 흐름으로만 허용하는 것을 기본 정책으로 둔다.
- V2 1차 구현에서는 self-loop만 강제 금지하고, 일반 cycle은 warning으로 먼저 노출한다.

## preview 정의

- preview는 1개만 보여 준다.
- shape는 타입별로 명확히 달라야 한다.
  - `start`, `end`: terminator
  - `process`: rectangle
  - `decision`: diamond
  - `document`: document
  - `data`: parallelogram
  - `subprocess`: predefined process
- edge label은 decision 분기에서 항상 보이도록 spacing을 잡는다.
- lane 모드가 켜져 있으면 horizontal swimlane band를 지원한다.
- 선택 상태는 outline/shadow로만 강조하고 shape 의미를 깨지 않는다.

## export 정의

- `이미지로 내보내기`는 현재 preview surface만 PNG로 저장한다.
- toolbar, 입력 패널, debug 요소는 export 대상에서 제외한다.
- `fit-to-content` 후 export 한다.
- lane header, branch label, shape가 preview와 동일하게 나와야 한다.

## 샘플 데이터 규칙

- 7~10개 단계
- 시작 1개, 종료 1개 이상
- decision 1개 이상
- document/data/subprocess 중 2개 이상 포함
- 최소 1개의 `예/아니오` 분기 포함
- loop 예시는 선택 사항이지만, 첫 샘플은 너무 복잡하지 않게 유지한다.

## 기존 UI에 맞출 공통 동작

- 기존 editor shell/action bar 구조를 유지한다.
- `예시 데이터`, `전체 초기화`, `이미지로 내보내기` 버튼 형식은 유지한다.
- debug mode는 opt-in만 허용한다.
- color picker는 핵심 기능이 아니다.
  - V2에서는 단계별 자유 색상보다 타입 shape와 branch 의미가 우선이다.
  - 색상은 선택 상태/강조 용도로만 축소하거나, 전역 테마 수준으로 정리한다.

## 구현 순서

1. 현재 모델을 `FlowchartDocument` 기반으로 교체
2. decision 분기 중심 입력 UI로 재구성
3. 타입별 validation 강화
4. `elkjs` 기반 자동 layout 추가
5. 타입별 실제 shape renderer 구현
6. preview/export 정합성 점검
7. 테스트와 수동 검증 갱신

## 자동 검증

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## 수동 검증

- decision 노드에 분기 1개만 넣으면 즉시 오류가 보이는가
- decision 분기 라벨을 비우면 export 버튼이 비활성화되는가
- start/end/process/document/data/subprocess shape 차이가 명확한가
- lane 모드 on/off에 따라 preview가 자연스럽게 바뀌는가
- PNG export가 preview와 동일한 surface를 저장하는가
