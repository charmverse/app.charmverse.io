/*
  Warnings:

  - You are about to drop the `UserGnosisSafeState` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserGnosisSafeState" DROP CONSTRAINT "UserGnosisSafeState_userId_fkey";

-- DropTable
DROP TABLE "UserGnosisSafeState";
