import { type ReactNode } from 'react';

interface PageWrapperProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function PageWrapper({ title, description, children }: PageWrapperProps) {
  return (
    <div className="w-full min-h-screen bg-[#F5E9D4]/20">
      <div className="w-full max-w-none p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#2E3A3F] mb-2">{title}</h1>
          {description && <p className="text-[#2E3A3F]/70">{description}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
