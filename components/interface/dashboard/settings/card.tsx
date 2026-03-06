import { ReactNode } from "react";

export function SettingsCard({
  title,
  description,
  children,
  footer,
  danger
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  danger?: boolean;
}) {
  return (
    <div className={`border rounded-lg bg-zinc-900/30 overflow-hidden ${danger ? 'border-red-900/50' : 'border-zinc-800'}`}>
      <div className="p-6">
        <h3 className={`text-lg font-medium ${danger ? 'text-red-500' : 'text-white'}`}>{title}</h3>
        <p className="text-sm text-zinc-400 mt-1 mb-6">{description}</p>
        <div className="space-y-4">{children}</div>
      </div>
      {footer && (
        <div className={`bg-zinc-900/50 border-t px-6 py-4 flex justify-between items-center ${danger ? 'border-red-900/30' : 'border-zinc-800'}`}>
          {footer}
        </div>
      )}
    </div>
  );
}
