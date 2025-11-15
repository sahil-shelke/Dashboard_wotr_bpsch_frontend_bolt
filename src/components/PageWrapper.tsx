import { type ReactNode } from 'react';

interface PageWrapperProps {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}

export function PageWrapper({ title, description, children, action }: PageWrapperProps) {
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-green-50/30 via-white to-amber-50/20">
      <div className="w-full max-w-none p-6 space-y-6">
        <div className="flex items-start justify-between gap-4 animate-slide-up">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-2 text-base max-w-3xl">{description}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
        <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
