export type CategoryListItem = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  status: "ACTIVE" | "INACTIVE";
};
