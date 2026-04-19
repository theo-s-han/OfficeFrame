# POSE_2D_ASSET_RESEARCH.md

## 목표

- 무료 중심의 2D 사람형 캐릭터 소스를 조사한다.
- 실제로 내려받을 수 있는 범위와, 바로 포즈 편집에 쓸 수 있는 범위를 구분한다.
- `/pose` 2D human renderer의 다음 단계 온보딩 기준을 고정한다.

## 조사 결과

| 후보 | 공식 URL | 라이선스 | 직접 다운로드 가능 여부 | 포즈 편집 적합성 | 결론 |
| --- | --- | --- | --- | --- | --- |
| Open Peeps | https://openpeeps.com/ | CC0 | 공식 페이지에서 개별 샘플 SVG/PNG 직접 다운로드 가능. 전체 라이브러리는 Gumroad/Blush 흐름 필요 | 높음. 공식 설명 자체가 arms/legs/emotions를 섞는 벡터 빌딩 블록 구조 | 참고 자산으로 채택. 샘플은 바로 저장, 전체 팩은 수동 온보딩 |
| Humaaans | https://www.humaaans.com/ | CC0 | 공식 페이지에서 샘플 SVG 직접 다운로드 가능. 전체 라이브러리는 Gumroad/Blush 흐름 필요 | 높음. 공식 설명에 rotate/position 가능한 벡터 파츠 구조 명시 | 참고 자산으로 채택. 샘플은 바로 저장, 전체 팩은 수동 온보딩 |
| Kenney Toon Characters | https://kenney.nl/assets/toon-characters | CC0 | 공식 배포 팩 수동 다운로드 중심 | 중간. 스타일 참고에는 좋지만 자유 포즈용 파츠 분리 추가 작업 필요 | 추후 온보딩 후보 |

## 이번 단계에서 확인한 사실

1. Open Peeps와 Humaaans는 모두 공식 페이지에서 CC0를 명시한다.
2. 두 서비스 모두 공식 샘플 SVG는 직접 same-origin reference로 저장 가능했다.
3. 하지만 실시간 포즈 편집에 바로 넣을 수 있는 "분절 rig" 전체 팩은 공식 Gumroad/Blush 흐름을 거치는 편이라, 무리하게 자동화하면 오히려 불안정하다.
4. 따라서 P0/P1에서는 프로젝트 내부 built-in 캐릭터를 강화하고, 외부 팩은 reference + manifest 규칙으로 받는 구성이 안전하다.

## 현재 저장한 reference

- `public/assets/pose/2d/human/reference/open-peeps/*.svg`
- `public/assets/pose/2d/human/reference/humaaans/*.svg`

이 파일들은 스타일/비율/형태 참고용이며, 아직 live rig asset은 아니다.

## 이번 단계 결과

- `public/assets/pose/2d/human/open-peeps-lite/`에 첫 segmented SVG pack을 추가했다.
- 이 pack은 Open Peeps 공식 샘플을 참고해 프로젝트에서 다시 나눈 수정 버전이며, `/pose` 2D human selector에서 실제 선택 가능하다.
- 목적은 "첫 외부 스타일 기반 pose-ready pack"을 확보하는 것이다.

## 제품 반영 결정

1. 기본 사용자 경험은 built-in 사람형 캐릭터를 최소 3종 이상 제공한다.
2. 외부 무료 팩은 same-origin local asset만 허용한다.
3. 포즈 편집에 연결하는 asset은 반드시 `head/torso/upper-arm/lower-arm/hand/upper-leg/lower-leg/foot` 수준의 분리 파츠를 가져야 한다.
4. reference download와 live rig asset은 문서와 폴더 구조를 분리한다.
5. Open Peeps full library 자동 다운로드는 전제하지 않고, 필요 파츠를 same-origin segmented pack으로 재구성해서 온보딩한다.
