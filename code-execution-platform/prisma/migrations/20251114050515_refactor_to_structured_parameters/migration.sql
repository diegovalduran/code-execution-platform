/*
  Warnings:

  - You are about to drop the column `functionSignature` on the `Problem` table. All the data in the column will be lost.
  - Added the required column `functionName` to the `Problem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parameters` to the `Problem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `returnType` to the `Problem` table without a default value. This is not possible if the table is not empty.

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
    "functionName" TEXT NOT NULL,
    "parameters" TEXT NOT NULL,
    "returnType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Problem" ("createdAt", "description", "exampleInput", "exampleOutput", "id", "title", "updatedAt") SELECT "createdAt", "description", "exampleInput", "exampleOutput", "id", "title", "updatedAt" FROM "Problem";
DROP TABLE "Problem";
ALTER TABLE "new_Problem" RENAME TO "Problem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
