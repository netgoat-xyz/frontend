import { HeaderSection } from '@/components/interface/domains/overview/HeaderSection';
import { TrafficCard } from '@/components/interface/domains/overview/TrafficCard';
import { SecurityStatusCards } from '@/components/interface/domains/overview/SecurityStatusCards';
import { QuickActionsCard } from '@/components/interface/domains/overview/QuickActionsCard';

const DomainDashboard = () => {
  const domainData = {
    name: 'netgoat.xyz',
    status: 'healthy',
    origin: 'http://10.0.0.4:3000',
    certExp: '89 days',
    wafStatus: 'Active'
  };

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
  );
}

export default DomainDashboard;