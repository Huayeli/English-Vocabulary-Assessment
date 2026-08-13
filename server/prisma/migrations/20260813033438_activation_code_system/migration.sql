/*
  Warnings:

  - You are about to drop the `Plan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VerificationCode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `user_id` on the `TestSession` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `WrongWord` table. All the data in the column will be lost.
  - Added the required column `activation_code_id` to the `TestSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `activation_code_id` to the `WrongWord` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Plan_code_key";

-- DropIndex
DROP INDEX "User_package_id_idx";

-- DropIndex
DROP INDEX "User_email_key";

-- DropIndex
DROP INDEX "User_username_key";

-- DropIndex
DROP INDEX "VerificationCode_email_purpose_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Plan";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "User";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "VerificationCode";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Batch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "created_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ActivationCode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "batch_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "max_tests" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_time" DATETIME,
    CONSTRAINT "ActivationCode_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "Batch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TestSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "activation_code_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "targetLevel" TEXT,
    "totalQuestions" INTEGER NOT NULL DEFAULT 30,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "finalLevel" TEXT,
    "estimated_vocabulary" INTEGER,
    "accuracy" REAL,
    "started_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_time" DATETIME,
    CONSTRAINT "TestSession_activation_code_id_fkey" FOREIGN KEY ("activation_code_id") REFERENCES "ActivationCode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TestSession" ("accuracy", "correctCount", "estimated_vocabulary", "finalLevel", "finished_time", "id", "started_time", "targetLevel", "totalQuestions", "type", "wrongCount") SELECT "accuracy", "correctCount", "estimated_vocabulary", "finalLevel", "finished_time", "id", "started_time", "targetLevel", "totalQuestions", "type", "wrongCount" FROM "TestSession";
DROP TABLE "TestSession";
ALTER TABLE "new_TestSession" RENAME TO "TestSession";
CREATE INDEX "TestSession_activation_code_id_started_time_idx" ON "TestSession"("activation_code_id", "started_time");
CREATE INDEX "TestSession_type_idx" ON "TestSession"("type");
CREATE TABLE "new_WrongWord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "activation_code_id" INTEGER NOT NULL,
    "word_id" INTEGER NOT NULL,
    "correct_meaning_text" TEXT NOT NULL,
    "errorCount" INTEGER NOT NULL DEFAULT 1,
    "last_error_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WrongWord_activation_code_id_fkey" FOREIGN KEY ("activation_code_id") REFERENCES "ActivationCode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WrongWord_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "Word" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WrongWord" ("correct_meaning_text", "created_time", "errorCount", "id", "last_error_time", "word_id") SELECT "correct_meaning_text", "created_time", "errorCount", "id", "last_error_time", "word_id" FROM "WrongWord";
DROP TABLE "WrongWord";
ALTER TABLE "new_WrongWord" RENAME TO "WrongWord";
CREATE INDEX "WrongWord_activation_code_id_idx" ON "WrongWord"("activation_code_id");
CREATE UNIQUE INDEX "WrongWord_activation_code_id_word_id_key" ON "WrongWord"("activation_code_id", "word_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ActivationCode_code_key" ON "ActivationCode"("code");

-- CreateIndex
CREATE INDEX "ActivationCode_batch_id_idx" ON "ActivationCode"("batch_id");

-- CreateIndex
CREATE INDEX "ActivationCode_status_idx" ON "ActivationCode"("status");
