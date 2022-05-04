-- CreateTable
CREATE TABLE "TokenGateToRole" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tokenGateId" UUID NOT NULL,
    "roleId" UUID NOT NULL,

    CONSTRAINT "TokenGateToRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TokenGateToRole_tokenGateId_roleId_key" ON "TokenGateToRole"("tokenGateId", "roleId");

-- AddForeignKey
ALTER TABLE "TokenGateToRole" ADD CONSTRAINT "TokenGateToRole_tokenGateId_fkey" FOREIGN KEY ("tokenGateId") REFERENCES "TokenGate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenGateToRole" ADD CONSTRAINT "TokenGateToRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
