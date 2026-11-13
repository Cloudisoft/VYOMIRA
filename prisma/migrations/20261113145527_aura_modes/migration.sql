-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "mode" TEXT NOT NULL DEFAULT 'astrology',
ALTER COLUMN "chartSnapshotId" DROP NOT NULL;
