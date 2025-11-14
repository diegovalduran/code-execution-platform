/*
  Warnings:

  - Made the column `functionSignature` on table `Problem` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Problem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "exampleInput" TEXT NOT NULL,
    "exampleOutput" TEXT NOT NULL,
    "functionSignature" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Problem" ("createdAt", "description", "exampleInput", "exampleOutput", "functionSignature", "id", "title", "updatedAt") SELECT "createdAt", "description", "exampleInput", "exampleOutput", "functionSignature", "id", "title", "updatedAt" FROM "Problem";
DROP TABLE "Problem";
ALTER TABLE "new_Problem" RENAME TO "Problem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
