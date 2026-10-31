-- CreateEnum
CREATE TYPE "deputy_sex" AS ENUM ('FEMALE', 'MALE');

-- AlterTable
ALTER TABLE "deputies" ADD COLUMN     "sex" "deputy_sex";