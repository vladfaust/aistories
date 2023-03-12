-- RenameTable
ALTER TABLE "CharacterCollection" RENAME TO "Lore";

-- AlterTable
ALTER TABLE "Lore" RENAME CONSTRAINT "CharacterCollection_pkey" TO "Lore_pkey";

-- RenameColumn
ALTER TABLE "Character" RENAME COLUMN "collectionId" TO "loreId";

-- RenameForeignKey
ALTER TABLE "Character" RENAME CONSTRAINT "Character_collectionId_fkey" TO "Character_loreId_fkey";

-- RenameColumn
ALTER TABLE "Story" RENAME COLUMN "collectionId" TO "loreId";

-- RenameForeignKey
ALTER TABLE "Story" RENAME CONSTRAINT "Story_collectionId_fkey" TO "Story_loreId_fkey";
