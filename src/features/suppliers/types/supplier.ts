export type SupplierListItem = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  status: "ACTIVE" | "INACTIVE";
};
