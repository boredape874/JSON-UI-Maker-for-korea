# Bridge식 Workspace 전환 로그

작성일: 2026-04-10

## 목표

`JSON-UI-Maker-for-korea`의 전체 UI를 도구 버튼 중심 화면에서 `bridge.`에 가까운 웹 IDE형 workspace로 전환한다.

제품 감각:

- 기능 생성 흐름은 MCreator처럼 `Add Element / Add Tool / Generator`
- 화면 구조는 bridge처럼 `Explorer / Workspace / Inspector / Output`

## 전환 원칙

- 기존 JSON UI Maker 캔버스 미리보기는 제거하지 않는다.
- 기존 `main_window`, `explorer`, `properties`, `bindings` 같은 DOM id는 유지한다.
- HUD Editor, Chest UI Editor, Glyph Editor, 9Slice 같은 도구는 당장 내부를 갈아엎지 않고 workspace에서 열리는 도구로 유지한다.
- 먼저 shell 레이아웃을 바꾸고, 이후 각 도구를 workspace tab으로 흡수한다.

## 1차 구현 범위

- 기존 `top-navbar`를 command bar처럼 보이게 정리
- 기존 `.main` 영역을 3-pane workspace처럼 보이게 CSS 재구성
- 왼쪽: element/tool/explorer
- 가운데: canvas viewport
- 오른쪽: script/bindings/properties inspector
- 하단 output/log 영역은 다음 단계에서 별도 분리

## 1차 구현 결과

- `App.tsx`
  - `top-navbar`에 `bridgeCommandBar` 클래스 추가
  - 브랜드 영역 `JSON UI Maker / MCBE Add-On Workspace` 추가
  - 기존 `.main`에 `bridgeWorkspace` 클래스 추가
  - 왼쪽 영역을 `bridgeExplorerPane`으로 지정
  - 가운데 캔버스 영역을 `bridgeEditorPane`으로 지정
  - 오른쪽 script/properties 영역을 `bridgeInspectorPane`으로 지정
  - `PropertiesPanel`을 오른쪽 Inspector 내부로 이동
  - 중앙 workspace tab 버튼 추가
- `style.css`
  - bridge식 command bar 색상/버튼 스타일 추가
  - 3-pane grid workspace 추가
  - Explorer / Editor / Inspector 패널 스타일 추가
  - 기존 `main_window` preview는 유지하되 workspace 안에서 반응형으로 보이게 조정

## 1차 구현에서 의도적으로 안 한 것

- 기존 HUD/Chest/Glyph/9Slice 내부 구조는 아직 건드리지 않음
- workspace tab의 실제 상태 모델은 아직 없음
- 하단 Output/Validation 패널은 아직 분리하지 않음
- Addon Project 모델은 아직 실제 코드로 만들지 않음

## 다음 단계

1. Workspace tab model 추가
2. 도구 버튼을 Tool Explorer로 이동
3. HUD/Chest/Glyph/9Slice를 탭으로 열기
4. Inspector에 `Properties / Export / Errors / PMMP Helper` 탭 추가
5. Addon Project 모델과 `.mcaddon` export 연결

## 2차 구현 범위

- workspace tab을 단순 버튼에서 React state 기반 모델로 변경
- 왼쪽 Explorer 안에 Tool Shelf를 추가해서 HUD/Chest/Glyph를 도구 목록처럼 열 수 있게 정리
- 중앙 Editor에 현재 workspace tab 이름/설명/Export/Help 액션 헤더 추가
- 중앙 Editor 하단에 Output bar 추가
- 오른쪽 Inspector에 `Properties / Script / Bindings` 탭 UI 추가

## 2차 구현 결과

