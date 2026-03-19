export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
      {children}
    </div>
  );
}
