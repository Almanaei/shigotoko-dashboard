-- CreateTable
CREATE TABLE "MessageArchive" (
  "id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "senderId" TEXT,
  "employeeId" TEXT,
  "senderName" TEXT,
  "senderAvatar" TEXT,
  "timestamp" TIMESTAMP(3) NOT NULL,
  "archiveMonth" TEXT NOT NULL,
  "isEmployee" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MessageArchive_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageArchive_archiveMonth_idx" ON "MessageArchive"("archiveMonth");

-- CreateIndex
CREATE INDEX "MessageArchive_timestamp_idx" ON "MessageArchive"("timestamp"); 