import { useEffect, useMemo, useState } from "react";
import { closeChestUiEditorModalBridge, subscribeModalBridge } from "./modalBridge.js";

type ChestTemplate = {
    id: string;
    name: string;
    description: string;
};

type ChestComponent = {
    id: string;
    name: string;
    description: string;
};

const CHEST_TEMPLATES: ChestTemplate[] = [
    { id: "vanilla_chest", name: "Vanilla Chest", description: "기본 상자 레이아웃 시작점" },
    { id: "cooking_pot", name: "Cooking Pot", description: "조리형 UI 프리셋" },
    { id: "crafting_ui", name: "Crafting UI", description: "제작 UI 프리셋" },
    { id: "altar", name: "Altar", description: "의식/강화형 UI 프리셋" },
];

const CHEST_COMPONENTS: ChestComponent[] = [
    { id: "container_item", name: "Container Item", description: "기본 아이템 슬롯" },
    { id: "container_item_picture", name: "Container Item + Picture", description: "아이콘 포함 슬롯" },
    { id: "progress_bar", name: "Progress Bar", description: "clip 기반 진행 바" },
    { id: "toggle_item", name: "On/Off Item", description: "토글형 요소" },
    { id: "disabled_slot", name: "Uninteractable Slot", description: "비활성 슬롯" },
    { id: "container_type", name: "Container Type", description: "컨테이너 타입 표시" },
    { id: "image", name: "Image", description: "장식 이미지" },
    { id: "label", name: "Label", description: "텍스트 라벨" },
];

export function ChestUiEditorModal() {
    const [open, setOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(CHEST_TEMPLATES[0]?.id ?? "");
    const [selectedComponent, setSelectedComponent] = useState(CHEST_COMPONENTS[0]?.id ?? "");

    useEffect(() => subscribeModalBridge((event) => {
        if (event.type === "open-chest-ui-editor") setOpen(true);
        if (event.type === "close-chest-ui-editor") setOpen(false);
    }), []);

    const template = useMemo(
        () => CHEST_TEMPLATES.find((entry) => entry.id === selectedTemplate) ?? CHEST_TEMPLATES[0],
        [selectedTemplate],
    );
    const component = useMemo(
        () => CHEST_COMPONENTS.find((entry) => entry.id === selectedComponent) ?? CHEST_COMPONENTS[0],
        [selectedComponent],
    );

    return (
        <div
            id="modalChestUiEditor"
            className="modal"
            style={{ display: open ? "block" : "none" }}
            onClick={(event) => {
                if (event.target === event.currentTarget) closeChestUiEditorModalBridge();
            }}
        >
            <div className="modal-content chestUiEditorModalContent">
                <span className="modalClose" style={{ cursor: "pointer" }} onClick={() => closeChestUiEditorModalBridge()}>&times;</span>
                <h2 className="modalHeader">Chest UI Editor</h2>
                <div className="chestUiEditorLayout">
                    <div className="chestUiEditorPanel">
                        <div className="chestUiEditorSectionTitle">Templates</div>
                        <select className="modalOptionInput" value={selectedTemplate} onChange={(event) => setSelectedTemplate(event.target.value)}>
                            {CHEST_TEMPLATES.map((entry) => (
                                <option key={entry.id} value={entry.id}>{entry.name}</option>
                            ))}
                        </select>
                        <div className="chestUiEditorHint">{template?.description}</div>

                        <div className="chestUiEditorSectionTitle">Components</div>
                        <div className="chestUiEditorList">
                            {CHEST_COMPONENTS.map((entry) => (
                                <button
                                    key={entry.id}
                                    type="button"
                                    className={`hudEditorChannelButton${entry.id === selectedComponent ? " hudEditorChannelButtonActive" : ""}`}
                                    onClick={() => setSelectedComponent(entry.id)}
                                >
                                    {entry.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="chestUiEditorCanvasPanel">
                        <div className="chestUiEditorSectionTitle">Preview</div>
                        <div className="chestUiEditorCanvas">
                            <div className="chestUiEditorCanvasFrame">
                                <div className="chestUiEditorCanvasGrid"></div>
                                <div className="chestUiEditorCanvasLabel">{template?.name}</div>
                            </div>
                        </div>
                        <div className="chestUiEditorHint">
                            별도 도구 골격까지 먼저 추가한 상태입니다. 다음 단계에서 슬롯 배치, collection index, 이미지/라벨/진행 바 인스펙터와 Chest JSON export를 붙이면 됩니다.
                        </div>
                    </div>

                    <div className="chestUiEditorPanel">
                        <div className="chestUiEditorSectionTitle">Inspector</div>
                        <div className="chestUiEditorMetaCard">
                            <div className="chestUiEditorMetaLabel">선택 요소</div>
                            <div className="chestUiEditorMetaValue">{component?.name}</div>
                            <div className="chestUiEditorMetaLabel">설명</div>
                            <div className="chestUiEditorMetaValue">{component?.description}</div>
                        </div>
                        <div className="chestUiEditorSectionTitle">Planned</div>
                        <ul className="chestUiEditorTodo">
                            <li>그리드 스냅 배치</li>
                            <li>슬롯/이미지/라벨/진행 바 속성 편집</li>
                            <li>Chest JSON export</li>
                            <li>템플릿 프리셋 저장</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
