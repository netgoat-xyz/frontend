import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, ArrowLeft } from "lucide-react";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageTitle } from "../../SiteTitle";
import { SectionCards } from "@/components/section-cards";

export function OverviewContent() {
  return (
    <div>
      <div className="p-6">
        <PageTitle
          title="System Overview"
          subtitle="Key metrics and insights at a glance"
        />
            <SectionCards />

      </div>
    </div>
  );
}
