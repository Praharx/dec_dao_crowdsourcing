/*
  Warnings:

  - You are about to drop the column `done` on the `Submission` table. All the data in the column will be lost.
  - Added the required column `done` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "done";

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "done" BOOLEAN NOT NULL;
