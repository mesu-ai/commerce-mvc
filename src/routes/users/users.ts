import { Request, Response, Router, NextFunction } from "express";
import { prisma } from "../../config/prisma";
import { verifyAccessToken } from "../../middleware/auth.middleware";
import { Prisma } from "@prisma/client";
import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const router = Router();

const employeeUploadDirectory = path.join(process.cwd(), "images", "users");
fs.mkdirSync(employeeUploadDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: employeeUploadDirectory,
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${crypto.randomUUID()}${extension}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    callback(null, file.mimetype.startsWith("image/"));
  },
});

const EMPLOYEE_STATUSES = ["Y", "N"];
const EMPLOYEE_GENDERS = ["female", "male"];

function parseNumber(value: unknown): number | null {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function parsePermissions(value: unknown): string[] | null {
  if (Array.isArray(value)) {
    return value.every((permission) => typeof permission === "string")
      ? value
      : null;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) &&
        parsed.every((permission) => typeof permission === "string")
        ? parsed
        : null;
    } catch {
      return null;
    }
  }

  return null;
}

router.post(
  "/",
  verifyAccessToken,
  upload.single("photo"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = req.body ?? {};
      const employeeId =
        typeof input.employeeId === "string" ? input.employeeId.trim() : "";
      const name = typeof input.name === "string" ? input.name.trim() : "";
      const mobileNo =
        typeof input.mobileNo === "string" ? input.mobileNo.trim() : null;
      const email =
        typeof input.email === "string" ? input.email.trim() : null;
      const nid = typeof input.nid === "string" ? input.nid.trim() : null;
      const departmentId = parseNumber(input.departmentId);
      const roleId = parseNumber(input.roleId);
      const gender = typeof input.gender === "string" ? input.gender : null;
      const status = typeof input.status === "string" ? input.status : "Y";
      const permissions = parsePermissions(input.permissions);

      if (!employeeId || !name) {
        return res.status(400).json({
          success: false,
          message: "name and employeeId are required",
        });
      }
      if (!departmentId) {
        return res.status(400).json({
          success: false,
          message: "departmentId must be a positive integer",
        });
      }
      if (!roleId) {
        return res.status(400).json({
          success: false,
          message: "roleId must be a positive integer",
        });
      }
      if (gender !== null && !EMPLOYEE_GENDERS.includes(gender)) {
        return res.status(400).json({
          success: false,
          message: `Invalid gender. Allowed: ${EMPLOYEE_GENDERS.join(", ")}`,
        });
      }
      if (!EMPLOYEE_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Allowed: ${EMPLOYEE_STATUSES.join(", ")}`,
        });
      }
      if (!permissions) {
        return res.status(400).json({
          success: false,
          message: "permissions must be an array of strings",
        });
      }

      const [existingEmployee, existingUsername, department, role] =
        await Promise.all([
          prisma.user.findUnique({
            where: { employeeId },
            select: { employeeId: true },
          }),
          prisma.user.findUnique({
            where: { username: employeeId },
            select: { employeeId: true },
          }),
          prisma.department.findUnique({
            where: { departmentId },
            select: { departmentId: true, departmentName: true },
          }),
          prisma.role.findUnique({
            where: { roleId },
            select: { roleId: true, roleName: true },
          }),
        ]);

      if (existingEmployee) {
        return res.status(409).json({
          success: false,
          message: "employeeId already exists",
        });
      }
      if (existingUsername) {
        return res.status(409).json({
          success: false,
          message: "username derived from employeeId already exists",
        });
      }
      if (!department) {
        return res.status(400).json({
          success: false,
          message: "Invalid departmentId",
        });
      }
      if (!role) {
        return res.status(400).json({
          success: false,
          message: "Invalid roleId",
        });
      }

      const photo =
        req.file ? `images/users/${req.file.filename}` : (
          typeof input.photo === "string" && input.photo.trim()
            ? input.photo.trim()
            : null
        );

      const employee = await prisma.user.create({
        data: {
          employeeId,
          name,
          username: employeeId,
          mobileNo,
          email,
          nid,
          departmentId,
          departmentName: department.departmentName,
          roleId,
          roleName: role.roleName,
          gender,
          status,
          permissions,
          photo,
        } satisfies Prisma.UserUncheckedCreateInput,
      });

      return res.status(201).json({
        success: true,
        message: "Employee created successfully",
        data: employee,
      });
    } catch (err) {
      return next(err);
    }
  },
);

router.put(
  "/:employeeId",
  verifyAccessToken,
  upload.single("photo"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId } = req.params;
      const input = req.body ?? {};
      const existing = await prisma.user.findUnique({
        where: { employeeId },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const data: Prisma.UserUncheckedUpdateInput = {};
      const has = (field: string) =>
        Object.prototype.hasOwnProperty.call(input, field);

      if (has("name")) {
        if (typeof input.name !== "string" || !input.name.trim()) {
          return res.status(400).json({
            success: false,
            message: "name must be a non-empty string",
          });
        }
        data.name = input.name.trim();
      }

      for (const field of ["mobileNo", "email", "nid"] as const) {
        if (has(field)) {
          if (input[field] !== null && typeof input[field] !== "string") {
            return res.status(400).json({
              success: false,
              message: `${field} must be a string or null`,
            });
          }
          data[field] =
            typeof input[field] === "string" ? input[field].trim() : null;
        }
      }

      if (has("departmentId")) {
        const departmentId = parseNumber(input.departmentId);
        if (!departmentId) {
          return res.status(400).json({
            success: false,
            message: "departmentId must be a positive integer",
          });
        }
        const department = await prisma.department.findUnique({
          where: { departmentId },
          select: { departmentId: true, departmentName: true },
        });
        if (!department) {
          return res.status(400).json({
            success: false,
            message: "Invalid departmentId",
          });
        }
        data.departmentId = department.departmentId;
        data.departmentName = department.departmentName;
      }

      if (has("roleId")) {
        const roleId = parseNumber(input.roleId);
        if (!roleId) {
          return res.status(400).json({
            success: false,
            message: "roleId must be a positive integer",
          });
        }
        const role = await prisma.role.findUnique({
          where: { roleId },
          select: { roleId: true, roleName: true },
        });
        if (!role) {
          return res.status(400).json({
            success: false,
            message: "Invalid roleId",
          });
        }
        data.roleId = role.roleId;
        data.roleName = role.roleName;
      }

      if (has("gender")) {
        if (
          input.gender !== null &&
          (typeof input.gender !== "string" ||
            !EMPLOYEE_GENDERS.includes(input.gender))
        ) {
          return res.status(400).json({
            success: false,
            message: `Invalid gender. Allowed: ${EMPLOYEE_GENDERS.join(", ")}`,
          });
        }
        data.gender = input.gender;
      }

      if (has("status")) {
        if (
          typeof input.status !== "string" ||
          !EMPLOYEE_STATUSES.includes(input.status)
        ) {
          return res.status(400).json({
            success: false,
            message: `Invalid status. Allowed: ${EMPLOYEE_STATUSES.join(", ")}`,
          });
        }
        data.status = input.status;
      }

      if (has("permissions")) {
        const permissions = parsePermissions(input.permissions);
        if (!permissions) {
          return res.status(400).json({
            success: false,
            message: "permissions must be an array of strings",
          });
        }
        data.permissions = permissions;
      }

      if (req.file) {
        data.photo = `images/users/${req.file.filename}`;
      } else if (has("photo")) {
        if (input.photo !== null && typeof input.photo !== "string") {
          return res.status(400).json({
            success: false,
            message: "photo must be a string or null",
          });
        }
        data.photo =
          typeof input.photo === "string" ? input.photo.trim() : null;
      }

      if (Object.keys(data).length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one field is required to update",
        });
      }

      const employee = await prisma.user.update({
        where: { employeeId },
        data,
      });

      return res.status(200).json({
        success: true,
        message: "Employee updated successfully",
        data: employee,
      });
    } catch (err) {
      return next(err);
    }
  },
);

router.get(
  "/",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await prisma.user.findMany();
      return res.status(200).json({
        success: true,
        message: "Users retrieved successfully",
        data,
      });
    } catch (err) {
      return next(err);
    }
  },
);

router.get(
  "/:id",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userData = await prisma.user.findUnique({
        where: { employeeId: id },
      });

      if (!userData) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          data: {},
        });
      }

      return res.status(200).json({
        success: true,
        message: "User retrieved successfully",
        data: userData,
      });
    } catch (err) {
      return next(err);
    }
  },
);

export default router;
