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
