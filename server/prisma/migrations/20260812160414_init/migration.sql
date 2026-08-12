-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "email" TEXT,
    "avatar" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "package_id" INTEGER NOT NULL,
    "package_expire_time" DATETIME,
    "remaining_test_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NORMAL',
    "created_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_time" DATETIME NOT NULL,
    CONSTRAINT "User_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "Plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationCode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expire_time" DATETIME NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dailyTestLimit" INTEGER,
    "verificationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "wrongBookEnabled" BOOLEAN NOT NULL DEFAULT false,
    "historyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "reportLevel" TEXT NOT NULL DEFAULT 'BASIC',
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Word" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "headword" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "bnc_level" TEXT NOT NULL,
    "related_forms" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ENABLED',
    "created_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_time" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WordMeaning" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "word_id" INTEGER NOT NULL,
    "meaning" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "WordMeaning_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "Word" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Question" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "word_id" INTEGER NOT NULL,
    "correct_meaning_id" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'GENERATED',
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "created_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_time" DATETIME NOT NULL,
    CONSTRAINT "Question_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "Word" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Question_correct_meaning_id_fkey" FOREIGN KEY ("correct_meaning_id") REFERENCES "WordMeaning" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "question_id" INTEGER NOT NULL,
    "meaning_id" INTEGER,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    CONSTRAINT "QuestionOption_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuestionOption_meaning_id_fkey" FOREIGN KEY ("meaning_id") REFERENCES "WordMeaning" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
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
    CONSTRAINT "TestSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestSessionItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "session_id" INTEGER NOT NULL,
    "seq" INTEGER NOT NULL,
    "word_id" INTEGER NOT NULL,
    "tested_level" TEXT NOT NULL,
    "options_snapshot" TEXT NOT NULL,
    "correct_option_index" INTEGER NOT NULL,
    "user_option_index" INTEGER,
    "isCorrect" BOOLEAN NOT NULL,
    "answer_time_ms" INTEGER NOT NULL DEFAULT 0,
    "created_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TestSessionItem_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "TestSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TestSessionItem_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "Word" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WrongWord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "word_id" INTEGER NOT NULL,
    "correct_meaning_text" TEXT NOT NULL,
    "errorCount" INTEGER NOT NULL DEFAULT 1,
    "last_error_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WrongWord_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WrongWord_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "Word" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_package_id_idx" ON "User"("package_id");

-- CreateIndex
CREATE INDEX "VerificationCode_email_purpose_idx" ON "VerificationCode"("email", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Word_headword_key" ON "Word"("headword");

-- CreateIndex
CREATE INDEX "Word_level_idx" ON "Word"("level");

-- CreateIndex
CREATE INDEX "WordMeaning_word_id_idx" ON "WordMeaning"("word_id");

-- CreateIndex
CREATE UNIQUE INDEX "WordMeaning_word_id_meaning_key" ON "WordMeaning"("word_id", "meaning");

-- CreateIndex
CREATE INDEX "Question_level_idx" ON "Question"("level");

-- CreateIndex
CREATE UNIQUE INDEX "Question_word_id_correct_meaning_id_key" ON "Question"("word_id", "correct_meaning_id");

-- CreateIndex
CREATE INDEX "QuestionOption_question_id_idx" ON "QuestionOption"("question_id");

-- CreateIndex
CREATE INDEX "TestSession_user_id_started_time_idx" ON "TestSession"("user_id", "started_time");

-- CreateIndex
CREATE INDEX "TestSession_type_idx" ON "TestSession"("type");

-- CreateIndex
CREATE INDEX "TestSessionItem_session_id_idx" ON "TestSessionItem"("session_id");

-- CreateIndex
CREATE INDEX "WrongWord_user_id_idx" ON "WrongWord"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "WrongWord_user_id_word_id_key" ON "WrongWord"("user_id", "word_id");
