import { users } from "../../data/user";
import { Request, Response, Router } from "express";

const router = Router();

// type NewUsersT= Pick<UserT,  'name' | 'employeeId' | 'email' | 'role' | 'status'>

router.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Users retrieved successfully",
    data: users,
  });
});

router.get("/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const userData = users.find((user) => user.employeeId === id);

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

});

export default router;
