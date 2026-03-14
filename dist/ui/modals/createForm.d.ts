interface CreateFormOptions {
    form_name?: string;
    namespace?: string;
    title_flag?: string;
    [key: string]: any;
}
export declare function createFormModal(): Promise<CreateFormOptions>;
export {};
