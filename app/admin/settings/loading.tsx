import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Loading() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Settings</CardTitle>
        <CardDescription>Configure global application settings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-4 w-[250px]" />
        </div>
        <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-4 w-[300px]" />
                </div>
                <Skeleton className="h-6 w-10 rounded-full" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-4 w-[300px]" />
                </div>
                <Skeleton className="h-6 w-10 rounded-full" />
            </div>
        </div>
        <Skeleton className="h-10 w-[120px]" />
      </CardContent>
    </Card>
  );
}
