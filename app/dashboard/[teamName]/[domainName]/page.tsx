import { HeaderSection } from '@/components/interface/domains/overview/HeaderSection';
import { TrafficCard } from '@/components/interface/domains/overview/TrafficCard';
import { SecurityStatusCards } from '@/components/interface/domains/overview/SecurityStatusCards';
import { QuickActionsCard } from '@/components/interface/domains/overview/QuickActionsCard';
import { loadDomainByRoute } from './_lib/domain-data'
import { getTranslations } from 'next-intl/server'
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { IconFolderCode } from "@tabler/icons-react"
import { ArrowUpRightIcon } from "lucide-react"

type Props = {
  params: {
    teamName: string
    domainName: string
  } | Promise<{ teamName: string, domainName: string }>
}

const DomainDashboard = async ({ params }: Props) => {
  const { teamName, domainName, domain, domainData } = await loadDomainByRoute(params)
  const t = await getTranslations('DashboardPages.domain')
  const takenFromToolbarLol = await getTranslations('DashboardPages.homeToolbar')
  if (!domain || !domainData) {
    return (
          <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconFolderCode />
        </EmptyMedia>
        <EmptyTitle>{t('notFound.title')}</EmptyTitle>
        <EmptyDescription>
          {t('notFound.description', { domainName, teamName })}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <Button>{takenFromToolbarLol('actions.addNew')}</Button>
      </EmptyContent>
    </Empty>
    )
  }

  const sslStatus = domain.auto_ssl ? 'AUTO' : (domain.ssl_enabled ? 'MANUAL' : 'NONE');
  const wafStatus = (domain.waf_rules && domain.waf_rules.length > 0) ? 'ENABLED' : 'DISABLED';

  const stats = domain.stats || {
    total_requests: 0,
    total_blocked: 0,
    bandwidth_used: 0
  };

  const cacheEnabled = domain.settings?.cache_enabled ?? true;

  return (
    <div className="min-h-svh">
      <HeaderSection domainData={domainData} />

      <div className="mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TrafficCard stats={stats} />
          <SecurityStatusCards sslStatus={sslStatus} wafStatus={wafStatus} />
        </div>
        <div className="space-y-6">
          <QuickActionsCard 
            teamSlug={teamName} 
            domainId={domain._id.toString()} 
            initialCacheEnabled={cacheEnabled} 
          />
        </div>
      </div>
    </div>
  )
}

export default DomainDashboard