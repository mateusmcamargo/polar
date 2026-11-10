-- CreateTable
CREATE TABLE "committee_absences" (
    "deputy_id" INTEGER NOT NULL,
    "year" SMALLINT NOT NULL,
    "position" INTEGER NOT NULL,
    "event_id" INTEGER NOT NULL,
    "organ_name" TEXT NOT NULL,
    "meeting_type" TEXT NOT NULL,
    "justified" BOOLEAN NOT NULL,
    "collected_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "committee_absences_pkey" PRIMARY KEY ("deputy_id","year","position")
);

-- AddForeignKey
ALTER TABLE "committee_absences" ADD CONSTRAINT "committee_absences_deputy_id_fkey" FOREIGN KEY ("deputy_id") REFERENCES "deputies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;