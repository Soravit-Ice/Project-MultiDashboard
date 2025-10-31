-- AlterTable
ALTER TABLE "MessageLog" ADD COLUMN     "lineContactId" TEXT;

-- CreateTable
CREATE TABLE "LineContact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "lineUserId" TEXT NOT NULL,
    "displayName" TEXT,
    "pictureUrl" TEXT,
    "language" TEXT,
    "statusMessage" TEXT,
    "lastEventAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LineContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineContactGroup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LineContactGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineContactGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LineContactGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LineContact_userId_idx" ON "LineContact"("userId");

-- CreateIndex
CREATE INDEX "LineContact_integrationId_idx" ON "LineContact"("integrationId");

-- CreateIndex
CREATE UNIQUE INDEX "LineContact_integrationId_lineUserId_key" ON "LineContact"("integrationId", "lineUserId");

-- CreateIndex
CREATE INDEX "LineContactGroup_userId_idx" ON "LineContactGroup"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LineContactGroup_userId_name_key" ON "LineContactGroup"("userId", "name");

-- CreateIndex
CREATE INDEX "LineContactGroupMember_contactId_idx" ON "LineContactGroupMember"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "LineContactGroupMember_groupId_contactId_key" ON "LineContactGroupMember"("groupId", "contactId");

-- CreateIndex
CREATE INDEX "MessageLog_lineContactId_idx" ON "MessageLog"("lineContactId");

-- AddForeignKey
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_lineContactId_fkey" FOREIGN KEY ("lineContactId") REFERENCES "LineContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineContact" ADD CONSTRAINT "LineContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineContact" ADD CONSTRAINT "LineContact_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "UserIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineContactGroup" ADD CONSTRAINT "LineContactGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineContactGroupMember" ADD CONSTRAINT "LineContactGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "LineContactGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineContactGroupMember" ADD CONSTRAINT "LineContactGroupMember_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "LineContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
