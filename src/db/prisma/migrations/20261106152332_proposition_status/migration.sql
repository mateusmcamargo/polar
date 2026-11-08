-- AlterTable
ALTER TABLE "propositions" ADD COLUMN     "dispatch" TEXT,
ADD COLUMN     "full_text_url" TEXT,
ADD COLUMN     "situation" TEXT,
ADD COLUMN     "situation_at" TIMESTAMP(3),
ADD COLUMN     "status_collected_at" TIMESTAMP(3);