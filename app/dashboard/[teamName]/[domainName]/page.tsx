import { HeaderSection } from '@/components/interface/domains/overview/HeaderSection';
import { TrafficCard } from '@/components/interface/domains/overview/TrafficCard';
import { SecurityStatusCards } from '@/components/interface/domains/overview/SecurityStatusCards';
import { QuickActionsCard } from '@/components/interface/domains/overview/QuickActionsCard';
import { loadDomainByRoute } from './_lib/domain-data'

type Props = {
  params: {
    teamName: string
    domainName: string
  }
}

const DomainDashboard = async ({ params }: Props) => {
  const { teamName, domainName, domain, domainData } = await loadDomainByRoute(params)

  if (!domain || !domainData) {
    return (
      <div className="min-h-screen p-8">
        <h2 className="text-2xl font-semibold">Domain not found</h2>
        <p className="text-muted">No domain "{domainName}" found for team "{teamName}".</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <HeaderSection domainData={domainData} />

      <div className="mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TrafficCard />
          <SecurityStatusCards />
        </div>
        <div className="space-y-6">
          <QuickActionsCard />
        </div>
      </div>
    </div>
  )
}

export default DomainDashboard