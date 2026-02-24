"use client";

import React, { useState } from "react";
import UploadSection from "../../components/ai-pdf-to-podcast/UploadSection";
import QuerySection from "../../components/ai-pdf-to-podcast/QuerySection";
import PocHeader from "@/components/PocHeader/PocHeader";
import FloatingButtons from "@/components/FloatingButton/FloatingButtons";

export default function PDFToPodcastPage() {
  const [documentId, setDocumentId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <>
    <PocHeader />
    <div style={{ width: "100%", display: "flex", justifyContent: "center", }}>
      {!documentId ? (
        <UploadSection
          setDocumentId={setDocumentId}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
        />
      ) : (
        <QuerySection
          documentId={documentId}
          setDocumentId={setDocumentId}
        />
      )}
      <FloatingButtons/>
    </div>
    </>
  );
}
