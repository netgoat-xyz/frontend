import type { Metadata } from "next";

type Params = Promise<{
  teamName: string;
  section?: string[];
}>;

export async function generateTeamMetadata(params: Params, pageOverride?: string): Promise<Metadata> {
  const resolvedParams = await params;
  const { teamName, section } = resolvedParams;

  const cleanTeam = decodeURIComponent(teamName).replace("@", "");
  const team = cleanTeam.charAt(0).toUpperCase() + cleanTeam.slice(1);

  const rawPage = pageOverride 
    ? pageOverride 
    : (section && section.length > 0 ? section[section.length - 1] : "Overview");

  const pageTitle = rawPage
    .replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());

  return {
    title: `Netgoat | Teams ${pageTitle}`,
    description: `Manage ${pageTitle.toLowerCase()} for the ${team} team on NetGoat.`
  };
}

export default async function generateMetadata({ params }: { params: Params }) {
  return generateTeamMetadata(params);
}