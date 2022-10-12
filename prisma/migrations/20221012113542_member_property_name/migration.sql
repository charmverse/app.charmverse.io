/*
  Warnings:

  - Added the required column `name` to the `MemberProperty` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MemberProperty" ADD COLUMN     "name" TEXT NOT NULL;
