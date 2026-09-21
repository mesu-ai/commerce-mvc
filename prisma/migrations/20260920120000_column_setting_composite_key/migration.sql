ALTER TABLE "column_settings" DROP CONSTRAINT "column_settings_pkey";

ALTER TABLE "column_settings"
ADD CONSTRAINT "column_settings_pkey" PRIMARY KEY ("type", "value");