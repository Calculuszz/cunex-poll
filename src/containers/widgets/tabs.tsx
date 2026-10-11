import React, { type ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type TabItem = { value: string; label: string }

const MAIN_TABS: TabItem[] = [
    { value: "ready", label: "พร้อมใช้งาน" },
    { value: "close", label: "จบโหวต" },
    { value: "else", label: "อื่นๆ" },
]

const ADMIN_TABS: TabItem[] = [
    { value: "waiting", label: "รออนุมัติ" },
    { value: "accept", label: "อนุมัติแล้ว" },
    { value: "deny", label: "ปฏิเสธ" },
]

type PollTabsProps = { renderPanel?: (value: string) => ReactNode }

function PollTabs({ tabs, renderPanel }: PollTabsProps & { tabs: TabItem[] }) {
    return (
        <Tabs defaultValue={tabs[0].value} className="w-full">
            <TabsList variant="line" className={`flex w-full *:text-base *:font-bold`}>
                {tabs.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                ))}
            </TabsList>
            {renderPanel && tabs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value}>
                    {renderPanel(tab.value)}
                </TabsContent>
            ))}
        </Tabs>
    )
}

export function MainTabs(props: PollTabsProps) {
    return <PollTabs tabs={MAIN_TABS} {...props} />
}

export function AdminTabs(props: PollTabsProps) {
    return <PollTabs tabs={ADMIN_TABS} {...props} />
}
