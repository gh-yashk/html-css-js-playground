import type { FileType } from "@/types/app";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import data from "../data/init.json";

type CodeState = {
    code: Record<FileType, string>;
    setCode: (type: FileType, value: string) => void;
    resetCode: () => void;
};

export const useCodeStore = create<CodeState>()(
    persist(
        (set) => ({
            code: { ...data },
            setCode: (type, value) =>
                set((state) => ({
                    code: { ...state.code, [type]: value },
                })),
            resetCode: () =>
                set(() => ({
                    code: { ...data },
                })),
        }),
        {
            name: 'code-storage', // localStorage key
        }
    )
);