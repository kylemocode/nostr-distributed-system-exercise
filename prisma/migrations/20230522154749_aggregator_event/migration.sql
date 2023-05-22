-- CreateTable
CREATE TABLE "Aggregation_Event" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "sig" TEXT,
    "payload" TEXT,

    CONSTRAINT "Aggregation_Event_pkey" PRIMARY KEY ("id")
);
