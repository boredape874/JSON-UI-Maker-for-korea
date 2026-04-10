# MCBE Add-On Tool Suite 전환 계획

작성일: 2026-04-10

## 목표

현재 `JSON-UI-Maker-for-korea`를 단일 JSON UI 편집기에서 **Minecraft Bedrock Edition 복합 애드온 제작 도구**로 확장한다.

목표 범위는 다음과 같다.

- Bedrock JSON UI 제작
- Resource Pack 제작
- Behavior Pack 제작
- 애드온 패키징 및 `.mcaddon` export
- PMMP 서버 운영자가 바로 쓸 수 있는 UI/스크립트/명령 helper 생성

핵심 방향은 `bridge.`처럼 프로젝트 단위로 RP/BP를 다루되, `JSON UI`, `HUD`, `Chest UI`, `9Slice`, `Glyph` 같은 우리가 이미 만든 강점을 중심으로 확장하는 것이다.

더 정확한 제품 감각은 **MCreator식 요소 생성 흐름 + bridge식 프로젝트/파일 UI**다.

- MCreator 느낌:
  - 사용자가 `Item`, `Block`, `Recipe`, `Weapon`, `Food`, `Ore`, `Chest Screen`, `HUD` 같은 제작 대상을 고른다.
  - 각 대상은 form 기반 generator로 만든다.
  - 결과는 BP/RP 파일로 프로젝트에 추가된다.
- bridge 느낌:
  - 왼쪽에는 pack/project explorer가 있다.
  - 가운데는 현재 파일/도구 editor가 열린다.
  - 오른쪽은 properties/inspector/schema helper가 붙는다.
  - 최종 결과는 프로젝트 단위로 검증하고 export한다.

즉 UX는 `bridge.`처럼 진지한 IDE 느낌을 유지하되, 제작 흐름은 `MCreator`처럼 “무엇을 만들지 고르고 폼으로 생성”하는 방식이 맞다.

## 참고 도구 조사 요약

### bridge-core/editor

링크: https://github.com/bridge-core/editor

성격:

- Minecraft Add-On editor
- TypeScript/Vue/Rust 기반
- Tauri 포함
- `bridge. v2`로 운영되는 본격적인 MCBE 애드온 IDE
- GPL-3.0

참고할 점:

- 프로젝트 단위 애드온 관리
- 파일 트리 기반 RP/BP 편집
- JSON 중심 편집 + 초보자용 트리 편집
- extension 구조
- editor data / schema 기반 자동완성
- 웹앱/PWA/데스크톱 앱을 같이 고려하는 구조

주의할 점:

- GPL-3.0이므로 코드를 직접 가져와 섞는 것은 우리 프로젝트 라이선스 전략을 강하게 제약한다.
- 따라서 직접 이식보다 **아키텍처 참고**가 맞다.

우리 프로젝트 적용 방향:

- `bridge.`의 “전체 IDE” 방향을 따라가되, 구현은 별도로 한다.
- `Project Explorer`, `Pack Builder`, `Schema-driven Form`, `Export Pipeline`만 개념적으로 참고한다.

### gamezaSRC/JSON-UI-Web-Editor

링크: https://github.com/gamezaSRC/JSON-UI-Web-Editor

성격:

- Minecraft Bedrock JSON UI용 웹 비주얼 에디터
- Vite + TypeScript + CSS
- `src/core`, `src/ui`, `src/types`, `src/styles` 구조
- Monaco Editor 사용
- MIT 라이선스 표시

참고할 점:

- JSON UI 전체를 웹에서 편집하는 방향
- 비주얼 편집 + 코드 편집 조합
- JSON UI control tree 모델 설계 참고 가능

주의할 점:

- GitHub 페이지는 MIT로 표시되지만 `package.json`의 license 표기와 다를 수 있으므로 통합 전 확인 필요

우리 프로젝트 적용 방향:

- Chest UI 구조 빌더를 고도화할 때 control tree 모델 참고
- Monaco 기반 JSON 편집 패널을 도입할 때 참고
- `hud_screen.json`, `chest_screen.json`, `server_form.json`을 같은 구조 모델로 다루는 방향에 유용

