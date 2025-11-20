import type { ReactNode } from "react";

interface TableWrapperProps {
  title: string;
  description: string;
  loading?: boolean;
  children: ReactNode;
}

export function TableWrapper({
  title,
  description,
  loading = false,
  children,
}: TableWrapperProps) {
  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="w-full">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2E3A3F]">{title}</h1>
        <p className="text-[#2E3A3F]/70">{description}</p>
      </div>

      {/* CHILDREN (filters, table, modal) */}
      {children}
    </div>
  );
}
