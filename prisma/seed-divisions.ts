// Seeds only divisions and city_with_area (with each city's divisionId),
// leaving every other table untouched.
// Run with:  npm run db:seed:divisions
import "dotenv/config";
import { prisma } from "../src/config/prisma";
import { citiesWithAreas } from "../src/data/cityWithArea";
import { divisions } from "../src/data/division";

async function main() {
  const cityDivisionIds = new Map(
    divisions.flatMap(({ divisionId, cityIds }) =>
      cityIds.map((cityId) => [cityId, divisionId] as const),
    ),
  );

  // Cities FK-reference divisions, so clear cities before divisions
  await prisma.$transaction([
    prisma.cityWithArea.deleteMany({}),
    prisma.division.deleteMany({}),
    prisma.division.createMany({
      data: divisions.map(({ cityIds, ...division }) => division),
    }),
    prisma.cityWithArea.createMany({
      data: citiesWithAreas.map((city) => ({
        ...city,
        divisionId: cityDivisionIds.get(city.cityId) ?? null,
      })),
    }),
  ]);

  const seeded = await prisma.division.findMany({
    orderBy: { divisionId: "asc" },
    include: { _count: { select: { cities: true } } },
  });
  for (const { divisionId, divisionName, _count } of seeded)
    console.log(`  ${divisionId} ${divisionName}: ${_count.cities} cities`);
  const unassigned = await prisma.cityWithArea.count({
    where: { divisionId: null },
  });
  console.log(`  cities without a division: ${unassigned}`);
  console.log("✅ Divisions seeded.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
