import { Request, Response, Router, NextFunction } from "express";
import { prisma } from "../../config/prisma";
import { verifyAccessToken } from "../../middleware/auth.middleware";

const router = Router();

router.get(
  "/citywithareas", verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { keyword } = req.query;
      const where: any = {};
      const keywordStr =
        typeof keyword === "string" ? keyword.toLowerCase().trim() : undefined;
      if (keywordStr) {
        where.cityName = { contains: keywordStr, mode: "insensitive" };
      }
      const addresses = await prisma.cityWithArea.findMany({
        where,
      });

      const totalItems = await prisma.cityWithArea.count({ where });

      if (totalItems === 0) {
        return res.status(200).json({
          success: true,
          message: "City with areas retrieved successfully",
          data: [],
          pagination: {
            currentPage: 0,
            itemsPerPage: totalItems,
            totalPages: 0,
            totalItems: 0,
          },
        });
      }

      return res.status(200).json({
        success: true,
        message: "City with areas retrieved successfully",
        data: addresses,
        pagination: {
          currentPage: 1,
          itemsPerPage: totalItems,
          totalPages: 1,
          totalItems,
        },
      });
    } catch (err) {
      return next(err);
    }
  },
);

router.get(
  "/divisions", verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const divisions = await prisma.division.findMany({
        orderBy: { divisionName: "asc" },
      });
      return res.status(200).json({
        success: true,
        message: "Divisions retrieved successfully",
        data: divisions,
      });
    } catch (err) {
      return next(err);
    }
  },
);

// Division -> cities -> areas tree. ?divisionId narrows to one division,
// ?keyword matches division or city name.
router.get(
  "/division-city-areas",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { keyword, divisionId } = req.query;
      const where: any = {};
      if (divisionId !== undefined) {
        const id = Number(divisionId);
        if (!Number.isInteger(id) || id <= 0)
          return res
            .status(400)
            .json({ success: false, message: "Invalid division ID" });
        where.divisionId = id;
      }
      const keywordStr =
        typeof keyword === "string" ? keyword.trim() : undefined;
      const cityWhere = keywordStr
        ? { cityName: { contains: keywordStr, mode: "insensitive" as const } }
        : undefined;
      if (keywordStr) {
        where.OR = [
          { divisionName: { contains: keywordStr, mode: "insensitive" } },
          { cities: { some: cityWhere } },
        ];
      }

      const divisions = await prisma.division.findMany({
        where,
        orderBy: { divisionName: "asc" },
        include: {
          cities: {
            orderBy: { cityName: "asc" },
            select: { cityId: true, cityName: true, areas: true },
          },
        },
      });

      // A keyword that matches a city (not the division) only keeps those cities
      const data = keywordStr
        ? divisions.map((division) =>
            division.divisionName
              .toLowerCase()
              .includes(keywordStr.toLowerCase())
              ? division
              : {
                  ...division,
                  cities: division.cities.filter((city) =>
                    city.cityName
                      .toLowerCase()
                      .includes(keywordStr.toLowerCase()),
                  ),
                },
          )
        : divisions;

      return res.status(200).json({
        success: true,
        message: "Divisions with cities and areas retrieved successfully",
        data,
      });
    } catch (err) {
      return next(err);
    }
  },
);

export default router;
