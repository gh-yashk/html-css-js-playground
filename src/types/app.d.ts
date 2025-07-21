export interface File {
    filetype: FileType;
    icon: string;
    filename: string;
}

export type FileType = "html" | "css" | "javascript";
