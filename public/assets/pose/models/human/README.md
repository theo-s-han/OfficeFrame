# Human Pose Assets

이 폴더는 `/pose`의 3D 사람형 캐릭터 preview에서 사용하는 local asset 자리입니다.

## 지원 파일명

- `osa-sample.vrm`
- `kenney-sample.glb`
- `makehuman-sample.glb`

앱은 위 순서대로 asset을 찾고, 로드 가능한 첫 번째 사람형 model을 사용합니다.

## 규칙

- Codex는 외부 asset을 자동으로 다운로드하지 않습니다.
- VRM/GLB/GLTF humanoid asset을 직접 넣어야 사람형 preview가 보입니다.
- asset이 없거나 bone mapping이 맞지 않으면 안내 문구와 primitive fallback이 표시됩니다.

## 권장 조건

- skinned humanoid model
- neck / chest(or spine) / hips / upperArm / lowerArm / upperLeg / lowerLeg bone 포함
- 배경 없는 문서/PPT export에 어울리는 neutral pose
