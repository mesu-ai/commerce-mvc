import { RoleT } from "@/types/role";

export const roles: RoleT[] = [
  {
    roleId: 1,
    roleName: "super admin",
    status: "Y",
    permissions: [
      "dashboard.index",
      "dashboard.index.delete.action",

      "products.create",
      "products.manage",
      "products.manage.edit.action",
      "products.manage.view.action",

      "orders.create",
      "orders.manage",
      "orders.cancel",

      "settings.sellers.index",
      "settings.sellers.create",
      "settings.sellers.edit",
      "settings.sellers.banks",

      "access-control.employees",
      "access-control.employees.view.action",
      "access-control.employees.create",
      "access-control.employees.edit",
      "access-control.roles",
      "access-control.roles.create",
      "access-control.roles.edit",
    ],
  },
  {
    roleId: 2,
    roleName: "admin",
    status: "N",
    permissions: [
      "dashboard.index",
      "dashboard.index.delete.action",
      "products.create",
      "products.manage",
      "products.manage.edit.action",
      "products.manage.view.action",
      "orders.create",
      "orders.manage",
      "orders.cancel",
      "access-control.employees",
      "access-control.employees.view.action",
    ],
  },
  {
    roleId: 3,
    roleName: "vendor",
    status: "Y",
    permissions: [
      "dashboard.index",
      "dashboard.index.delete.action",
      "products.create",
      "products.manage",
      "products.manage.edit.action",
      "products.manage.view.action",
    ],
  },
  {
    roleId: 4,
    roleName: "logestic",
    status: "N",
    permissions: [
      "dashboard.index",
      "dashboard.index.delete.action",
      "products.manage",
      "products.manage.edit.action",
      "products.manage.view.action",
      "orders.create",
      "orders.manage",
      "orders.cancel",
    ],
  },
  {
    roleId: 5,
    roleName: "accountant",
    status: "N",
    permissions: ["dashboard.index"],
  },
];
