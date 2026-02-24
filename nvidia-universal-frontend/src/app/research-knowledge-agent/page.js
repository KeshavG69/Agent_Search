"use client";

import AIResearchAssistant from '@/components/ai_research_agent/AIResearchAssistant';
import FloatingButtons from '@/components/FloatingButton/FloatingButtons';
import PocHeader from '@/components/PocHeader/PocHeader';
import React from 'react'

const page = () => {
  return (
    <div>
        <PocHeader />
        <AIResearchAssistant/>
        <FloatingButtons/>
    </div>
  )
}

export default page