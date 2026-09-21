-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('PENDING', 'RUNNING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "DesignSource" AS ENUM ('GENERATED', 'CURATED');

-- CreateTable
CREATE TABLE "Generation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "promptHash" TEXT NOT NULL,
    "status" "GenerationStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "completed" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 4,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "referenceId" TEXT,

    CONSTRAINT "Generation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Design" (
    "id" TEXT NOT NULL,
    "source" "DesignSource" NOT NULL DEFAULT 'GENERATED',
    "slug" TEXT,
    "name" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "palette" TEXT[],
    "printKey" TEXT NOT NULL,
    "previewKey" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "seed" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generationId" TEXT,

    CONSTRAINT "Design_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceImage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "contentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferenceImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Generation_promptHash_status_createdAt_idx" ON "Generation"("promptHash", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Generation_sessionId_createdAt_idx" ON "Generation"("sessionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Design_slug_key" ON "Design"("slug");

-- CreateIndex
CREATE INDEX "Design_source_createdAt_idx" ON "Design"("source", "createdAt");

-- CreateIndex
CREATE INDEX "Design_generationId_idx" ON "Design"("generationId");

-- CreateIndex
CREATE INDEX "ReferenceImage_sessionId_createdAt_idx" ON "ReferenceImage"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "Generation" ADD CONSTRAINT "Generation_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "ReferenceImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "Generation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
