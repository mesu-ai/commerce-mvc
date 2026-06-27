import { UserT } from "../../types/user";
import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma";

const router = Router();

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "your-access-token-secret";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "your-refresh-token-secret";

type NewUserT = Pick<
  UserT,
  | "name"
  | "employeeId"
  | "mobileNo"
  | "email"
  | "photo"
  | "role"
  | "permissions"
>;

router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (user && username === user.username && password === "1234") {

    const accessToken = jwt.sign(
      { id: user.employeeId, username: user.username },
      ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    // Generate refresh token (expires in 7 days)
    const refreshToken = jwt.sign(
      { id: user.employeeId, username },
      REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        // userInfo: user as Omit<typeof user, "username">,
        userInfo: {
          name: user.name,
          employeeId: user.employeeId,
          email: user.email,
          mobileNo: user.mobileNo,
          photo: user.photo,
          role: user.role,
          permissions: user.permissions,
        } as NewUserT,
        accessToken,
      },
    });

  } else {
    res.status(401).json({
      success: false,
      message: "Invalid username or password",
    });
  }
});

router.post("/refresh", (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token not found",
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as {
      id: number;
      username: string;
    };

    // Generate new access token
    const accessToken = jwt.sign(
      { id: decoded.id, username: decoded.username },
      ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: accessToken,
      },
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
});

router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: false, // Set to true in production with HTTPS
    sameSite: "lax",
  });

  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
});

export default router;
