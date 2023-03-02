-- CreateTable
CREATE TABLE "OAuth2Provider" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL,

    CONSTRAINT "OAuth2Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuth2Identity" (
    "providerId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "externalId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "tokenType" TEXT NOT NULL,
    "scope" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "refreshToken" TEXT,

    CONSTRAINT "OAuth2Identity_pkey" PRIMARY KEY ("providerId","userId")
);

-- AddForeignKey
ALTER TABLE "OAuth2Identity" ADD CONSTRAINT "OAuth2Identity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuth2Identity" ADD CONSTRAINT "OAuth2Identity_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "OAuth2Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
