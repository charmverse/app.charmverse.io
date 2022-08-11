-- CreateTable
CREATE TABLE "DocumentSuggestion" (
    "pageId" UUID NOT NULL,
    "suggestion" JSONB,

    CONSTRAINT "DocumentSuggestion_pkey" PRIMARY KEY ("pageId")
);

-- AddForeignKey
ALTER TABLE "DocumentSuggestion" ADD CONSTRAINT "DocumentSuggestion_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;
