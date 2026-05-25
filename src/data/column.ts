
export interface ColumnSetting {
  label: string;
  value: string;
  disabled?: boolean;
  isVisible?: boolean;
}

export const columns: ColumnSetting[] = [
  { label: 'Product ID', value: 'productId' },
  { label: 'Product Name', value: 'productName', disabled: true, isVisible: true },
  { label: 'Shop Name', value: 'shopName', disabled: true, isVisible: true },
  { label: 'SKU', value: 'sku', disabled: true, isVisible: true },
  { label: 'Category', value: 'categoryName', disabled: true, isVisible: true },
  { label: 'Brand', value: 'brandName', isVisible: true },
  { label: 'DP', value: 'dpPrice', disabled: true, isVisible: true },
  { label: 'MRP', value: 'mrp', disabled: true, isVisible: true },
  { label: 'Selling Price', value: 'sellingPrice', disabled: true, isVisible: true },
  { label: 'Burn', value: 'burn' },
  { label: 'Discount', value: 'discount' },
  { label: 'Commission', value: 'commission', isVisible: true },
  { label: 'Display Order', value: 'displayOrder' },
  { label: 'Stock', value: 'stock' },
  { label: 'Warranty Type', value: 'warrantyType' },
  { label: 'Warranty Period', value: 'warrantyPeriod' },
  { label: 'Last Update', value: 'updatedAt' },
  { label: 'Created By', value: 'createdBy' },
  { label: 'Updated By', value: 'updatedBy' },
  { label: 'Review Rating', value: 'reviewRating' },
];
