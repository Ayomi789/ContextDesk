-- AlterEnum (recreated: ADD VALUE cannot run inside a transaction)
CREATE TYPE "Plan_new" AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE');

ALTER TABLE "Subscription" ALTER COLUMN "plan" DROP DEFAULT;
ALTER TABLE "Subscription" ALTER COLUMN "plan" TYPE "Plan_new" USING "plan"::text::"Plan_new";
ALTER TYPE "Plan" RENAME TO "Plan_old";
ALTER TYPE "Plan_new" RENAME TO "Plan";
DROP TYPE "Plan_old";

ALTER TABLE "Subscription" ALTER COLUMN "plan" SET DEFAULT 'FREE';
