# POSE_MAKER_SPEC.md

## 문제 정의

- 문서나 기획안에 넣을 간단한 사람 포즈 이미지를 빠르게 만들 수 있는 브라우저 편집기가 필요하다.
- 외부 캐릭터 모델이나 서버 기능 없이도 2D/3D 두 방향의 포즈 실험이 가능해야 한다.
- 기존 Office Tool 방향인 좌측 편집 + 우측 실시간 preview + PNG export 흐름을 유지해야 한다.

## 사용자 목표

- 프리셋에서 시작해 포즈를 바로 수정한다.
- 2D에서는 관절 핸들을 드래그해 자연스럽게 포즈를 잡는다.
- 3D에서는 primitive mannequin의 관절을 회전시켜 각도를 확인한다.
- 결과를 PNG나 Pose JSON으로 바로 가져간다.

## 오픈소스 비교

| 후보 | 라이선스 | 공식 문서/예시 | 장점 | 단점 | 결론 |
| --- | --- | --- | --- | --- | --- |
| `konva` + `react-konva` | MIT | 공식 문서와 drag/shape 예시 풍부 | 2D canvas 편집, handle drag, Stage export가 안정적 | IK는 직접 구현해야 함 | 2D editor 채택 |
| `three` + `@react-three/fiber` + `@react-three/drei` | MIT | 공식 문서와 primitive/controls 예시 풍부 | React 19 호환, Orbit/TransformControls 조합 가능 | primitive mannequin을 직접 구성해야 함 | 3D editor 채택 |
| `mannequin.js` | GPL-3 | 포즈 데모 존재 | 사람 포즈 도메인에 직접적 | GPL-3로 제품 범위에 부적합 | 제외 |

## 추천 결론

- 2D 편집기는 `konva`/`react-konva`로 구현한다.
- 3D 편집기는 `three`/`@react-three/fiber`/`@react-three/drei`로 구현한다.
- 2D IK는 외부 라이브러리 없이 `lib/pose/ik2d.ts`에서 직접 구현한다.
- 3D는 VRM/GLTF 없이 primitive mannequin만 제공한다.

## 사용자 입력값

- 탭: `2D` / `3D`
- preset
- canvas width / height
- background
- bodyStyle
- skinColor / clothColor / accentColor
- strokeWidth
- showJointHandles
- showSkeleton
- 2D joint 위치
- 3D joint rotation
- Pose JSON import 입력

## 내부 데이터 모델

- `CharacterPoseSpec`
- `Pose2D`, `Pose3D`
- `PoseAppearance`, `PoseCanvas`
- preset 별 기본 pose snapshot

## validation

- `type === "character-pose"`
- `version === 1`
- width/height: `300~2000`
- `strokeWidth`: `1~20`
- `exportPixelRatio`: `1~4`
- color는 CSS color string
- 누락 joint, 잘못된 mode/preset/background 값 금지

## preview 정의

- preview는 우측 1개 영역 안에서 `2D/3D` 탭으로 전환한다.
- 2D는 Konva Stage 기반 단일 preview를 사용한다.
- 3D는 R3F Canvas 기반 단일 preview를 사용한다.
- 탭을 바꿔도 같은 `CharacterPoseSpec`을 공유한다.

## export 정의

- 버튼 이름은 `이미지로 내보내기`
- export 대상은 preview canvas만 포함한다.
- 2D는 Konva Stage `toDataURL({ pixelRatio })`
- 3D는 WebGL canvas `toDataURL("image/png")`
- 기본 파일명은 `character-pose.png`

## 샘플/프리셋 규칙

- `standing`
- `arms-up`
- `pointing-right`
- `pointing-left`
- `presenting`
- `walking`
- `sitting-lite`

처음 진입 시에는 `standing` 프리셋이 자연스럽게 보여야 한다.

## 기존 UI와 맞출 공통 동작

- 상단 toolbar에 preset/reset/mirror/copy/import/export를 둔다.
- 좌측 패널에서 canvas/appearance/joint 값을 편집한다.
- 우측 preview는 넓게 유지하고 export도 같은 surface를 사용한다.
- 색상 입력은 기존 color dialog 방식을 재사용할 수 있게 맞춘다.

## 자동 검증

- lint
- typecheck
- test
- build

## 수동 검증

- 홈 카드에서 `/pose`로 이동되는지
- 2D 탭 드래그로 손목/발목/팔꿈치/무릎/머리 포즈가 바뀌는지
- 3D 탭 joint 선택 후 TransformControls rotate가 동작하는지
- preset/reset/mirror/copy/import/export가 동작하는지
- 기존 `/gantt`가 깨지지 않는지
