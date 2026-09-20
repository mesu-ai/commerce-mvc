export interface RoleT {
  roleId: number;
  roleName: string;
  status: 'Y' | 'N';
  permissions: string[];
}
