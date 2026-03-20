import { useEffect, useMemo, useState } from "react";
import { selectedElement } from "../../runtime/editorSelection.js";
import { classToTagName } from "../../converterTypes/HTMLClassToJonUITypes.js";
import { GeneralUtil } from "../../util/generalUtil.js";
import { assetUrl } from "../../lib/assetUrl.js";
import { subscribeUiBridge } from "../reactUiBridge.js";

type ExplorerNode = {
    id: string;
    label: string;
    hasChildren: boolean;
    isRoot: boolean;
    hidden: boolean;
    children: ExplorerNode[];
};

const explorerMagicNumbers = {
    folderIndentation: 10,
    nonFolderIndentation: 35,
    overallOffset: 15,
};

type ExplorerElement = {
    getMainHTMLElement(): HTMLElement;
    hide(): void;
    show(): void;
    select(event: MouseEvent): void;
};

function buildNode(element: ExplorerElement): ExplorerNode {
    const mainElement = element.getMainHTMLElement();
    const children = Array.from(mainElement.children)
        .map((child) => (child as HTMLElement).dataset.skip === "true" ? ((child as HTMLElement).firstChild as HTMLElement | null) : (child as HTMLElement))
        .filter((child): child is HTMLElement => Boolean(child?.dataset.id))
        .map((child) => GeneralUtil.elementToClassElement(child) as ExplorerElement)
        .map((child) => buildNode(child));

    const type = classToTagName.get(mainElement.classList[0]!) ?? mainElement.classList[0] ?? "Element";
    const label = type.replace(/^([a-z])/u, (_, c) => c.toUpperCase()).replace(/_([a-z])/gu, (_, c) => ` ${c.toUpperCase()}`);

    return {
        id: mainElement.dataset.id!,
        label,
        hasChildren: children.length > 0,
        isRoot: mainElement.parentElement?.id === "main_window" || mainElement.parentElement?.classList.contains("main_window") || false,
        hidden: mainElement.style.visibility === "hidden",
        children,
    };
}

function ExplorerTreeNode({
    node,
    expanded,
    toggleExpanded,
}: {
    node: ExplorerNode;
    expanded: Set<string>;
    toggleExpanded: (id: string) => void;
}) {
    const isExpanded = expanded.has(node.id);
    const isSelected = selectedElement?.dataset.id === node.id;
    const target = document.querySelector<HTMLElement>(`[data-id="${node.id}"]`);
    const classElement = target ? GeneralUtil.elementToClassElement(target) : undefined;
    const left = node.isRoot
        ? explorerMagicNumbers.nonFolderIndentation - explorerMagicNumbers.overallOffset
        : node.hasChildren
            ? explorerMagicNumbers.folderIndentation
            : explorerMagicNumbers.nonFolderIndentation;

    return (
        <div className="explorerDiv" style={{ left: `${left}px` }}>
            {node.hasChildren ? (
                <img
                    src={assetUrl(isExpanded ? "assets/arrow_down.webp" : "assets/arrow_right.webp")}
                    className="explorerArrow"
                    style={{ marginLeft: "5px" }}
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        toggleExpanded(node.id);
                    }}
                />
            ) : null}
            <div
                className={`explorerText${isSelected ? " selected" : ""}`}
                onDoubleClick={(event) => {
                    if (!classElement) return;
                    classElement.select(event.nativeEvent as MouseEvent);
                }}
            >
                {node.label}
            </div>
            {node.isRoot ? (
                <img src={assetUrl("icons/locked.webp")} className="explorerLocked" />
            ) : (
                <img
                    src={assetUrl(node.hidden ? "icons/hidden.webp" : "icons/visible.webp")}
                    className="explorerVisibilityToggle"
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        if (!classElement) return;
                        if (node.hidden) classElement.show();
                        else classElement.hide();
                    }}
                />
            )}
            {node.hasChildren && isExpanded ? node.children.map((child) => (
                <ExplorerTreeNode key={child.id} node={child} expanded={expanded} toggleExpanded={toggleExpanded} />
            )) : null}
        </div>
    );
}

export function ExplorerPanel() {
    const [version, setVersion] = useState(0);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    useEffect(() => subscribeUiBridge("explorer-changed", () => setVersion((value) => value + 1)), []);

    const rootNode = useMemo(() => {
        const rootElementNode = document.querySelector<HTMLElement>("#main_window > [data-id]");
        if (!rootElementNode) return null;
        const rootElement = GeneralUtil.elementToClassElement(rootElementNode);
        return rootElement ? buildNode(rootElement) : null;
    }, [version]);

    useEffect(() => {
        if (!rootNode) return;
        setExpanded((previous) => {
            const next = new Set(previous);
            next.add(rootNode.id);
            let parent = selectedElement?.parentElement;
            while (parent) {
                if (parent.dataset.id) next.add(parent.dataset.id);
                parent = parent.parentElement;
            }
            return next;
        });
    }, [rootNode, version]);

    const toggleExpanded = (id: string) => {
        setExpanded((previous) => {
            const next = new Set(previous);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div id="explorer" className="explorer">
            {rootNode ? <ExplorerTreeNode node={rootNode} expanded={expanded} toggleExpanded={toggleExpanded} /> : null}
        </div>
    );
}
