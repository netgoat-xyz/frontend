import DomainsSection from "@/components/interface/dashboard/home/domainsCard";

export default async function DomainsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">All domains</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Every domain configured for this team, including items still waiting on verification.
        </p>
      </div>

      <DomainsSection maxItems={null} />
    </div>
  );
}
