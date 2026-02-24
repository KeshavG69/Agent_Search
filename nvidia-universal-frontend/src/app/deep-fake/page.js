import FileUpload from '@/components/DeepFake/FileUpload/FileUpload'
import FloatingButtons from '@/components/FloatingButton/FloatingButtons'
import PocHeader from '@/components/PocHeader/PocHeader'
import React from 'react'

const DeepFake = () => {
  return (
    <div>
        <PocHeader />
        <FileUpload/>
        <FloatingButtons/>
    </div>
  )
}

export default DeepFake