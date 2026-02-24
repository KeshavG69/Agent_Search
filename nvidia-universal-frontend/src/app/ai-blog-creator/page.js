"use client";

import AIBlogCreator from '@/components/AIBlogCreator/AIBlogCreator'
import FloatingButtons from '@/components/FloatingButton/FloatingButtons';
import PocHeader from '@/components/PocHeader/PocHeader';
import React from 'react'

const uploadDocument = () => {
  return (
    <div>
      <PocHeader />
      <AIBlogCreator/>
      <FloatingButtons/>
    </div>
  )
}

export default uploadDocument