### boredape874/mcbe-web-tools

링크: https://github.com/boredape874/mcbe-web-tools

성격:

- 사용자 소유/관리 계열 도구 모음
- MIT 라이선스 표시
- 포함 도구:
  - `chest-ui-editor-beta`
  - `chest-ui-editor`
  - `9slice`
  - `player-heads`
  - `textures-to-glyph`
  - `web-editor`

참고할 점:

- 이미 우리 프로젝트에 일부 통합한 도구들의 원천
- 독립 정적 웹앱을 host 방식으로 붙이는 사례
- `Chest UI Editor`, `9Slice`, `Textures to Glyph`는 JSON UI Maker와 직접 연관성이 높음

우리 프로젝트 적용 방향:

- 단기적으로는 vendor 통합 유지
- 중기적으로는 `iframe/vendor` 방식에서 벗어나 공용 프로젝트 모델로 흡수
- `textures-to-glyph`, `player-heads`도 RP Tools로 분류해 통합 후보로 둔다

### Blockbench

링크: https://github.com/JannisX11/blockbench

성격:

- low-poly 3D model editor
- Minecraft Java/Bedrock 전용 format 지원
- 웹앱과 Electron 앱 모두 지원
- Plugin API 제공
- GPL-3.0

참고할 점:

- 모델/텍스처/애니메이션은 외부 전문 도구에 맡기는 편이 낫다.
- Blockbench plugin/export 연동이 현실적이다.
- 모델 제작 자체를 우리 앱에 내장하려 하기보다 `.geo.json`, texture, animation 파일 import/export를 지원하는 쪽이 맞다.

우리 프로젝트 적용 방향:

- `Model Tools`는 직접 구현 우선순위 낮음
- 대신 Blockbench output import:
  - `models/entity/*.geo.json`
  - `textures/entity/*.png`
  - `animations/*.json`
  - `animation_controllers/*.json`
- 장기적으로 “Blockbench에서 내보낸 파일을 BP/RP 프로젝트에 자동 배치” 기능 추가

### MCreator

링크: https://github.com/MCreator/MCreator

성격:

- Minecraft Java mod, Bedrock Add-On, resource pack, data pack 제작용 통합 도구
- GUI + code editor
- Java/Freemarker 기반

참고할 점:

- “요소 단위 생성기” 방식이 강하다.
- item, block, recipe, loot table, entity 등을 각각 생성하고 프로젝트에 추가하는 흐름은 우리에게도 적합하다.

주의할 점:

- Minecraft Java 중심 영역이 섞여 있다.
- 상표/브랜드 파일은 별도 취급이 필요하다는 고지가 있다.

우리 프로젝트 적용 방향:

- 구현 자체를 참고하기보다 UX 구조만 참고한다.
- `Add Element` 방식:
  - Item
  - Block
  - Recipe
  - Loot Table
  - Entity
  - Feature
  - JSON UI Screen

### GassieBeansMinecraftModMakersV1

링크: https://hellowgoghey.github.io/GassieBeansMinecraftModMakersV1/

성격:

- MCBE 애드온 제작 도구 모음 허브
- 확인된 도구:
  - Structure Maker v3
  - Structure Maker v2
  - Armor & Tools v2
  - Ore Maker
  - Weapon Maker
  - Food Maker

참고할 점:

- 도구 허브 UX
- 특정 제작 목적별 독립 generator
- “사용자가 만들고 싶은 대상” 중심의 진입점

우리 프로젝트 적용 방향:

- 상단 도구 목록을 무한히 늘리는 대신, 카테고리형 허브로 재구성
- BP Tools에 `Item Maker`, `Weapon Maker`, `Food Maker`, `Ore Maker` 같은 목적 기반 generator 추가

### kaisnbteditor

링크: https://kaim-ru.github.io/kaisnbteditor/

성격:

- React/Vite 기반 NBT/SNBT 편집기
- 번들 분석상 Bedrock NBT, SNBT, compound tag, inventory/item slot 편집 코드 포함
- `structure.palette.default.block_position_data`, `block_entity_data.Items` 같은 Bedrock structure NBT 흐름을 다룸

참고할 점:

