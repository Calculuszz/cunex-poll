'use client'
import React from 'react'
import { Card } from '../ui/card';
import { Badge } from 'lucide-react';
import { IPollCardDTO } from '@/dtos/pollcardDto';

interface PollCardProps{
    poll: IPollCardDTO
}

export function PollCard({poll}: PollCardProps) {
    return (
        <Card className=''>
            <section className='flex gap-1'>

            </section>
            <h1>{poll.title}</h1>
            <p>{poll.desc}</p>
            <section>

            </section>
        </Card>
    )
}
