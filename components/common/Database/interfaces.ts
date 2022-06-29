
export interface Column {
  id: string;
  label: string;
}

export interface Row {
  id: string;
  title: string;
  fields: { [id: string]: string | number | boolean | Date | null };
}

export interface View {
  id: string;
  title: string;
  type: 'board' | 'table';
}
