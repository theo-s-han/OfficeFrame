# FEATURE_IMPLEMENTATION_PLAYBOOK.md

## 목적

새 기능이나 새 도구를 추가할 때 아래 순서를 반복 적용해서:

- 오픈소스 선택 실수를 줄이고
- 사용자 입력/출력 구조를 먼저 정리하고
- 기존 UI/UX와 동작을 맞추고
- preview/export/debug 회귀를 줄이는 것

이 문서는 특히 시각화 도구, editor shell, preview, PNG export가 들어가는 작업에 기본 플레이북으로 사용한다.

## 언제 이 플레이북을 쓰나

아래 중 하나라도 해당하면 이 문서를 먼저 따른다.

- 새 tool/feature를 추가할 때
- 무료 오픈소스를 선택해야 할 때
- editor shell + preview + export 구조가 들어갈 때
- 기존과 유사한 조작 버튼, 색상 선택, 샘플 데이터, debug mode를 맞춰야 할 때
- renderer를 새로 붙이거나 교체할 때

## 표준 작업 순서

1. 문제를 한 줄로 정의한다.
2. 사용자에게 보여줄 입력값과 숨길 내부값을 나눈다.
3. 오픈소스 후보를 2~3개 조사한다.
4. 라이선스, 유지보수 상태, 공식 예제, export 적합성, React/Next 적합성을 비교한다.
5. 추천 결론을 문서로 먼저 잠근다.
6. preview 1개 기준으로 결과물을 정의한다.
7. PNG export 범위를 preview와 동일하게 정의한다.
8. 기존 shell/action bar/color dialog/debug 방식과 맞춘다.
9. 샘플 데이터와 validation을 먼저 만든다.
10. 구현 후 자동/수동 검증을 수행한다.

## 1. 오픈소스 조사 규칙

### 필수 조사 항목

각 후보마다 최소 아래를 정리한다.

- 이름
- 용도
- 라이선스
- React/Next 호환 여부
- 공식 문서 URL
- 공식 예제 URL 또는 대표 사용 예시
- 마지막 업데이트/유지보수 상태
- 우리 제품 목적과 맞는 이유
- 탈락 이유

### 소스 우선순위

1. 공식 문서
2. 공식 GitHub 저장소
3. npm 패키지 페이지
4. 공식 예제/데모
5. 잘 알려진 사용 사례

### 선택 기준

아래 조건을 많이 만족할수록 우선한다.

- 무료 사용 가능
- 라이선스가 제품 사용에 무리가 없음
- 공식 문서와 예제가 충분함
- 계층/차트/시각화 커스터마이징이 가능함
- DOM/SVG/canvas export 대응이 쉬움
- React 환경에서 wrapper 없이도 다루기 쉬움
- 단일 preview 결과물로 정리하기 좋음

## 2. 입력/출력 분석 규칙

### 입력값 분리

반드시 아래 3층으로 나눈다.

1. 사용자 입력값
2. 내부 모델 값
3. renderer adapter 전용 값

### 사용자 입력값 정의 시 원칙

- 업무 용어를 사용한다.
- 개발자 용어를 직접 노출하지 않는다.
- 사용자가 이해할 수 없는 `id`, `parentId`, `dependsOn`, internal code는 숨긴다.
- 날짜는 가급적 `YYYY-MM-DD` 같은 명시적 형식으로 받는다.
- 선택 가능한 관계값은 자유 텍스트보다 선택 UI를 우선한다.

### 출력값 정의 시 원칙

- preview는 1개만 기본값으로 둔다.
- 사용자는 renderer 이름보다 결과물을 본다.
- preview와 PNG export는 같은 surface를 기준으로 한다.
- 문서/PPT에 붙여 넣었을 때 자연스럽게 보여야 한다.

### 기능 문서에 꼭 들어가야 할 항목

- 사용자 입력값
- 숨겨진 내부값
- validation 규칙
- 샘플 데이터 규칙
- preview 정의
- export 정의

## 3. 기존 UI/UX와 맞추는 규칙

새 기능은 특별한 이유가 없으면 기존 툴 패턴을 재사용한다.

### 공통 shell

- 기존 editor shell 구조를 우선 재사용한다.
- action bar는 `예시 데이터`, `전체 초기화`, `이미지로 내보내기`를 기본으로 한다.
- preview와 입력 패널의 역할이 명확해야 한다.
- 가능하면 preview는 메인 결과물, editor는 보조 입력 영역으로 둔다.

### 공통 상호작용

- 색상 변경이 필요하면 기존 color dialog/preset/HEX 입력 방식을 우선 재사용한다.
- debug mode는 opt-in만 허용한다.
- 내부 renderer 이름, raw DSL, 디버그용 메타 정보는 기본 UI에 노출하지 않는다.
- invalid 입력은 즉시 보이되 preview를 완전히 깨뜨리지 않게 한다.

### 공통 export

- 버튼 이름은 `이미지로 내보내기`로 통일한다.
- chart 전체 레이아웃이 아니라 chart surface만 export한다.
- preview와 다른 전용 export 레이아웃을 만들지 않는다.

## 4. 구현 구조 규칙

