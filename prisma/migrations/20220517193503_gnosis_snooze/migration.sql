-- CreateTable
CREATE TABLE "UserGnosisSafeState" (
    "transactionsSnoozedFor" TIMESTAMP(3),
    "transactionsSnoozeMessage" TEXT,
    "userId" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "UserGnosisSafeState_userId_key" ON "UserGnosisSafeState"("userId");

-- AddForeignKey
ALTER TABLE "UserGnosisSafeState" ADD CONSTRAINT "UserGnosisSafeState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
