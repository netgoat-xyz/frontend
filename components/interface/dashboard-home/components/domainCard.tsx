import { StarIcon } from "lucide-react";

export default function DomainCard({ domain }: { domain: { name: string, status: string, group: string, isStarred: boolean, updatedAt: string } }) {
  const isValid = domain.status === "Valid Configuration";

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-neutral-100 font-semibold text-[15px] group-hover:underline cursor-pointer">
              {domain.name}
            </h3>
            {domain.isStarred && (
              <StarIcon className="w-4 h-4 fill-yellow-500 text-yellow-500" />
            )}
          </div>
          <div className="flex items-center mt-1.5 space-x-2">
             {/* Status Indicator Dot */}
            <div className={`w-2 h-2 rounded-full ${isValid ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className={`text-xs ${isValid ? 'text-neutral-400' : 'text-red-400'}`}>
              {domain.status}
            </span>
          </div>
        </div>
        
        {/* External Link Icon */}
        <a href={`https://${domain.name}`} target="_blank" rel="noreferrer" className="text-neutral-500 hover:text-neutral-100 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center space-x-4">
          <div className="flex flex-col">
            <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Group</span>
            <span className="text-xs text-neutral-300">{domain.group}</span>
          </div>
          <div className="flex flex-col border-l border-neutral-800 pl-4">
            <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Updated</span>
            <span className="text-xs text-neutral-300">{domain.updatedAt}</span>
          </div>
        </div>
        
        <button className="text-neutral-400 hover:text-neutral-100 text-xs font-medium border  border-neutral-800 px-3 py-1.5 rounded-md hover:bg-neutral-900 transition-all">
          Edit
        </button>
      </div>
    </div>
  );
}
