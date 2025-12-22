import UsageCard from "@/components/interface/dashboard/home/usageCard";
import AlertsCard from "@/components/interface/dashboard/home/alertsCard";
import ProjectToolbar from "@/components/interface/dashboard/home/projectToolbar";
import DomainsSection from "@/components/interface/dashboard/home/domainsCard";

export default function DashboardHome() {
  return (
    <div>
      <div>
        <ProjectToolbar />
      </div>
      <div className="flex flex-col md:flex-row w-full md:space-x-8 space-y-6 md:space-y-0">
        <div className="w-full md:w-[30%] min-w-0">
          <div>
            <div className="my-6 text-neutral-100 text-sm">Usage</div>
            <UsageCard />
          </div>
          <div>
            <div className="my-6 text-neutral-100 text-sm">Alerts</div>
            <AlertsCard />
          </div>
        </div>

        <div className="w-full md:w-[70%]">
          <div className="flex justify-between items-center my-6">
            <h2 className="text-neutral-100 text-sm font-medium">Domains</h2>
          </div>
          <DomainsSection />
        </div>
      </div>
    </div>
  );
}
