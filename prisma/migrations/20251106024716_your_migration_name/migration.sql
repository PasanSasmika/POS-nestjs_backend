/*
  Warnings:

  - You are about to drop the column `reorder_level` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `products` DROP COLUMN `reorder_level`,
    MODIFY `stock_quantity` INTEGER NOT NULL DEFAULT 0;
