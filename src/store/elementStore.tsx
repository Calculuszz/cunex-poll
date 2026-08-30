import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware"

export type FormItem = InputItem | ElementItem;

export type InputItem = {
    kind: 'input';
    id: string;
    label: string;
    required: boolean;
} & (
    | { type: 'radio';    options: Option[]; optionLayout?: 'list' | 'grid' }
    | { type: 'checkbox'; options: Option[]; optionLayout?: 'list' | 'grid' }
    | { type: 'select';   options: Option[] }
    | { type: 'text';     placeholder?: string }
);

export type Option = {
    id: string;
    label: string;
    imageUrl?: string;
    imageAlt?: string;
    info?: {
        trigger?: string;
        title?: string;
        body?: string;
    };
};

export type ElementItem = { kind: 'element'; id: string } & (
    | { type: 'text';      title?: string; body: string }
    | { type: 'image';     url: string; alt?: string; caption?: string }
    | { type: 'accordion'; title: string; body: string }
    | { type: 'dialog';    trigger?: string; title: string; body: string; imageUrl?: string }
    | { type: 'pagebreak' }
);

type UseElementStore = {
    items: FormItem[]
    add: (item: FormItem) => void
    remove: (id: string) => void
    update: (id: string, patch: Partial<FormItem>) => void
    move: (from: number, to: number) => void
}

export const useElementStore = create<UseElementStore>()(
    persist(
        (set) => ({
            items: [],
            add: (item) => set((s) => ({ items: [...s.items, item] })),
            remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
            update: (id, patch) => set((s) => ({
                items: s.items.map((i) => (i.id === id ? { ...i, ...patch } as FormItem : i)),
            })),
            move: (from, to) => set((s) => {
                const next = [...s.items]
                const [moved] = next.splice(from, 1)
                next.splice(to, 0, moved)
                return { items: next }
            }),
        }),
        {
            name: 'poll-draft',
            storage: createJSONStorage(() => localStorage),
            partialize: (s) => ({ items: s.items }),
            version: 1,
        }
    )
)
