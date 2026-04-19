# POSE_2D_HUMANOID_SPEC.md

## 문제 정의

`/pose`의 2D 사람 포즈는 더 이상 stick figure 중심으로 보이면 안 된다.
사용자는 관절을 드래그할 때 사람 캐릭터가 실제로 포즈를 취하는 것처럼 느껴야 한다.

## 목표

- 기존 joint drag, IK, preset, mirror, PNG export, JSON import/export 흐름을 유지한다.
- 기본 preview를 사람형 캐릭터로 보이게 한다.
- 최소 3종 이상의 캐릭터 모형을 선택할 수 있게 한다.
- 외부 asset이 없거나 깨져도 built-in 캐릭터로 안전하게 fallback 한다.

## 현재 구현 원칙

1. 2D 렌더러는 `konva` / `react-konva` 기반을 유지한다.
2. 기본 렌더러는 built-in 사람형 캐릭터다.
3. built-in 선택지는 아래 4종이다.
   - `builtin-cartoon`
   - `builtin-office`
   - `builtin-casual`
   - `builtin-hero`
4. 첫 외부 스타일 pack으로 `open-peeps-lite` segmented SVG asset을 제공한다.
5. 외부 asset은 `/public/assets/pose/2d/human` 아래 same-origin segmented SVG/PNG만 허용한다.
6. Open Peeps / Humaaans 공식 샘플 SVG는 `reference/` 폴더에 참고용으로만 둔다.
7. skeleton line은 `showSkeleton=true`일 때만 보이는 debug overlay다.
8. joint handle은 `showJointHandles=true`일 때만 보이는 편집 overlay다.

## 캐릭터 표현 규칙

- 팔, 다리, 손, 발, 몸통, 머리는 joint 좌표를 따라 움직인다.
- 팔꿈치, 무릎, 어깨, 골반에는 joint cap을 두어 꺾이는 부위가 끊겨 보이지 않게 한다.
- built-in variant마다 머리카락과 torso 장식이 달라야 한다.
- 캐릭터마다 색상 시스템은 공유하되, 실루엣과 의상 디테일은 달라야 한다.

## 무료 asset 조사 결과 반영

| 후보 | 공식 URL | 라이선스 | 이번 단계 처리 |
| --- | --- | --- | --- |
| Open Peeps | https://openpeeps.com/ | CC0 | 공식 샘플 SVG를 reference로 저장, full rig는 수동 온보딩 |
| Humaaans | https://www.humaaans.com/ | CC0 | 공식 샘플 SVG를 reference로 저장, full rig는 수동 온보딩 |
| Kenney Toon Characters | https://kenney.nl/assets/toon-characters | CC0 | 후속 온보딩 후보 |

## 입력값

- `human2dModel.assetId`
- `human2dModel.showCharacter`
- `human2dModel.showSkeleton`
- `human2dModel.showJointHandles`
- `human2dModel.skinColor`
- `human2dModel.clothColor`
- `human2dModel.hairColor`
- `human2dModel.accentColor`
- `pose2d` joint coordinates

## 출력값

- 사람형 2D preview
- debug skeleton overlay
- PNG export
- Pose JSON
- asset missing / load warning

## 완료 기준

1. `/pose` 2D human preview가 기본적으로 사람 캐릭터처럼 보인다.
2. built-in 캐릭터를 3종 이상 선택할 수 있다.
3. 관절을 움직일 때 팔꿈치/무릎 접힘이 기존보다 자연스럽다.
4. 외부 segmented asset을 추가하면 selector에 함께 나타난다.
5. asset이 없거나 깨져도 앱이 죽지 않는다.
6. PNG export와 JSON 흐름이 유지된다.
