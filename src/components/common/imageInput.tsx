import React from 'react'
import { Label } from '../ui/label'
import { ImageUp } from 'lucide-react'

export function ImageInput() {
    return (
      <div className='flex flex-col gap-1'>
          <Label className='font-bold text-lg'>อัพโหลดรูปภาพ</Label>
          <div className='w-full relative '>
              <input id='input-banner-image' className=' hidden' type='file' accept="image/*" />
              <label htmlFor='input-banner-image' className='w-full h-30 bg-transparent border-2 border-dashed rounded-lg flex cursor-pointer items-center justify-center '>
                  <span className=' text-ink-400 text-base flex gap-2'>
                      <ImageUp />
                      อัพโหลดรูปภาพ
                  </span>
              </label>
          </div>
      </div>
    )
}
