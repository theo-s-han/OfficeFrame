# DECISIONS.md

## 紐⑹쟻

???뚯씪?먮뒗 ?뺤젙??寃곗젙留?湲곕줉?쒕떎. ?꾩씠?붿뼱, 珥덉븞, TODO??`BACKLOG.md` ?먮뒗 `PLANS.md`???붾떎.

## 湲곕줉 洹쒖튃

- ?곹깭??`Locked`留??ъ슜?쒕떎.
- 寃곗젙??諛붽씀硫?湲곗〈 ?댁슜??吏?곗? 留먭퀬 蹂寃??대젰?쇰줈 ?④릿??
- ?댁쑀 ?녿뒗 寃곗젙???곸? 留먭퀬 洹쇨굅瑜??④퍡 ?④릿??

## 寃곗젙 紐⑸줉

| ?좎쭨       | 二쇱젣             | 寃곗젙                                                                                              | ?댁쑀                                                                             | ?곹깭   |
| ---------- | ---------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------ |
| 2026-04-19 | ?ъ쫰 3D ?щ엺??renderer | `/pose`??3D 湲곕낯 renderer??local VRM/GLB/GLTF humanoid asset ?곗꽑 援ъ“濡??먭퀬, 濡쒖뺄 asset???녾굅??bone mapping???ㅽ뙣?섎㈃ empty state? primitive mannequin fallback???④퍡 ?쒓났?쒕떎. 濡쒕뜑??`@pixiv/three-vrm`? Three.js `GLTFLoader`瑜??ъ슜?쒕떎. | ?щ엺??罹먮┃??preview瑜??곗꽑 ?쒓났?섎릺 ?몃? asset???꾩쓽濡??대젮諛쏆? ?딄퀬???깆씠 ??긽 ?숈옉?댁빞 ?섎ŉ, bone rotation 湲곕컲 preset/edit/export 援ъ“瑜??좎??댁빞 ?섍린 ?뚮Ц?대떎. | Locked |
| 2026-04-18 | ?쒗뭹 諛⑺뼢        | ?ㅽ뵾??臾몄꽌??援ъ“ ?쒓컖???꾧뎄瑜?留뚮뱺??                                                          | ?묒뾽/臾몄꽌/PPT??吏곸젒 遺숈뿬 ?ｊ린 醫뗭? 寃곌낵臾쇱씠 ?듭떖?닿린 ?뚮Ц?대떎.                  | Locked |
| 2026-04-18 | 二쇱슂 ?ъ슜??     | PM, 媛쒕컻 由щ뱶, ?댁쁺 ?대떦 ??臾몄꽌 以묒떖 B2B ?ъ슜??                                                 | ?쇱젙怨?援ъ“瑜?蹂닿퀬?쒕줈 ?먯＜ ?꾨떖?섎뒗 ?ъ슜?먭? ?듭떖?닿린 ?뚮Ц?대떎.                 | Locked |
| 2026-04-18 | ?ㅽ뻾 援ъ“        | ?꾨줎?몄뿏??以묒떖, 諛깆뿏???놁쓬                                                                      | 珥덇린 鍮꾩슜怨?蹂듭옟?꾨? 以꾩씠湲??꾪빐?쒕떎.                                            | Locked |
| 2026-04-18 | AI 湲곕뒫          | ?ㅽ뻾 以??몃? AI/LLM/API 湲곕뒫???쒗뭹???ｌ? ?딅뒗??                                                | 鍮꾩슜, 蹂댁븞, ?ы쁽?? ?뚯뒪??蹂듭옟?꾨? 以꾩씠湲??꾪빐?쒕떎.                             | Locked |
| 2026-04-18 | repo ?꾨왂        | ?⑥씪 repo濡??쒖옉?섎릺 plugin ?뺤옣??怨좊젮?쒕떎.                                                      | 珥덇린 ?띾룄? 怨듯넻 UI ?ъ궗?⑹꽦???곗꽑?섍린 ?꾪빐?쒕떎.                                | Locked |
| 2026-04-18 | 泥??붾㈃          | ????쒕낫??                                                                                      | ?댄썑 ?щ윭 ?꾧뎄濡??뺤옣?섍린 ?쎄린 ?뚮Ц?대떎.                                         | Locked |
| 2026-04-18 | 泥??꾧뎄          | 湲곕낯 媛꾪듃 李⑦듃                                                                                    | ?낅Т ?섏슂媛 紐낇솗?섍퀬 ?낅젰 援ъ“媛 鍮꾧탳???⑥닚?섍린 ?뚮Ц?대떎.                       | Locked |
| 2026-04-18 | 湲곕낯 ?뚮뜑??     | 湲곕낯 ?쇱젙?뺤? Frappe Gantt瑜??ъ슜?쒕떎.                                                            | drag 湲곕컲 ?쇱젙/吏꾪뻾瑜??섏젙???곹빀?섍린 ?뚮Ц?대떎.                                  | Locked |
| 2026-04-18 | 異쒕젰 ?곗꽑?쒖쐞    | 泥?異쒕젰 紐⑺몴??PNG??                                                                             | 臾몄꽌/PPT 遺숈뿬?ｊ린 ?ъ슜?깆씠 媛???믨린 ?뚮Ц?대떎.                                   | Locked |
| 2026-04-18 | ?ㅽ뻾 怨④꺽 踰붿쐞   | Next.js App Router, TypeScript, ??shell, 媛꾪듃 ?먮뵒??shell, registry/model/test/CI源뚯? 援ъ꽦?쒕떎. | MVP ?댁쟾??援ы쁽 媛?μ꽦怨?援ъ“瑜??덉젙?뷀븯湲??꾪빐?쒕떎.                             | Locked |
| 2026-04-18 | 媛꾪듃 ???       | Roadmap?뺢낵 吏꾪뻾瑜?異붿쟻?뺤? ?쒓굅?섍퀬 湲곕낯 ?쇱젙?? 留덉씪?ㅽ넠?? WBS/?④퀎?뺣쭔 ?좎??쒕떎.              | 紐⑹쟻怨??낅젰 諛⑹떇 李⑥씠媛 異⑸텇?섏? ?딆븘 鍮꾩듂??湲곕뒫泥섎읆 蹂댁?湲??뚮Ц?대떎.           | Locked |
| 2026-04-18 | 媛꾪듃 ?뺤옣 ?뚮뜑??| 留덉씪?ㅽ넠?뺤? Mermaid Timeline ?⑥씪 preview留??ъ슜?섍퀬, WBS?뺤? react-d3-tree 湲곕컲 WBS Tree ?⑥씪 preview留??ъ슜?쒕떎. | milestone? ?쒖젏 以묒떖 臾몄꽌??寃곌낵媛 紐⑹쟻?닿퀬, WBS???쇱젙?쒕낫??怨꾩링 援ъ“? WBS 肄붾뱶媛 癒쇱? 蹂댁뿬???섍린 ?뚮Ц?대떎. | Locked |
| 2026-04-19 | WBS ?ㅽ뵂?뚯뒪     | WBS Tree??`react-d3-tree`瑜?湲곕낯 renderer濡??ъ슜?섍퀬, ?낅젰? ?꾨줈?앺듃紐?援ъ“ ?좏삎/??ぉ紐??곸쐞 ??ぉ/?대떦???곹깭/?ㅻ챸留??몄텧?쒕떎. ?대? `id`, `parentId`, `wbsCode`???먮룞 愿由ы븳?? | `react-d3-tree`??MIT ?쇱씠?좎뒪?대ŉ 怨꾩링 ?곗씠?? custom node rendering, ?⑥씪 SVG preview 援ъ꽦???ъ썙 臾몄꽌??WBS Tree? PNG export ?먮쫫??留욊린 ?뚮Ц?대떎. | Locked |
| 2026-04-18 | ?뚮뜑??寃쎄퀎      | ?붾㈃ 濡쒖쭅? jsGanttImproved/Mermaid瑜?吏곸젒 ?ㅻ（吏 ?딄퀬 renderer adapter 寃곌낵留??ъ슜?쒕떎.          | DSL 以묒떖 援ъ“? plugin ?뺤옣?깆쓣 ?좎??섍린 ?꾪빐?쒕떎.                               | Locked |
| 2026-04-18 | 媛꾪듃 ?됱긽 泥닿퀎   | 湲곕낯 palette??Enterprise Light token怨?deterministic task color resolver瑜??ъ슜?쒕떎.             | 臾몄꽌/PPT??遺숈뿬?ｊ린 醫뗭? B2B ?쒓컖 ?덉쭏???좎??섍린 ?꾪빐?쒕떎.                      | Locked |
| 2026-04-18 | ?대?吏 異쒕젰 UX   | ?대?吏???⑥씪 `?대?吏濡??대낫?닿린` 踰꾪듉?쇰줈 李⑦듃 surface留?PNG ?ㅼ슫濡쒕뱶?쒕떎.                       | 以묐났??踰꾪듉怨?寃곌낵 preview ?④퀎瑜?以꾩씠怨?臾몄꽌 export ?먮쫫???⑥닚?뷀븯湲??꾪빐?쒕떎. | Locked |
| 2026-04-18 | 留덉씪?ㅽ넠 ?낅젰    | 留덉씪?ㅽ넠 UI??`name/date/section/?댁쟾 ?④퀎/status/owner/notes`留??몄텧?섍퀬, `id`???대? ?먮룞 ?앹꽦?쒕떎. `date`??`YYYY-MM-DD`, status??planned/on-track/done ?ㅽ????뺣낫濡쒕쭔 ?ъ슜?쒕떎. | milestone-only ?곗씠?곌? compact??李⑦듃濡??먯뿰?ㅻ읇寃?蹂댁씠怨? 媛쒕컻???⑹뼱 ?놁씠 ?낅젰?????덉뼱???섍린 ?뚮Ц?대떎. | Locked |
| 2026-04-18 | 留덉씤?쒕㏊ ?ㅽ뵂?뚯뒪 | 留덉씤?쒕㏊? `Mind Elixir`瑜?湲곕낯 renderer濡??ъ슜?섍퀬, ?낅젰? 醫뚯륫 ??outline, preview???곗륫 ?⑥씪 surface, export??PNG 1媛??먮쫫?쇰줈 援ъ꽦?쒕떎. | `Mind Elixir`??MIT ?쇱씠?좎뒪?대ŉ interactive editing, framework-agnostic 援ъ“, PNG/SVG/HTML export, CSS 蹂??湲곕컲 theme瑜?怨듭떇 臾몄꽌?먯꽌 ?쒓났??臾몄꽌??preview? ?ъ슜???몄쭛???④퍡 留뚯”?쒗궎湲??뚮Ц?대떎. | Locked |

