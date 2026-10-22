export interface UserT {
  name: string;
  username: string;
  employeeId: string;
  mobileNo: string;
  email: string;
  nid: string;
  photo: File | string;
  departmentId: number;
  departmentName?: string;
  roleId: number;
  roleName: string;
  gender: "female" | "male";
  status: "Y" | "N";
  permissions: string[];
  // token: { access: string; refresh: string };
}
