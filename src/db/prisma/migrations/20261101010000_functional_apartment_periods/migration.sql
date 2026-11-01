-- a deputy page can list more than one period of use of a functional apartment in a year
ALTER TABLE "deputy_annual_summaries" ADD COLUMN "functional_apartment_periods" JSONB NOT NULL DEFAULT '[]';

-- the timestamps hold the Brasília date at midnight, stored as UTC (03:00)
UPDATE "deputy_annual_summaries"
SET "functional_apartment_periods" = jsonb_build_array(jsonb_build_object(
    'since', to_char("functional_apartment_since" - interval '3 hours', 'YYYY-MM-DD'),
    'until', to_char("functional_apartment_until" - interval '3 hours', 'YYYY-MM-DD')
))
WHERE "functional_apartment_since" IS NOT NULL;

ALTER TABLE "deputy_annual_summaries" DROP COLUMN "functional_apartment_since",
DROP COLUMN "functional_apartment_until";