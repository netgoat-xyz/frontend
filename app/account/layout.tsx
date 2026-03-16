import NavigationTop from "@/components/elements/NavigationTop";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavigationTop />
      <main className="min-h-svh bg-neutral-950">{children}</main>
    </>
  );
}
