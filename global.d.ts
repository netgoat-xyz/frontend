
interface Team {
  id: string;
  name: string;
  slug: string;
  role: string;
  memberCount: number;
  avatar?: string;
  isPersonal?: boolean;
}

interface DomainPropsCard {
  domain: {
    name: string;
    status: string;
    group: string;
    isStarred: boolean;
    updatedAt: string;
    pathName: string;
  };
}