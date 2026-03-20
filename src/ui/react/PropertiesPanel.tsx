import { ChangeEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { selectedElement } from "../../runtime/editorSelection.js";
import { undoRedoManager } from "../../keyboard/undoRedo.js";
import { chooseImageModal } from "../modals/chooseImage.js";
import { propertiesMap } from "../propertiesArea.js";
import { subscribeUiBridge } from "../reactUiBridge.js";

type PropertyDefinition = {
    type: string;
    displayName: string;
    editable: boolean;
    get?: (element: HTMLElement) => string | boolean | undefined;
    set: (element: HTMLElement, value: string) => void;
};

function recordPropertyChange(propertyName: string, previousValue: string, nextValue: string): void {
    if (!selectedElement?.dataset.id || previousValue === nextValue) return;
    const key = propertyName.toLowerCase().replace(" ", "_");
    undoRedoManager.push({
        type: "modify",
        elementId: selectedElement.dataset.id,
        previousState: { [key]: previousValue },
        newState: { [key]: nextValue },
    });
}

function PropertyField({ property }: { property: PropertyDefinition }) {
    const initialValue = property.get ? property.get(selectedElement!) : "";
    const [value, setValue] = useState(String(initialValue ?? ""));
    const [checked, setChecked] = useState(Boolean(initialValue));
    const previousValue = useRef(String(initialValue ?? ""));

    useEffect(() => {
        const nextValue = property.get ? property.get(selectedElement!) : "";
        setValue(String(nextValue ?? ""));
        setChecked(Boolean(nextValue));
        previousValue.current = String(nextValue ?? "");
    }, [property]);

    if (property.type === "button") {
        return (
            <>
                <input
                    type="button"
                    className="propertyInputButton"
                    value={property.displayName}
                    onClick={() => {
                        if (!selectedElement) return;
                        property.set(selectedElement, value);
                    }}
                />
                <br />
            </>
        );
    }

    const commit = (nextValue: string) => {
        if (!selectedElement) return;
        property.set(selectedElement, nextValue);
        recordPropertyChange(property.displayName, previousValue.current, nextValue);
        previousValue.current = nextValue;
    };

    const handleTexturePick = async () => {
        const filePath = await chooseImageModal();
        setValue(filePath);
        commit(filePath);
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (property.type === "checkbox") {
            const nextChecked = event.target.checked;
            setChecked(nextChecked);
            const nextValue = String(nextChecked);
            if (selectedElement) {
                property.set(selectedElement, nextValue);
                recordPropertyChange(property.displayName, previousValue.current, nextValue);
                previousValue.current = nextValue;
            }
            return;
        }

        setValue(event.target.value);
        if (property.displayName === "Font Family" && selectedElement) {
            property.set(selectedElement, event.target.value);
        }
    };

    const handleBlur = () => {
        if (!property.editable || property.type === "texture" || property.type === "checkbox") return;
        commit(value);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            commit(value);
        }
    };

    return (
        <>
            <label>{property.displayName}: </label>
            <input
                type={property.type === "texture" ? "text" : property.type}
                className="propertyInput"
                readOnly={property.type === "texture"}
                checked={property.type === "checkbox" ? checked : undefined}
                value={property.type === "checkbox" ? undefined : value}
                spellCheck={property.type === "text" ? false : undefined}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onClick={property.type === "texture" ? () => void handleTexturePick() : undefined}
            />
            <label className="isEditableLabel">{property.editable ? "Editable" : "Not Editable"}</label>
            <br />
        </>
    );
}

export function PropertiesPanel() {
    const [version, setVersion] = useState(0);
    useEffect(() => subscribeUiBridge("properties-changed", () => setVersion((value) => value + 1)), []);

    const properties = useMemo(() => {
        if (!selectedElement) return [] as PropertyDefinition[];
        return (propertiesMap.get(selectedElement.classList[0]!) ?? []) as PropertyDefinition[];
    }, [version]);

    return (
        <div id="properties" className="properties">
            {selectedElement ? properties.map((property) => (
                <PropertyField key={`${selectedElement.dataset.id}-${property.displayName}`} property={property} />
            )) : null}
        </div>
    );
}
