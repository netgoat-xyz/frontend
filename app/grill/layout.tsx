const Metadata = {
  title: "Grill - NetGoat",
  description: "Estrogen",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main>{children}</main>
    </>
  );
}
