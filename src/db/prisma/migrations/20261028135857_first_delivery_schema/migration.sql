-- CreateEnum
CREATE TYPE "vote_choice" AS ENUM ('YES', 'NO', 'ABSTENTION', 'OBSTRUCTION', 'ARTICLE_17');

-- CreateEnum
CREATE TYPE "orientation_choice" AS ENUM ('YES', 'NO', 'LIBERATED', 'ABSTENTION', 'OBSTRUCTION', 'ARTICLE_17');

-- CreateEnum
CREATE TYPE "bancada_kind" AS ENUM ('PARTY', 'BLOC', 'GOVERNMENT', 'MAJORITY', 'MINORITY', 'OPPOSITION');

-- CreateEnum
CREATE TYPE "supplier_kind" AS ENUM ('COMPANY', 'PERSON');

-- CreateTable
CREATE TABLE "parties" (
    "id" INTEGER NOT NULL,
    "acronym" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "collected_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deputies" (
    "id" INTEGER NOT NULL,
    "political_name" TEXT NOT NULL,
    "civil_name" TEXT,
    "search_name" TEXT NOT NULL,
    "photo_url" TEXT,
    "state_code" TEXT NOT NULL,
    "party_id" INTEGER,
    "is_in_office" BOOLEAN NOT NULL,
    "source_url" TEXT NOT NULL,
    "collected_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deputies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deputy_status_changes" (
    "deputy_id" INTEGER NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL,
    "situation" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "party_id" INTEGER,
    "state_code" TEXT NOT NULL,
    "collected_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deputy_status_changes_pkey" PRIMARY KEY ("deputy_id","changed_at","situation")
);

-- CreateTable
CREATE TABLE "propositions" (
    "id" INTEGER NOT NULL,
    "type_code" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "presented_at" TIMESTAMP(3),
    "source_url" TEXT NOT NULL,
    "collected_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "propositions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "organ_acronym" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "approved" BOOLEAN,
    "is_nominal" BOOLEAN NOT NULL,
    "proposition_id" INTEGER,
    "source_url" TEXT NOT NULL,
    "collected_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "individual_votes" (
    "vote_id" TEXT NOT NULL,
    "deputy_id" INTEGER NOT NULL,
    "choice" "vote_choice" NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL,
    "collected_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "individual_votes_pkey" PRIMARY KEY ("vote_id","deputy_id")
);

-- CreateTable
CREATE TABLE "vote_orientations" (
    "vote_id" TEXT NOT NULL,
    "bancada" TEXT NOT NULL,
    "kind" "bancada_kind" NOT NULL,
    "choice" "orientation_choice" NOT NULL,
    "collected_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vote_orientations_pkey" PRIMARY KEY ("vote_id","bancada")
);

-- CreateTable
CREATE TABLE "organs" (
    "id" INTEGER NOT NULL,
    "acronym" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "collected_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organ_memberships" (
    "organ_id" INTEGER NOT NULL,
    "deputy_id" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "collected_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organ_memberships_pkey" PRIMARY KEY ("organ_id","deputy_id","starts_at")
);

-- CreateTable
CREATE TABLE "fronts" (
    "id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "collected_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fronts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "front_memberships" (
    "front_id" INTEGER NOT NULL,
    "deputy_id" INTEGER NOT NULL,
    "role" TEXT,
    "collected_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "front_memberships_pkey" PRIMARY KEY ("front_id","deputy_id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" INTEGER NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "type_name" TEXT NOT NULL,
    "situation" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "collected_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_organs" (
    "event_id" INTEGER NOT NULL,
    "organ_id" INTEGER NOT NULL,

    CONSTRAINT "event_organs_pkey" PRIMARY KEY ("event_id","organ_id")
);

-- CreateTable
CREATE TABLE "event_attendances" (
    "event_id" INTEGER NOT NULL,
    "deputy_id" INTEGER NOT NULL,
    "collected_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_attendances_pkey" PRIMARY KEY ("event_id","deputy_id")
);

-- CreateTable
CREATE TABLE "expense_types" (
    "code" INTEGER NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "expense_types_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" SERIAL NOT NULL,
    "kind" "supplier_kind" NOT NULL,
    "document" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" SERIAL NOT NULL,
    "deputy_id" INTEGER NOT NULL,
    "expense_type_code" INTEGER NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "year" SMALLINT NOT NULL,
    "month" SMALLINT NOT NULL,
    "issued_at" TIMESTAMP(3),
    "document_number" TEXT,
    "gross_value" DECIMAL(12,2) NOT NULL,
    "disallowed_value" DECIMAL(12,2) NOT NULL,
    "net_value" DECIMAL(12,2) NOT NULL,
    "document_url" TEXT,
    "collected_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deputy_flight_summaries" (
    "deputy_id" INTEGER NOT NULL,
    "year" SMALLINT NOT NULL,
    "ticket_count" INTEGER NOT NULL,
    "passenger_count" INTEGER NOT NULL,
    "collected_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deputy_flight_summaries_pkey" PRIMARY KEY ("deputy_id","year")
);

-- CreateIndex
CREATE INDEX "deputies_state_code_idx" ON "deputies"("state_code");

-- CreateIndex
CREATE INDEX "deputies_party_id_idx" ON "deputies"("party_id");

-- CreateIndex
CREATE INDEX "votes_occurred_at_idx" ON "votes"("occurred_at");

-- CreateIndex
CREATE INDEX "votes_proposition_id_idx" ON "votes"("proposition_id");

-- CreateIndex
CREATE INDEX "individual_votes_deputy_id_idx" ON "individual_votes"("deputy_id");

-- CreateIndex
CREATE INDEX "organ_memberships_deputy_id_idx" ON "organ_memberships"("deputy_id");

-- CreateIndex
CREATE INDEX "front_memberships_deputy_id_idx" ON "front_memberships"("deputy_id");

-- CreateIndex
CREATE INDEX "events_starts_at_idx" ON "events"("starts_at");

-- CreateIndex
CREATE INDEX "event_organs_organ_id_idx" ON "event_organs"("organ_id");

-- CreateIndex
CREATE INDEX "event_attendances_deputy_id_idx" ON "event_attendances"("deputy_id");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_document_name_key" ON "suppliers"("document", "name");

-- CreateIndex
CREATE INDEX "expenses_deputy_id_year_month_idx" ON "expenses"("deputy_id", "year", "month");

-- CreateIndex
CREATE INDEX "expenses_supplier_id_idx" ON "expenses"("supplier_id");

-- CreateIndex
CREATE INDEX "expenses_expense_type_code_idx" ON "expenses"("expense_type_code");

-- AddForeignKey
ALTER TABLE "deputies" ADD CONSTRAINT "deputies_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deputy_status_changes" ADD CONSTRAINT "deputy_status_changes_deputy_id_fkey" FOREIGN KEY ("deputy_id") REFERENCES "deputies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_proposition_id_fkey" FOREIGN KEY ("proposition_id") REFERENCES "propositions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_votes" ADD CONSTRAINT "individual_votes_vote_id_fkey" FOREIGN KEY ("vote_id") REFERENCES "votes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_votes" ADD CONSTRAINT "individual_votes_deputy_id_fkey" FOREIGN KEY ("deputy_id") REFERENCES "deputies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote_orientations" ADD CONSTRAINT "vote_orientations_vote_id_fkey" FOREIGN KEY ("vote_id") REFERENCES "votes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organ_memberships" ADD CONSTRAINT "organ_memberships_organ_id_fkey" FOREIGN KEY ("organ_id") REFERENCES "organs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organ_memberships" ADD CONSTRAINT "organ_memberships_deputy_id_fkey" FOREIGN KEY ("deputy_id") REFERENCES "deputies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "front_memberships" ADD CONSTRAINT "front_memberships_front_id_fkey" FOREIGN KEY ("front_id") REFERENCES "fronts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "front_memberships" ADD CONSTRAINT "front_memberships_deputy_id_fkey" FOREIGN KEY ("deputy_id") REFERENCES "deputies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_organs" ADD CONSTRAINT "event_organs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_organs" ADD CONSTRAINT "event_organs_organ_id_fkey" FOREIGN KEY ("organ_id") REFERENCES "organs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendances" ADD CONSTRAINT "event_attendances_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendances" ADD CONSTRAINT "event_attendances_deputy_id_fkey" FOREIGN KEY ("deputy_id") REFERENCES "deputies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_deputy_id_fkey" FOREIGN KEY ("deputy_id") REFERENCES "deputies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_expense_type_code_fkey" FOREIGN KEY ("expense_type_code") REFERENCES "expense_types"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deputy_flight_summaries" ADD CONSTRAINT "deputy_flight_summaries_deputy_id_fkey" FOREIGN KEY ("deputy_id") REFERENCES "deputies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- search by deputy name tolerant to typos and partial names (see USE_CASES.md, find my deputy)
-- search_name is lowercase and without accents, built at ingestion
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

CREATE INDEX "deputies_search_name_trgm_idx" ON "deputies" USING GIN ("search_name" gin_trgm_ops);