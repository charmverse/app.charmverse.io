/*
  Warnings:

  - Added the required column `identityType` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "identityType" TEXT NULL;

/* Update identityType to Wallet and username to first shortened address if there is no identityType, no username and there is at least an address.  */
UPDATE "User" u
SET "username" = (SELECT CONCAT(LEFT((SELECT unnest(u.addresses) LIMIT 1), 6), '...', RIGHT((SELECT unnest(u.addresses) LIMIT 1), 4))),
	"identityType"='Wallet'
WHERE "identityType" IS NULL AND "username" IS NULL AND "addresses" IS NOT NULL;

/* Update identityType to Discord if there is no identityType and there is a username that is the same as the username on the user's Discord account */
UPDATE "User" u SET "identityType"='Discord'
WHERE "username" IS NOT NULL AND 
	  "identityType" IS NULL AND
	  "username" IN (
	  	SELECT account->>'username' FROM "DiscordUser" du WHERE du."userId" = u."id" LIMIT 1
	  )

/* Update identityType to Telegram if there is no identityType and there is a username that is the same as the username or first name + ' ' + last name on the user's Telegram account */
UPDATE "User" u SET "identityType"='Telegram'
WHERE "username" IS NOT NULL AND 
	  "identityType" IS NULL AND
	  ( 
		  "username" IN (
			SELECT CONCAT(account->>'first_name' , ' ', account->>'last_name') FROM "TelegramUser" tu WHERE tu."userId" = u."id" AND account->>'username' IS NULL LIMIT 1
		) OR
		"username" IN (
			SELECT account->>'username' FROM "TelegramUser" tu WHERE tu."userId" = u."id" LIMIT 1
		)
	  )
ALTER TABLE "User" ALTER COLUMN "identityType" SET NOT NULL;

