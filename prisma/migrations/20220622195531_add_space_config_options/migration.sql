-- CreateEnum
CREATE TYPE "SpacePermissionConfigurationMode" AS ENUM ('custom', 'readOnly', 'collaborative', 'open');

-- AlterTable
ALTER TABLE "Space" ADD COLUMN     "defaultPublicPages" BOOLEAN DEFAULT false,
ADD COLUMN     "permissionConfigurationMode" "SpacePermissionConfigurationMode" DEFAULT E'custom',
ALTER COLUMN "defaultPagePermissionGroup" SET DEFAULT E'full_access';
