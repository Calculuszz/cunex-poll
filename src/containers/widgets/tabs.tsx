import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function MainTabs() {
    return (
        <Tabs defaultValue="account" className="w-full">
            <TabsList variant="line" className={`flex w-full *:text-base *:font-bold`}>
                <TabsTrigger value="ready">พร้อมใช้งาน</TabsTrigger>
                <TabsTrigger value="close">จบโหวต</TabsTrigger>
                <TabsTrigger value="else">อื่นๆ</TabsTrigger>
            </TabsList>

        </Tabs>
    )
}

export function AdminTabs() {
    return (
        <Tabs defaultValue="account" className="w-full">
            <TabsList variant="line" className={`flex w-full *:text-base *:font-bold`}>
                <TabsTrigger value="waiting">รออนุมัติ</TabsTrigger>
                <TabsTrigger value="accept">อนุมัติแล้ว</TabsTrigger>
                <TabsTrigger value="deny">ปฏิเสธ</TabsTrigger>
            </TabsList>

        </Tabs>
    )
}
