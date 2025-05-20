import React from 'react';
import { SystemHealth as HealthDashboard } from "@/components/ui/health-status";

export default function SystemHealth() {
  return (
    <div className="container mx-auto py-10 px-4 md:px-6 lg:px-8">
      <div className="flex flex-col gap-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-merriweather">System Health Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Monitor the real-time status of all services and components
          </p>
        </div>
        
        <div className="grid gap-6">
          <HealthDashboard refreshInterval={30000} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">System Information</h2>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Environment</span>
                  <span className="font-medium">Production</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Application Version</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Node.js Version</span>
                  <span className="font-medium">20.x</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Database</span>
                  <span className="font-medium">PostgreSQL</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">AI Provider</span>
                  <span className="font-medium">Anthropic Claude</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Maintenance Information</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Last Maintenance</span>
                  <span className="font-medium">May 19, 2025</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Scheduled Downtime</span>
                  <span className="font-medium">None planned</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Last Deployment</span>
                  <span className="font-medium">May 20, 2025</span>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded p-4 mt-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-1">Service Notice</h3>
                <p className="text-sm text-blue-700">
                  Our systems are operating normally. There are no planned maintenance periods or service disruptions scheduled.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}