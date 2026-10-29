-- CreateTable
CREATE TABLE "deputy_annual_summaries" (
    "deputy_id" INTEGER NOT NULL,
    "year" SMALLINT NOT NULL,
    "plenary_present_days" INTEGER NOT NULL,
    "plenary_justified_absence_days" INTEGER NOT NULL,
    "plenary_unjustified_absence_days" INTEGER NOT NULL,
    "committee_present_meetings" INTEGER NOT NULL,
    "committee_justified_absences" INTEGER NOT NULL,
    "committee_unjustified_absences" INTEGER NOT NULL,
    "office_staff_count" INTEGER NOT NULL,
    "office_budget_spent" DECIMAL(12,2),
    "office_budget_unused" DECIMAL(12,2),
    "functional_apartment_since" TIMESTAMP(3),
    "functional_apartment_until" TIMESTAMP(3),
    "housing_allowance_received" DECIMAL(12,2) NOT NULL,
    "official_trip_count" INTEGER NOT NULL,
    "has_diplomatic_passport" BOOLEAN NOT NULL,
    "source_url" TEXT NOT NULL,
    "collected_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deputy_annual_summaries_pkey" PRIMARY KEY ("deputy_id","year")
);

-- AddForeignKey
ALTER TABLE "deputy_annual_summaries" ADD CONSTRAINT "deputy_annual_summaries_deputy_id_fkey" FOREIGN KEY ("deputy_id") REFERENCES "deputies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;