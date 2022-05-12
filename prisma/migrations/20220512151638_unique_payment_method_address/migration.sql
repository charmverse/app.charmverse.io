/*
  Warnings:

  - A unique constraint covering the columns `[spaceId,chainId,contractAddress]` on the table `PaymentMethod` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[spaceId,chainId,gnosisSafeAddress]` on the table `PaymentMethod` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_spaceId_chainId_contractAddress_key" ON "PaymentMethod"("spaceId", "chainId", "contractAddress");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_spaceId_chainId_gnosisSafeAddress_key" ON "PaymentMethod"("spaceId", "chainId", "gnosisSafeAddress");
