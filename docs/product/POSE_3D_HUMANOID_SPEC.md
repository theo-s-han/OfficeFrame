# POSE_3D_HUMANOID_SPEC.md

## 문제 정의

현재 `/pose`의 3D preview는 primitive mannequin 기반이라 실제 문서/PPT에 바로 붙이기엔 사람처럼 보이지 않는다.
이번 단계에서는 3D 모드를 local asset 기반의 사람형 humanoid model 우선 구조로 확장한다.

## 사용자 목표

- 3D 포즈를 편집할 때 졸라맨이 아니라 사람형 캐릭터를 본다.
- 프리셋, 회전 편집, PNG export, Pose JSON 복사/붙여넣기를 기존 방식대로 유지한다.
- asset이 없더라도 왜 fallback이 보이는지 바로 이해한다.

## 오픈소스 비교

| 후보 | 라이선스 | 공식 문서/예제 | 장점 | 단점 | 결론 |
| --- | --- | --- | --- | --- | --- |
| `@pixiv/three-vrm` | MIT | [npm](https://www.npmjs.com/package/%40pixiv/three-vrm), [GitHub](https://github.com/pixiv/three-vrm) | VRM humanoid bone 접근이 명확하고 Three.js/GLTFLoader와 바로 연결된다 | VRM asset이 실제로 필요하다 | 채택 |
| `GLTFLoader` | Three.js docs 기준 addon | [Three.js docs](https://threejs.org/docs/pages/GLTFLoader.html) | GLB/GLTF skinned model 로드에 표준적이고 fallback asset에도 쓸 수 있다 | bone naming이 제각각이라 매핑 로직이 필요하다 | 채택 |
| primitive mannequin 유지 | 자체 구현 | repo 내부 구현 | asset이 없어도 동작하고 debug에 유리하다 | 사람처럼 보이지 않는다 | fallback 전용 유지 |

## 추천 결론

- 3D 기본 renderer는 `local humanoid asset -> empty state + primitive fallback` 순서로 구성한다.
- VRM은 `@pixiv/three-vrm + GLTFLoader.register(VRMLoaderPlugin)` 조합으로 로드한다.
- GLB/GLTF는 `GLTFLoader`로 로드하고 bone name heuristic으로 joint를 매핑한다.

## asset 정책

- Codex는 외부 asset을 임의로 다운로드하지 않는다.
- 아래 경로에 asset이 있으면 자동으로 로드한다.
- asset이 없거나 로드 실패하면 empty state와 primitive fallback을 보여준다.

```text
public/
  assets/
    pose/
      models/
        human/
          README.md
          osa-sample.vrm
          kenney-sample.glb
          makehuman-sample.glb
```

## 사용자 입력값

- 2D / 3D 탭
- 프리셋
- canvas width / height / background / export pixel ratio
- bodyStyle / skinColor / clothColor / accentColor / strokeWidth
- showJointHandles / showSkeleton
- 3D model source
  - `사람형 asset 자동`
  - `primitive fallback`
- 선택된 joint rotation

## 내부 데이터 모델

- 기존 `CharacterPoseSpec`은 유지한다.
- 3D 렌더링 설정을 위한 model preference를 추가한다.
- VRM은 humanoid normalized bone을 우선 사용한다.
- GLB/GLTF는 generic skeleton bone name heuristic으로 mapping 한다.

## validation

- 기존 `CharacterPoseSpec` validation 유지
- 3D model preference는 허용된 값만 사용
- asset path는 고정된 local candidate만 사용
- humanoid bone mapping이 없으면 사람형 렌더 대신 fallback으로 전환

## preview 정의

- preview는 기존처럼 1개만 유지한다.
- 3D 모드에서:
  1. 사람이 보이는 asset preview
  2. asset 없음/실패 시 안내 문구
  3. 필요 시 primitive fallback

- skeleton helper는 debug/guide 용도이며 기본적으로 사용자가 토글한다.

## export 정의

- export 대상은 preview canvas만 사용한다.
- 사람형 asset preview이든 primitive fallback이든 동일한 canvas export 경로를 사용한다.

## 테스트 기준

- asset candidate 해석
- VRM/GLB/GLTF candidate 우선순위
- bone mapping heuristic
- asset 없음 상태에서 empty state + fallback
- model preference 변경
- 기존 PoseMakerPage test, lint, typecheck, build 유지
