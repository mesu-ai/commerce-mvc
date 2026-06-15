import { UserT } from "@/types/user";

export const users: UserT[] = [
  {
    employeeId: '556699',
    name: "mesu",
    username: "mesu12",
    email: "mesu@example.com",
    role: "admin",
    status: "Y",
    gender: "male",
    mobileNo: '01521316455',
    department: '2',
    nid: '2154784541',
    photo: '/images/user44.jpg',
    permissions: [
      "dashboard.index",
      "dashboard.index.delete.action",

      "products.create",
      "products.manage",
      "products.manage.edit.action",
      "products.manage.view.action",
      "access-control.employees",
      "orders.create",
      "orders.manage",
      "orders.cancel",
    ],
  },
  {
    employeeId: '556610',
    username: "sumin12",
    name: "sumin",
    email: "sumin@example.com",
    role: "admin",
    status: "Y",
    gender: "male",
    mobileNo: '01912345678',
    department: '2',
    nid: '2154784541',
    photo: '/images/user54.png',
    permissions: [
      "dashboard.index",
      "dashboard.index.view.action",

      "products.create",
      "products.manage",
      "products.manage.edit.action",
      "products.manage.view.action",

      "orders.create",
      "orders.manage",
      "orders.cancel",
    ],
  },
  {
    employeeId: '558899',
    name: "jomin",
    username: "jomin12",
    email: "jomin@example.com",
    role: "super admin",
    status: "Y",
    gender: "male",
    mobileNo: '01812547896',
    department: '4',
    nid: '2154784541',
    photo: '/images/user66.jpg',
    permissions: [
      "dashboard.index",
      "dashboard.index.delete.action",
      
      "dashboard.index",
      "dashboard.index.delete.action",

      "products.create",
      "products.edit",
      "products.duplicate",
      
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
      "settings.brands.index",
      "settings.brands.create",
      "settings.brands.edit",
      "settings.categories.index",
      "settings.categories.create",
      "settings.categories.edit",

      "settings.variants.attributes",
      "settings.variants.attributes.create",
      "settings.variants.attributes.edit",
      
      "settings.variants.attribute-values",
      "settings.variants.attribute-values.create",
      "settings.variants.attribute-values.edit",

      "settings.variants.category-configurations",
      "settings.variants.category-configurations.create",
      "settings.variants.category-configurations.edit",


      "access-control.employees",
      "access-control.employees.view.action",
      "access-control.employees.create",
      "access-control.employees.edit",
      "access-control.roles",
      "access-control.roles.create",
      "access-control.roles.edit",
      
    ],
  },
];
