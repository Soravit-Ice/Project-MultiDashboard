-- AlterTable
ALTER TABLE "MessageLog" ADD COLUMN     "emailContactId" TEXT,
ADD COLUMN     "recipientEmail" TEXT,
ADD COLUMN     "title" TEXT;

-- CreateTable
CREATE TABLE "EmailContact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailContactGroup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailContactGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailContactGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailContactGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailContact_userId_idx" ON "EmailContact"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailContact_userId_email_key" ON "EmailContact"("userId", "email");

-- CreateIndex
CREATE INDEX "EmailContactGroup_userId_idx" ON "EmailContactGroup"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailContactGroup_userId_name_key" ON "EmailContactGroup"("userId", "name");

-- CreateIndex
CREATE INDEX "EmailContactGroupMember_contactId_idx" ON "EmailContactGroupMember"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailContactGroupMember_groupId_contactId_key" ON "EmailContactGroupMember"("groupId", "contactId");

-- CreateIndex
CREATE INDEX "MessageLog_emailContactId_idx" ON "MessageLog"("emailContactId");

-- AddForeignKey
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_emailContactId_fkey" FOREIGN KEY ("emailContactId") REFERENCES "EmailContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailContact" ADD CONSTRAINT "EmailContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailContactGroup" ADD CONSTRAINT "EmailContactGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailContactGroupMember" ADD CONSTRAINT "EmailContactGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "EmailContactGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailContactGroupMember" ADD CONSTRAINT "EmailContactGroupMember_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "EmailContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
