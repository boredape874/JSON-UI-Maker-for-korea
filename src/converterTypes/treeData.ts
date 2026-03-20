export interface TreeInstructions {
    ContinuePath: boolean;
    CommonElementLink?: string;
    NewTree?: {
        link: string;
        startingNode: string;
    };
    Warning?: {
        message: string;
    };
}

export interface TreeData {
    element?: JsonUISimpleElement;
    instructions?: TreeInstructions;
}

export interface JsonUISimpleElement {
    [key: string]: any;
    controls?: object[];
}
