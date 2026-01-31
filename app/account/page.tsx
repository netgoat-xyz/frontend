"use client";

import { motion } from "framer-motion";

export default function AccountOverviewPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-6">Account Overview</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Account Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-neutral-900 border border-neutral-800 rounded-lg p-6"
            >
              <h2 className="text-xl font-semibold mb-4">Account Information</h2>
              <div className="space-y-3 text-neutral-400">
                <div className="flex justify-between">
                  <span>Username:</span>
                  <span className="text-white">Ducky</span>
                </div>
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="text-white">user@example.com</span>
                </div>
                <div className="flex justify-between">
                  <span>Account Status:</span>
                  <span className="text-green-400">Active</span>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-neutral-900 border border-neutral-800 rounded-lg p-6"
            >
              <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
              <div className="space-y-3 text-neutral-400">
                <div className="flex justify-between">
                  <span>Teams:</span>
                  <span className="text-white">3</span>
                </div>
                <div className="flex justify-between">
                  <span>Projects:</span>
                  <span className="text-white">12</span>
                </div>
                <div className="flex justify-between">
                  <span>Member Since:</span>
                  <span className="text-white">Jan 2026</span>
                </div>
              </div>
            </motion.div>

            {/* Recent Activity Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 md:col-span-2"
            >
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <div className="space-y-3 text-neutral-400">
                <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Logged in from new device</span>
                  <span className="ml-auto text-sm">2 hours ago</span>
                </div>
                <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Updated account settings</span>
                  <span className="ml-auto text-sm">1 day ago</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Created new team</span>
                  <span className="ml-auto text-sm">3 days ago</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
