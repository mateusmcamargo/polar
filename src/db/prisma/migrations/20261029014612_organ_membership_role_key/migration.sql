/*
  Warnings:

  - The primary key for the `organ_memberships` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "organ_memberships" DROP CONSTRAINT "organ_memberships_pkey",
ADD CONSTRAINT "organ_memberships_pkey" PRIMARY KEY ("organ_id", "deputy_id", "role", "starts_at");