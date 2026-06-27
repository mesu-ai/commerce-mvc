interface CategotyLayerT {
  base: string;
  first?: string;
  second?: string;
  third?: string;
}

export interface CategoryWithLayerT {
  categoryId: number | null;
  categoryName: string;
  layer: CategotyLayerT;
}