- `App.tsx`
  - `WorkspaceTabId`, `InspectorTabId`, `workspaceTabs` 모델 추가
  - `activeWorkspaceTab`, `activeInspectorTab` 상태 추가
  - `openWorkspaceTool()`로 도구 tab 선택과 기존 modal host 실행을 연결
  - Explorer에 `bridgeToolShelf` 추가
  - Editor tab 버튼을 `workspaceTabs.map()` 기반으로 변경
  - Editor header와 output bar 추가
  - Inspector tab 버튼과 현재 탭 설명 추가
- `style.css`
  - `bridgeToolShelf`, `bridgeToolButton` 스타일 추가
  - `bridgeEditorHeader`, `bridgeEditorTitle`, `bridgeEditorMeta`, `bridgeEditorActions` 스타일 추가
  - `bridgeOutputBar` 스타일 추가
  - `bridgeInspectorTabs`, `bridgeInspectorTab`, `bridgeInspectorTabHint` 스타일 추가

## 2차 구현에서 의도적으로 유지한 것

- 기존 `main_window`, `explorer`, `properties`, `bindings` DOM id는 계속 유지
- HUD/Chest/Glyph 내부는 아직 workspace 내부 mount로 바꾸지 않고 기존 modal/fullscreen host를 호출
- Inspector tab은 지금 단계에서 DOM을 숨기지 않는다. 기존 script/bindings 초기화 코드가 DOM id를 직접 참조할 가능성이 있기 때문이다.

## 3차 구현 범위

- workspace tab/tool 정의를 `App.tsx` 내부 하드코딩에서 별도 registry 파일로 분리
- 각 workspace tool에 category/status 메타데이터 추가
- 중앙 Editor header에서 현재 tool의 category와 상태를 표시
- Inspector tab 정의도 registry로 분리해서 이후 `Export`, `Errors`, `PMMP Helper` 같은 탭을 늘릴 수 있게 준비

## 3차 구현 결과

- `src/ui/react/workspaceRegistry.ts`
  - `WorkspaceTabId`, `InspectorTabId`, `WorkspaceToolStatus`, `WorkspaceToolDefinition` 타입 추가
  - `workspaceTools` 정의 추가
  - `inspectorTabs` 정의 추가
- `src/App.tsx`
  - workspace/inspector 타입과 탭 정의를 registry에서 import
  - Tool Shelf와 workspace tab을 registry 기반으로 렌더링
  - 현재 tool category/status를 Editor header에 표시
- `style.css`
  - `bridgeToolStatus-*` badge 스타일 추가

## 3차 구현에서 의도적으로 유지한 것

- 아직 `HUD`, `Chest`, `Glyph`는 workspace 내부 패널로 직접 mount하지 않는다.
- 현재 단계에서는 bridge식 shell의 확장 구조를 먼저 안정화한다.

## 4차 구현 범위

- Explorer 상단에 MCBE 프로젝트/팩 작업용 Project 패널 추가
- 기존 navbar의 숨김 file input을 재사용해서 Project 패널에서도 UI 폴더/텍스처/Form JSON import를 실행
- Paste JSON도 Project 패널에서 바로 실행 가능하게 연결

## 4차 구현 결과

- `src/ui/react/WorkspaceProjectPanel.tsx`
  - `Resource Pack UI` 프로젝트 카드 추가
  - `Import UI Folder`, `Import Textures`, `Upload Form JSON`, `Paste JSON` 액션 추가
  - 기존 `ui_workspace_importer`, `ui_textures_importer`, `form_importer` input id를 `label htmlFor`로 재사용
- `src/App.tsx`
  - Explorer 영역 상단에 `WorkspaceProjectPanel` 추가
- `style.css`
  - `bridgeProjectPanel`, `bridgeProjectCard`, `bridgeProjectActions`, `bridgeProjectAction` 스타일 추가

## 4차 구현에서 의도적으로 유지한 것

- 아직 실제 `.mcaddon` 프로젝트 모델은 만들지 않는다.
- 현재 Project 패널은 기존 JSON UI Maker import/export 기능을 bridge식 workspace 위치로 재배치하는 역할이다.
