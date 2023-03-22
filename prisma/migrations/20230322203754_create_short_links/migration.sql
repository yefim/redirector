-- CreateTable
CREATE TABLE "ShortLink" (
    "linkId" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "host" TEXT NOT NULL,
    "redirectUrl" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ShortLink_host_key" ON "ShortLink"("host");
