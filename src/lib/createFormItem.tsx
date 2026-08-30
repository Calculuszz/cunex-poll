import type { InputItem, ElementItem, Option } from "@/store/elementStore"

const uid = () => crypto.randomUUID()
export const blankOption = (): Option => ({ id: uid(), label: "" })

export function createInputItem(type: InputItem['type']): InputItem {
    const base = { kind: 'input' as const, id: uid(), label: "", required: false }
    switch (type) {
        case 'text':     return { ...base, type, placeholder: "" }
        case 'select':   return { ...base, type, options: [blankOption()] }
        case 'radio':
        // คำถามแบบเลือกต้องมีอย่างน้อย 2 ตัวเลือกถึงจะเป็นคำถามได้ เลยตั้งต้นให้เลย
        case 'checkbox': return { ...base, type, options: [blankOption(), blankOption()], optionLayout: 'list' }
    }
}

export function createElementItem(type: ElementItem['type']): ElementItem {
    const base = { kind: 'element' as const, id: uid() }
    switch (type) {
        case 'text':      return { ...base, type, title: "", body: "" }
        case 'image':     return { ...base, type, url: "", alt: "" }
        case 'accordion': return { ...base, type, title: "", body: "" }
        case 'dialog':    return { ...base, type, title: "", body: "" }
        case 'pagebreak': return { ...base, type }
    }
}