- `.mcstructure` 또는 SNBT 기반 slot 데이터 수정
- block entity inventory의 `Items`와 `Slot` 관리
- Chest UI Editor와 연결하면 “UI의 collection_index”와 “실제 container item slot”을 같이 다룰 수 있음

우리 프로젝트 적용 방향:

- `Data Tools`로 분류
- `.mcstructure` inspector/editor 후보
- 장기적으로 Chest UI Editor와 연결:
  - UI slot index
  - block entity item slot
  - preview item data

### Mojang/bedrock-samples

링크: https://github.com/Mojang/bedrock-samples

성격:

- Mojang 공식 Bedrock sample pack 저장소
- RP/BP 구조, textures, ui, behaviors 참고 기준

우리 프로젝트 적용 방향:

- generator의 기본 스키마/샘플 경로 기준으로 사용
- export 구조 검증용 fixture로 사용
- `manifest.json`, `items`, `blocks`, `recipes`, `ui` 기본 템플릿 작성 시 참고

## 제품 방향

이 프로젝트는 `bridge.`를 그대로 복제하는 방향이 아니라, 다음처럼 포지셔닝한다.

- `bridge.`: 범용 MCBE Add-On IDE
- `MCreator`: 요소 단위 generator 중심 제작 도구
- `JSON-UI-Maker-for-korea`: 서버 운영자/리소스팩 제작자 친화형 MCBE RP/BP 제작 웹 IDE

차별점:

- Bedrock JSON UI에 강함
- HUD/title/actionbar/chest UI 같은 실제 서버 운영 UI 제작에 집중
- PMMP helper 코드까지 생성
- `.mcaddon` export를 웹에서 빠르게 제공
- 초보자용 generator와 고급 JSON 편집을 같이 제공

UI 방향:

- 전체 레이아웃은 `bridge.`에 가깝게 간다.
- 제작 플로우는 `MCreator`에 가깝게 간다.
- 기능 모듈은 현재 프로젝트의 HUD/Chest/Glyph/9Slice처럼 작은 specialist tool을 유지한다.
- 최종 저장/검증/export는 하나의 Addon Project가 담당한다.

## 목표 아키텍처

### 0. 화면 구조

추천 레이아웃은 다음과 같다.

```text
┌─────────────────────────────────────────────────────────────┐
│ Top Bar: Project / Export / Tool Search / Pack Validation    │
├───────────────┬─────────────────────────────┬───────────────┤
│ Project Tree  │ Active Tool / File Editor    │ Inspector     │
│               │                             │               │
│ RP            │ JSON UI Editor               │ Schema        │
│ BP            │ HUD Editor                   │ Properties    │
│ Assets        │ Chest Screen Builder         │ Errors        │
│ Tools         │ Item Maker                   │ PMMP Helper   │
└───────────────┴─────────────────────────────┴───────────────┘
```

bridge식 UI 요소:

- pack explorer
- active editor tab
- schema/error panel
- project validation
- extension/tool registry

MCreator식 UI 요소:

- `Add Element` 버튼
- element type 선택
- wizard/form generator
- generated file preview
- pack에 자동 등록

### 1. Addon Project 모델

현재 각 도구가 따로 결과물을 만드는 구조를 `Addon Project`로 통합한다.

```ts
type AddonProject = {
  id: string;
  name: string;
  description: string;
  rp: ResourcePackProject;
  bp: BehaviorPackProject;
  assets: ProjectAsset[];
  uiFiles: ProjectJsonFile[];
  behaviorFiles: ProjectJsonFile[];
  resourceFiles: ProjectJsonFile[];
};
```

필수 기능:

- 프로젝트 생성
- 프로젝트 저장/불러오기
- 브라우저 localStorage/IndexedDB 저장
- ZIP import/export
- `.mcpack`, `.mcaddon` export

### 2. Pack File System

가상 파일 시스템을 둔다.

```ts
type ProjectFile = {
  path: string;
  kind: "json" | "png" | "text" | "binary";
  sourceTool?: string;
  content: unknown;
};
```

예시 경로:

