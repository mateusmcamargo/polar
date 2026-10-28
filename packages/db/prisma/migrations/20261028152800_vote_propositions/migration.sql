/*
  Warnings:

  - You are about to drop the column `proposition_id` on the `votes` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "votes" DROP CONSTRAINT "votes_proposition_id_fkey";

-- DropIndex
DROP INDEX "votes_proposition_id_idx";

-- AlterTable
ALTER TABLE "votes" DROP COLUMN "proposition_id";

-- CreateTable
CREATE TABLE "vote_propositions" (
    "vote_id" TEXT NOT NULL,
    "proposition_id" INTEGER NOT NULL,
    "collected_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vote_propositions_pkey" PRIMARY KEY ("vote_id","proposition_id")
);

-- CreateIndex
CREATE INDEX "vote_propositions_proposition_id_idx" ON "vote_propositions"("proposition_id");

-- AddForeignKey
ALTER TABLE "vote_propositions" ADD CONSTRAINT "vote_propositions_vote_id_fkey" FOREIGN KEY ("vote_id") REFERENCES "votes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote_propositions" ADD CONSTRAINT "vote_propositions_proposition_id_fkey" FOREIGN KEY ("proposition_id") REFERENCES "propositions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
