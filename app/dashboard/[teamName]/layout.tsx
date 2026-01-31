import NavigationTop from "@/components/elements/NavigationTop";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div suppressHydrationWarning>
     {children}
    </div>
  );
}