## 蹂寃??대젰

| ?좎쭨       | 諛붾?寃곗젙      | ?댁쟾 媛?                                           | ??媛?                                                     | ?ъ쑀                                                         |
| ---------- | -------------- | -------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| 2026-04-18 | 臾몄꽌 援ъ“      | 猷⑦듃???ㅼ닔??以묐났 markdown                        | 猷⑦듃 `AGENTS.md`/`README.md` + `docs/` ?섏쐞 臾몄꽌           | Codex媛 ?쎌쓣 湲곗? 臾몄꽌瑜??⑥닚?뷀븯湲??꾪빐?쒕떎.                |
| 2026-04-18 | 媛꾪듃 ???     | 湲곕낯/濡쒕뱶留?留덉씪?ㅽ넠/吏꾪뻾瑜?WBS                    | 湲곕낯/留덉씪?ㅽ넠/WBS                                          | ??낅퀎 紐⑹쟻怨??낅젰 諛⑹떇????紐낇솗???섍린 ?꾪빐?쒕떎.           |
| 2026-04-18 | ?대?吏 異쒕젰 UX | ?대?吏 留뚮뱾湲???寃곌낵 preview瑜?蹂닿퀬 ?ㅼ떆 ?ㅼ슫濡쒕뱶 | ?⑥씪 `?대?吏濡??대낫?닿린` 踰꾪듉?쇰줈 李⑦듃留?利됱떆 PNG ?ㅼ슫濡쒕뱶 | export ?먮쫫???⑥닚?섍쾶 留뚮뱾怨?以묐났 踰꾪듉???쒓굅?섍린 ?꾪빐?쒕떎. |
| 2026-04-18 | 媛꾪듃 ?뺤옣 ?뚮뜑??| milestone/WBS 紐⑤몢 jsGanttImproved + Mermaid      | milestone? Mermaid Timeline ?⑥씪 preview, WBS??react-d3-tree ?⑥씪 preview | milestone怨?WBS 紐⑤몢 ?ъ슜??愿?먯뿉??寃곌낵臾?1媛쒕쭔 蹂댁씠?꾨줉 ?뺣━?섍퀬, WBS瑜??쇱젙?뺤씠 ?꾨땶 怨꾩링??援ъ“濡??ㅼ떆 留욎텛湲??꾪빐?쒕떎. |

## 2026-04-19 Additional Locked Decision

- /pose 2D human renderer now defaults to a studio-quality segmented SVG character pack (`studio-office`) instead of the legacy built-in cartoon fallback. Legacy built-in variants stay only for backward compatibility and asset-failure fallback.
- /pose 2D human renderer supports same-origin local segmented SVG/PNG assets from /public/assets/..., and local SVG parts may use token placeholders that are resolved client-side so the existing skin/cloth/hair/accent color controls still work with higher-quality asset packs.
- /pose 2D human renderer ships with at least four studio selectable character variants (`studio-office`, `studio-casual`, `studio-hero`, `studio-neutral`). Open Peeps and Humaaans official sample downloads are stored only as reference assets until they are split into pose-ready rig parts.
- /pose 2D human renderer keeps `open-peeps-lite` as an experimental same-origin segmented SVG pack adapted in-project from Open Peeps reference samples, but it is no longer the visual quality baseline for the default user flow.
- `pose` tool remains implemented as an internal feature, but it is hidden from the public home hub and public legacy tool redirects until the product team decides it is release-ready.
