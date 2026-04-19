# TIMELINE_FEATURE_SPEC.md

## 문제 정의

타임라인은 간트차트처럼 일정 막대를 세밀하게 편집하는 도구가 아니라, 사건/단계/릴리즈 흐름을 문서형으로 보여주는 도구에 가깝다. Gantt와 같은 renderer를 그대로 쓰면 기능 차이가 흐려지고, Mermaid Timeline만 바로 쓰면 입력 편의성과 상호작용이 약해진다.

목표는 타임라인을 다음 흐름으로 만드는 것이다.

입력 -> preview 1개 -> PNG 다운로드

## 사용자 목표

- 날짜 중심 이벤트를 쉽게 입력한다.
- 흐름을 카드형 timeline으로 본다.
- 문서/PPT용 이미지로 저장한다.

## 오픈소스 후보 비교

| 후보 | 라이선스 | 공식 문서/예시 | 장점 | 단점 | 결론 |
| --- | --- | --- | --- | --- | --- |
| `react-chrono` | MIT | [GitHub](https://github.com/prabhuignoto/react-chrono), [storybook examples](https://github.com/prabhuignoto/react-chrono-storybook) | horizontal/vertical/alternating 모드, theme 제어, timeline 전용 디자인, React 친화적 | 일정 막대/리소스 그룹형 timeline에는 맞지 않음 | 추천 |
| `react-calendar-timeline` | MIT | [GitHub](https://github.com/namespace-ee/react-calendar-timeline) | 그룹/아이템 기반 일정형 timeline, 시간 축 제어 강함 | 간트차트와 인상이 가까워지고 문서형 카드 결과가 덜 정돈됨 | 일정형 대안 |
| `Mermaid Timeline` | MIT | [Official docs](https://mermaid.js.org/syntax/timeline.html) | 정적 문서화 간단, section 색상 지원 | 공식 문서 기준 experimental 성격이 남아 있고 입력 editor형 UI와 거리가 있음 | 보조 후보 |

## 추천 결론

타임라인은 `react-chrono`를 기본 renderer로 선택한다.

선택 이유:

1. timeline 전용 결과물이 가장 자연스럽다.
2. horizontal/vertical/alternating 모드를 통해 화면 밀도 조절이 쉽다.
3. theme 제어가 가능해서 기존 Enterprise Light 색 체계와 맞추기 좋다.
4. preview 1개와 PNG export 중심 UX에 잘 맞는다.

## 사용 예시 해석

- 공식 README는 horizontal, vertical, alternating, horizontal-all 모드를 제공한다.
- theme, toolbar, search, custom content 등 확장 포인트가 있다.
- storybook examples는 제품 이력, 역사 이벤트, 릴리즈 흐름 같은 문서형 사용 사례를 보여준다.

제품 적용 해석:

- v1 타임라인은 "day-level event timeline"을 기준으로 잡는다.
- range scheduling이 아니라 문서형 chronology를 우선한다.
- 필요 시 나중에 schedule-heavy timeline은 별도 타입으로 분리한다.

## 사용자 입력값

- 타임라인명
- 항목명
- 날짜
- 섹션
- 상태
- 담당자
- 설명
- 색상

### v1 비목표

- 간트차트 수준의 start/end drag 편집
- 그룹별 리소스 캘린더
- 다중 축 스케줄링

## 숨길 내부 값

- `id`
- `sortOrder`
- renderer 내부 index
- normalized date key

## 내부 데이터 모델

```ts
type TimelineItem = {
  id: string;
  name: string;
  date: string;
  section?: string;
  status?: "planned" | "active" | "done";
  owner?: string;
  notes?: string;
  color?: string;
  order: number;
};
```

## validation

- 항목명 필수
- `date`는 `YYYY-MM-DD`
- 중복 id 금지
- 같은 날짜 다중 항목 허용
- section 비어 있으면 기본 section으로 묶음
- 잘못된 날짜 입력은 preview 반영 전 차단

## preview 정의

- preview는 1개만 사용한다.
- 기본은 horizontal 또는 alternating 문서형 레이아웃을 우선 검토한다.
- 날짜 순서대로 정렬한다.
- section 단위 grouping이 읽혀야 한다.
- status는 배지/톤 차이로만 보여준다.
- owner/notes는 기본 preview에서 과하지 않게 축약한다.

## export 정의

- `이미지로 내보내기` 버튼으로 현재 timeline surface만 PNG 저장
- preview 비율과 export 비율을 최대한 맞춘다
- card area 바깥 빈 레이아웃은 포함하지 않는다

## 샘플 데이터 규칙

- 6~8개 이벤트
- 전체 범위 4~8주 정도
- 3~5개 section
- 날짜 간격은 4~10일
- planned/active/done 상태가 자연스럽게 섞여야 함

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

- 예시 데이터 진입 시 첫 화면이 휑하지 않은가
- 날짜 순서가 자연스럽게 정렬되는가
- 색상 변경이 card/marker에 안정적으로 반영되는가
- 이미지 내보내기가 preview와 같은 영역만 저장하는가
