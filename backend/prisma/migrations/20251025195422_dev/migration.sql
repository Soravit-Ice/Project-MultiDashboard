/*
  Warnings:

  - A unique constraint covering the columns `[lineUserId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "MessageLog" ADD COLUMN     "lineRecipientId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lineUserId" TEXT;

-- CreateIndex
CREATE INDEX "MessageLog_lineRecipientId_idx" ON "MessageLog"("lineRecipientId");

-- CreateIndex
CREATE UNIQUE INDEX "User_lineUserId_key" ON "User"("lineUserId");