### adapter 경계

- 화면 로직과 외부 라이브러리를 직접 섞지 않는다.
- renderer adapter 또는 model helper로 감싼다.
- UI는 adapter 결과를 소비하는 쪽으로 유지한다.

### single preview 우선

- 같은 데이터를 여러 renderer로 동시에 보여주지 않는다.
- preview가 2개 이상이면 특별한 이유와 사용자 가치가 있어야 한다.
- 문서형 결과가 목표면 문서형 renderer 하나를 우선한다.

### 상태 변경 안정성

- 클릭/드래그 중 선택 상태가 유지되어야 한다.
- 잘못된 값이 들어오면 이전 값으로 되돌릴 수 있어야 한다.
- drag/edit 때문에 전체가 다시 그려져 편집이 끊기지 않게 한다.

## 5. 과거 이슈 기반 회피 규칙

아래 항목은 실제로 문제를 만들었던 패턴이므로 새 기능에서도 기본 금지 또는 사전 점검 대상으로 본다.

### 금지/주의 패턴

- preview 2개를 동시에 노출하는 구조
- renderer 이름을 사용자에게 그대로 보여주는 구조
- 개발자 중심 필드를 입력 UI에 그대로 노출하는 구조
- preview와 export가 서로 다른 DOM을 기준으로 동작하는 구조
- chart가 아니라 여백 많은 레이아웃 박스를 export하는 구조
- export 시 검은 배경 또는 빈 이미지가 나오는 구조
- invalid 값 때문에 preview 데이터 전체가 사라지는 구조
- status를 스타일이 아니라 구조 row로 써서 화면이 늘어나는 구조
- self dependency, missing dependency, hierarchy cycle을 막지 않는 구조
- 샘플 데이터가 너무 빈약해서 첫 진입 화면이 어색한 구조

### 반드시 넣어야 하는 방어 장치

- strict validation
- invalid edit rollback 또는 차단
- deterministic color assignment
- compact but believable sample data
- preview surface 기반 export test
- 선택 상태 유지 test

## 6. 샘플 데이터 규칙

샘플 데이터는 단순 placeholder가 아니라 “첫 화면 품질”을 책임진다.

- 처음 진입했을 때 결과물이 바로 그럴듯해야 한다.
- 날짜/계층/관계 간격은 너무 촘촘하거나 너무 넓지 않게 한다.
- 색상/상태/섹션/계층이 자연스럽게 읽히도록 구성한다.
- status는 row 수를 늘리는 용도로 쓰지 않는다.
- 샘플이 실제 validation 규칙을 통과해야 한다.

## 7. 테스트 체크리스트

새 기능에는 최소 아래를 맞춘다.

### 자동 검증

- lint
- typecheck
- test
- build

### 기능 테스트

- 기본 shell 렌더링
- 예시 데이터/초기화/이미지 내보내기 버튼 동작
- 사용자 입력 필드만 노출되는지
- 내부 필드가 숨겨지는지
- validation 에러 표시
- preview 1개만 보이는지
- export가 preview와 같은 surface를 기준으로 하는지

### 회귀 테스트

- preview와 export의 가로/세로 비율이 크게 어긋나지 않는지
- invalid 입력 후에도 마지막 정상 상태가 유지되는지
- 선택/포커스가 편집 중 사라지지 않는지
- debug mode가 기본 사용자 흐름에 영향을 주지 않는지

## 8. 문서 반영 규칙

새 기능이나 큰 구조 변경을 끝내면 아래를 확인한다.

- `docs/project/DECISIONS.md`에 선택한 오픈소스와 이유를 잠가야 하는가
- `docs/product/UIUX_SPEC.md`에 사용자 입력/preview 규칙을 반영해야 하는가
- `docs/engineering/TESTING.md`에 수동 검증 항목을 추가해야 하는가
- 별도 기능 명세가 필요하면 `docs/product/<FEATURE>_SPEC.md`를 추가해야 하는가
- 큰 작업이면 `docs/engineering/PLANS.md` 상태를 갱신해야 하는가

## 9. 기능 추가 전 템플릿

아래 템플릿을 복사해서 기능 명세 초안으로 시작한다.

```md
# <FEATURE>_SPEC.md

## 문제 정의

## 사용자 목표

## 오픈소스 후보 비교
| 후보 | 라이선스 | 공식 문서/예제 | 장점 | 단점 | 결론 |

## 추천 결론

## 사용자 입력값

## 숨길 내부값

## validation

## preview 정의

## export 정의

## 샘플 데이터 규칙

## 기존 UI와 맞출 공통 동작

## 자동 검증

## 수동 검증
```

## 10. 완료 기준

아래를 만족해야 “반복 가능한 방식으로 구현됐다”고 본다.

- 오픈소스 선택 근거가 문서에 남아 있음
- 사용자 입력값과 내부값이 분리되어 있음
- preview가 1개로 명확함
- export가 preview와 같은 surface를 사용함
- 샘플 데이터가 자연스럽게 보임
- validation과 rollback 전략이 있음
- 기존 버튼/색상/debug 패턴과 충돌하지 않음
- 테스트와 문서가 함께 갱신됨
