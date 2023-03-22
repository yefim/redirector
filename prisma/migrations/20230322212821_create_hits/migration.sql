-- CreateTable
CREATE TABLE "Hit" (
    "hitId" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipAddr" TEXT,
    "referer" TEXT,
    "rawHeaders" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    CONSTRAINT "Hit_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "ShortLink" ("linkId") ON DELETE RESTRICT ON UPDATE CASCADE
);