- `resource_pack/manifest.json`
- `resource_pack/ui/hud_screen.json`
- `resource_pack/ui/chest_screen.json`
- `resource_pack/textures/ui/custom_button.png`
- `behavior_pack/items/custom_sword.json`
- `behavior_pack/recipes/custom_sword.json`

### 3. Tool Registry

도구를 독립적으로 등록한다.

```ts
type ToolModule = {
  id: string;
  category: "ui" | "resource_pack" | "behavior_pack" | "data" | "export";
  title: string;
  open(project: AddonProject): void;
  commit?(project: AddonProject): ProjectPatch;
};
```

도구는 직접 파일을 다운로드하지 않고, 기본적으로 `ProjectPatch`를 반환한다.

### 4. Export Pipeline

모든 도구 결과는 export 단계에서 합쳐진다.

출력:

- RP only `.mcpack`
- BP only `.mcpack`
- RP+BP `.mcaddon`
- 개발용 ZIP

필수 검증:

- `manifest.json` uuid/version 존재
- `ui/_ui_defs.json` 참조 파일 존재
- `textures/` 경로 존재
- BP/RP dependency uuid 일치
- JSON parse 가능 여부

## 도구 카테고리 설계

### UI Tools

우선순위 높음.

- JSON UI Editor
- HUD Editor
- Chest UI Editor
- Chest Screen Builder
- 9Slice Editor
- Glyph Editor
- Texture to Glyph
- Server Form Editor

핵심 산출물:

- `resource_pack/ui/*.json`
- `resource_pack/textures/ui/*.png`
- `resource_pack/font/glyph_*.png`
- `resource_pack/font/default8.png`

### Resource Pack Tools

- Manifest Generator
- Texture Manager
- Item Texture Generator
- Block Texture Generator
- Sound Definitions Editor
- Text/Lang Editor
- Model Importer

핵심 산출물:

- `resource_pack/manifest.json`
- `resource_pack/textures/item_texture.json`
- `resource_pack/textures/terrain_texture.json`
- `resource_pack/texts/*.lang`
- `resource_pack/sounds/sound_definitions.json`

### Behavior Pack Tools

- Manifest Generator
- Item Maker
- Weapon Maker
- Food Maker
- Block Maker
- Recipe Maker
- Loot Table Maker
- Entity Template Maker
- Feature/Ore Maker

핵심 산출물:

- `behavior_pack/manifest.json`
- `behavior_pack/items/*.json`
- `behavior_pack/blocks/*.json`
- `behavior_pack/recipes/*.json`
- `behavior_pack/loot_tables/*.json`
- `behavior_pack/entities/*.json`
- `behavior_pack/features/*.json`
- `behavior_pack/feature_rules/*.json`

### Data Tools

- NBT/SNBT Editor
- `.mcstructure` Inspector
- Container Slot Editor
- Player Head Generator
- PMMP Helper Generator

핵심 산출물:

- `.mcstructure`
- SNBT text
- JS/PHP helper snippets
- PMMP command examples

## Chest UI Editor/Builder 재설계

현재 `Chest UI Editor`는 단순 배치형 editor 성격이 강하다. 사용자가 요구한 `cooking_pot`류 구조를 일반적으로 만들려면 다음 기능이 필요하다.

### 필요한 구조 편집 요소

- `router rule`
- `panel`
- `image`
- `label`
- `grid`
- `stack_panel`
- `scrolling_panel`
- `collection_panel`
- `common ref`
- `template ref`
- `collection_index`
- `grid_position`
- `ignored`
- `requires`

### 목표 UX

- 기존 `UI Layout` / `Live Preview`를 그대로 사용
- 별도 구조 미리보기 창을 만들지 않음
- 구조 블록도 기존 캔버스에 표시
- 가능한 경우 기존 vendor component visual 재사용
- 고급 구조는 tree editor에서 편집
- export는 다중 파일 지원

### 목표 export

- `ui/_ui_defs.json`
- `ui/chest_screen.json`
- `ui/custom_panel.json`
- 필요하면 `ui/cooking_pot.json` 같은 별도 namespace 파일

## 구현 단계

### Phase 1: 기반 정리

목표:

- Addon Project 모델 추가
- 파일 시스템 추상화 추가
- export pipeline 추가

