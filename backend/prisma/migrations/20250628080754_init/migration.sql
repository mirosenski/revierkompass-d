-- CreateTable
CREATE TABLE "PoliceStation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "coordinates" TEXT,
    "telefon" TEXT,
    "email" TEXT,
    "notdienst24h" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "lastModified" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
