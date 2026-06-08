import { RoleT } from "@/types/role";

export const roles: RoleT[] = [
  {
    id: 1,
    role: "super admin",
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
    id: 2,
    role: "admin",
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
    id: 3,
    role: "vendor",
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
    id: 4,
    role: "logestic",
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
    id: 5,
    role: "accountant",
    status: "N",
    permissions: ["dashboard.index"],
  },
];
