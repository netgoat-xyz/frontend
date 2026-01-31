import NavigationTop from "@/components/elements/NavigationTop";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavigationTop />
      <main className="p-6">{children}</main>
    </>
  );
}
