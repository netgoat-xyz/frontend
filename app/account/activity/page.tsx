"use client";

import { motion } from "framer-motion";

export default function AccountActivityPage() {
  const activities = [
    {
      id: 1,
      type: "login",
      description: "Logged in from new device",
      details: "Chrome on Windows • IP: 192.168.1.1",
      timestamp: "2 hours ago",
      color: "blue",
    },
    {
      id: 2,
      type: "settings",
      description: "Updated account settings",
      details: "Changed notification preferences",
      timestamp: "1 day ago",
      color: "green",
    },
    {
      id: 3,
      type: "team",
      description: "Created new team",
      details: 'Team "Production" created',
      timestamp: "3 days ago",
      color: "purple",
    },
    {
      id: 4,
      type: "security",
      description: "Security alert acknowledged",
      details: "Unusual login attempt from unknown location",
      timestamp: "5 days ago",
      color: "yellow",
    },
    {
      id: 5,
      type: "password",
      description: "Password changed",
      details: "Password successfully updated",
      timestamp: "1 week ago",
      color: "red",
    },
  ];

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      purple: "bg-purple-500",
      yellow: "bg-yellow-500",
      red: "bg-red-500",
    };
    return colors[color] || "bg-neutral-500";
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Activity Log</h1>
            <button className="text-sm bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-md border border-neutral-700 transition-colors">
              Export Activity
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden"
          >
            <div className="divide-y divide-neutral-800">
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="p-6 hover:bg-neutral-800/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div
                        className={`w-3 h-3 rounded-full ${getColorClass(
                          activity.color
                        )}`}
                      ></div>
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-white font-medium">
                            {activity.description}
                          </h3>
                          <p className="text-neutral-400 text-sm mt-1">
                            {activity.details}
                          </p>
                        </div>
                        <span className="text-neutral-500 text-sm ml-4 whitespace-nowrap">
                          {activity.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="mt-6 flex justify-center">
            <button className="text-sm text-neutral-400 hover:text-white transition-colors">
              Load more activity
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
