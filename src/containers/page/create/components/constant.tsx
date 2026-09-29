import type { LucideIcon } from "lucide-react"
import type { InputItem, ElementItem } from "@/store/elementStore"
import {
    TextAlignStart, Circle, SquareCheck, ChevronDown,
    Image as ImageIcon, PictureInPicture2, StickyNotePlus
} from "lucide-react"

export const QuestionList: { title: string; icon: LucideIcon; type: InputItem['type'] }[] = [
    { title: "ข้อความ",      icon: TextAlignStart, type: 'text' },
    { title: "เลือก 1 ข้อ",   icon: Circle,         type: 'radio' },
    { title: "เลือกหลายข้อ",  icon: SquareCheck,    type: 'checkbox' },
    { title: "เลือกรายการ",   icon: ChevronDown,    type: 'select' },
]

export const ElementList: { title: string; icon: LucideIcon; type: ElementItem['type'] }[] = [
    { title: "คำอธิบาย",     icon: TextAlignStart,    type: 'text' },
    { title: "รูปภาพ",       icon: ImageIcon,         type: 'image' },
    { title: "ป๊อปอัพข้อมูล", icon: PictureInPicture2, type: 'dialog' },
    { title: "หัวข้อพับเก็บ",  icon: ChevronDown,       type: 'accordion' },
    { title: "ขึ้นหน้าใหม่",   icon: StickyNotePlus,    type: 'pagebreak' },
]
