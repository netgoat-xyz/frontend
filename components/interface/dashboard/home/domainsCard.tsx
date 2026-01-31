import React from "react";
import DomainCard from "./components/domainCard";

const domainData = [
  {
    name: "netgoat.xyz",
    status: "Valid Configuration",
    group: "Production",
    isStarred: true,
    updatedAt: "5d ago",
    pathName: "@me/netgoat.xyz"
  },
  {
    name: "my-awesome-app.com",
    status: "Valid Configuration",
    group: "Preview",
    isStarred: false,
    updatedAt: "2d ago",
    pathName: "@me/my-awesome-app.com"
  },
  {
    name: "old-marketing-site.net",
    status: "Invalid Configuration",
    group: "Production",
    isStarred: false,
    updatedAt: "12d ago",
    pathName: "@me/old-marketing-site.net"
  },
];

export default function DomainsSection() {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {domainData.map((domain, index) => (
          <DomainCard key={index} domain={domain} />
        ))}
      </div>
    </div>
  );
}
