"use client";

import PodcastGenerator from '@/components/PodcastGenerator/PodcastGenerator';
import FloatingButtons from '@/components/FloatingButton/FloatingButtons';
import PocHeader from '@/components/PocHeader/PocHeader';

import React from 'react'

const page = () => {
  return (
    <div>
        <PocHeader />
        <PodcastGenerator></PodcastGenerator>
        <FloatingButtons/>
      
    </div>
  )
}

export default page