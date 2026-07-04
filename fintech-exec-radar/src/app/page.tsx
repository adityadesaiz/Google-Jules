"use client";

import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Briefcase, Building, MapPin, Target, Eye, Sparkles, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PROFILE_BASELINE } from "@/config/profile";

export default function Dashboard() {
  const opportunities = useStore((state) => state.opportunities);
  const alerts = useStore((state) => state.alerts);
  const addAlert = useStore((state) => state.addAlert);

  const [activeTab, setActiveTab] = useState("Global");

  // Basic KPI calculations
  const totalTracked = opportunities.length;
  const highMatch = opportunities.filter(o => o.matchScore >= 85).length;
  const activeApps = opportunities.filter(o => o.status === 'Applied' || o.status === 'Interviewing').length;
  const interviewing = opportunities.filter(o => o.status === 'Interviewing').length;

  const filteredOpps = activeTab === "Global"
    ? opportunities
    : opportunities.filter(o => o.location.toLowerCase().includes(activeTab.toLowerCase()));

  // Simulate strategy coach alerts based on data
  useEffect(() => {
     if (opportunities.length > 0 && alerts.length === 0) {
        addAlert({
            type: 'trend',
            message: 'Detected 40% uptick in Singapore Databricks Unity Catalog requirements this week; recommend adjusting primary resume anchor.'
        })
     }
  }, [opportunities.length, alerts.length, addAlert]);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100">

      {/* Sidebar / Strategy Coach */}
      <div className="w-64 border-r border-zinc-800 bg-zinc-950/50 p-4 flex flex-col gap-4 overflow-y-auto">
        <div className="flex items-center gap-2 pb-4 border-b border-zinc-800">
          <Target className="w-5 h-5 text-indigo-400" />
          <h1 className="font-bold text-sm tracking-tight">FinTechExec Radar</h1>
        </div>

        <div className="space-y-1">
          <Link href="/">
            <Button variant="secondary" className="w-full justify-start text-xs h-8">
              <Eye className="w-3 h-3 mr-2" />
              The Radar
            </Button>
          </Link>
          <Link href="/ingest">
            <Button variant="ghost" className="w-full justify-start text-xs h-8 text-zinc-400 hover:text-zinc-100">
              <Sparkles className="w-3 h-3 mr-2" />
              Parse New JD
            </Button>
          </Link>
          <Link href="/kanban">
            <Button variant="ghost" className="w-full justify-start text-xs h-8 text-zinc-400 hover:text-zinc-100">
              <Briefcase className="w-3 h-3 mr-2" />
              Pipeline
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="ghost" className="w-full justify-start text-xs h-8 text-zinc-400 hover:text-zinc-100">
              <CheckCircle className="w-3 h-3 mr-2" />
              Settings
            </Button>
          </Link>
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-800">
          <h2 className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wider">Strategy Coach</h2>
          <div className="space-y-3">
            {alerts.length === 0 ? (
                <div className="text-xs text-zinc-600">No active alerts.</div>
            ) : (
                alerts.map(alert => (
                    <div key={alert.id} className="p-2 bg-indigo-950/20 border border-indigo-900/50 rounded-sm">
                    <div className="flex items-start gap-2">
                        {alert.type === 'trend' ? <Sparkles className="w-3 h-3 text-indigo-400 mt-0.5" /> : <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5" />}
                        <p className="text-[10px] leading-tight text-indigo-200/80">{alert.message}</p>
                    </div>
                    </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top KPI Bar */}
        <div className="h-16 border-b border-zinc-800 flex items-center px-6 gap-6 bg-zinc-950/80 shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Total Tracked</span>
            <span className="text-lg font-bold text-zinc-100 leading-tight">{totalTracked}</span>
          </div>
          <div className="w-px h-8 bg-zinc-800"></div>
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">High Match (&gt;85%)</span>
            <span className="text-lg font-bold text-emerald-400 leading-tight">{highMatch}</span>
          </div>
          <div className="w-px h-8 bg-zinc-800"></div>
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Active Apps</span>
            <span className="text-lg font-bold text-indigo-400 leading-tight">{activeApps}</span>
          </div>
          <div className="w-px h-8 bg-zinc-800"></div>
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Interviewing</span>
            <span className="text-lg font-bold text-amber-400 leading-tight">{interviewing}</span>
          </div>
        </div>

        {/* Data Grid Feed */}
        <div className="flex-1 p-6 overflow-y-auto bg-zinc-950">
          <Tabs defaultValue="Global" onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList className="bg-zinc-900 border border-zinc-800 h-8">
                <TabsTrigger value="Global" className="text-xs px-3 data-[state=active]:bg-zinc-800">Global</TabsTrigger>
                <TabsTrigger value="Singapore" className="text-xs px-3 data-[state=active]:bg-zinc-800">Singapore</TabsTrigger>
                <TabsTrigger value="Dubai" className="text-xs px-3 data-[state=active]:bg-zinc-800">Dubai</TabsTrigger>
                <TabsTrigger value="Canada" className="text-xs px-3 data-[state=active]:bg-zinc-800">Canada</TabsTrigger>
                <TabsTrigger value="EU" className="text-xs px-3 data-[state=active]:bg-zinc-800">EU/Poland</TabsTrigger>
                <TabsTrigger value="APAC" className="text-xs px-3 data-[state=active]:bg-zinc-800">APAC</TabsTrigger>
              </TabsList>

              <Link href="/ingest">
                <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                  + Add Opportunity
                </Button>
              </Link>
            </div>

            <TabsContent value={activeTab} className="mt-0 outline-none">
              <div className="rounded-md border border-zinc-800 bg-zinc-950/50">
                {filteredOpps.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-sm">
                    No opportunities tracked for {activeTab}. Ingest a JD to start.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800/50">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-4 p-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-900/50">
                      <div className="col-span-4">Role & Company</div>
                      <div className="col-span-2">Location</div>
                      <div className="col-span-2">Match</div>
                      <div className="col-span-3">Core Tags</div>
                      <div className="col-span-1 text-right">Actions</div>
                    </div>
                    {/* Rows */}
                    {filteredOpps.map((opp) => (
                      <div key={opp.id} className="grid grid-cols-12 gap-4 p-3 items-center hover:bg-zinc-900/30 transition-colors">
                        <div className="col-span-4 flex flex-col overflow-hidden">
                          <span className="font-medium text-sm text-zinc-100 truncate">{opp.title}</span>
                          <span className="text-xs text-zinc-500 flex items-center gap-1 truncate mt-0.5">
                            <Building className="w-3 h-3" /> {opp.company}
                          </span>
                        </div>
                        <div className="col-span-2 text-xs text-zinc-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {opp.location}
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-[10px] font-mono rounded-sm border ${
                                opp.matchScore >= 85 ? 'text-emerald-400 border-emerald-900 bg-emerald-950/30' :
                                opp.matchScore >= 70 ? 'text-amber-400 border-amber-900 bg-amber-950/30' :
                                'text-red-400 border-red-900 bg-red-950/30'
                            }`}>
                                {opp.matchScore}%
                            </Badge>
                          </div>
                        </div>
                        <div className="col-span-3 flex gap-1 flex-wrap">
                          {opp.coreTags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[10px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded-sm border border-zinc-800 truncate max-w-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Link href={`/workspace/${opp.id}`}>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-zinc-500 hover:text-zinc-100">
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