작업:

- `src/project/addonProject.ts`
- `src/project/projectFileSystem.ts`
- `src/project/exportAddon.ts`
- `src/ui/react/ProjectPanel.tsx`

완료 조건:

- 빈 RP/BP 프로젝트 생성 가능
- `manifest.json` 생성 가능
- `.mcaddon` export 가능

### Phase 2: 기존 UI 도구 프로젝트화

목표:

- HUD Editor, Chest UI Editor, 9Slice, Glyph Editor 결과를 프로젝트에 저장

작업:

- HUD Editor output을 `ProjectPatch`로 변환
- Chest UI Editor output을 `ProjectPatch`로 변환
- 9Slice 결과를 선택 이미지의 `nineslice_size` helper로 저장
- Glyph Editor 결과를 `font/`와 `textures/`에 저장

완료 조건:

- 개별 다운로드 없이 프로젝트 export에 포함 가능

### Phase 3: Chest Screen Builder

목표:

- `cooking_pot` 같은 구조를 일반적으로 만들 수 있게 함

작업:

- control tree model 추가
- router rule UI 추가
- common panel inserter 추가
- stack/grid/scrolling editor 추가
- 다중 파일 export 추가

완료 조건:

- 제목 분기 기반 custom chest screen 생성 가능
- `common.inventory_panel_bottom_half_with_label` 조합 가능
- `collection_index` 기반 슬롯 카드 UI 생성 가능

### Phase 4: BP/RP Generator

목표:

- 애드온 제작 도구로 확장

작업:

- Item Maker
- Food Maker
- Weapon Maker
- Recipe Maker
- Loot Table Maker
- Block Maker
- Ore/Feature Maker

완료 조건:

- RP texture + BP behavior + recipe를 하나의 `.mcaddon`으로 export 가능

### Phase 5: Data Tools

목표:

- Bedrock 구조물/NBT 데이터까지 연계

작업:

- SNBT/NBT editor 통합 검토
- `.mcstructure` import
- block entity `Items` slot editor
- Chest UI `collection_index`와 slot 데이터 매핑

완료 조건:

- `.mcstructure` 안의 container items를 보고 수정 가능

## 라이선스 전략

직접 코드 통합 가능성이 있는 것:

- `boredape874/mcbe-web-tools`: 사용자 관리 저장소, MIT 표시
- `gamezaSRC/JSON-UI-Web-Editor`: MIT 표시, 단 license 표기 불일치 확인 필요

직접 코드 통합을 피하고 참고 위주로 둘 것:

- `bridge-core/editor`: GPL-3.0
- `Blockbench`: GPL-3.0
- `MCreator`: 라이선스/상표/브랜드 고지 복잡

공식 참고 기준:

- `Mojang/bedrock-samples`
- Microsoft Learn Minecraft Creator 문서

## 우선순위 결론

즉시 할 작업:

1. `Addon Project` 모델 추가
2. RP/BP `manifest.json` 생성기 추가
3. `.mcaddon` export pipeline 추가
4. 현재 HUD/Chest/Glyph/9Slice output을 project file로 저장하게 변경

그 다음:

1. Chest Screen Builder를 기존 Chest UI Editor 위에 얹되, 기존 UI Layout/Live Preview를 사용
2. `stack_panel`, `scrolling_panel`, `grid`, `common ref`를 GUI 노드로 추가
3. `chest_screen.json + custom_panel.json + _ui_defs.json` 다중 파일 export 지원

장기:

1. BP Item/Recipe/Block/Feature generator 추가
2. `.mcstructure`/SNBT editor 추가
3. PMMP helper generator 강화

## 최종 방향

프로젝트 이름은 당장은 유지하되, 내부 구조는 다음처럼 본다.

- `JSON UI Maker`: UI Tools의 한 모듈
- `HUD Editor`: UI Tools의 한 모듈
- `Chest UI Editor`: UI Tools의 한 모듈
- `Addon Project`: 전체를 묶는 상위 프로젝트
- `Export`: 최종 `.mcaddon` 생성기

즉 목표 제품은 **Bedrock JSON UI에 강한 MCBE Add-On 제작 웹 IDE**다.
