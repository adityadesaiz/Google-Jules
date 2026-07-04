"use client";

import { useStore } from "@/store/useStore";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Target, ShieldAlert, Sparkles, Building, MapPin, Zap } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function WorkspacePage() {
  const { id } = useParams();
  const router = useRouter();

  const opportunity = useStore((state) =>
    state.opportunities.find(o => o.id === id)
  );
  const updateOpportunity = useStore((state) => state.updateOpportunity);

  const [resumeTweaks, setResumeTweaks] = useState("");
  const [executivePitch, setExecutivePitch] = useState("");

  useEffect(() => {
    if (opportunity) {
        setResumeTweaks(opportunity.resumeTweaks || "Drafting specific profile bullet points rewritten to align directly with the target JD's precise keywords...");
        setExecutivePitch(opportunity.executivePitch || "Drafting a hyper-metricized brief optimized for an international executive search recruiter or an enterprise CDAO...");
    }
  }, [opportunity]);

  if (!opportunity) {
    return <div className="p-8 text-zinc-400">Opportunity not found.</div>;
  }

  const handleSave = () => {
    updateOpportunity(opportunity.id, { resumeTweaks, executivePitch });
    toast.success("Workspace drafts saved.");
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden">

      {/* Top Header Navigation */}
      <div className="h-14 border-b border-zinc-800 bg-zinc-900/50 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-zinc-400 hover:text-zinc-100 transition-colors p-1">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex flex-col">
            <span className="font-semibold text-sm leading-tight">{opportunity.title}</span>
            <span className="text-xs text-zinc-500 flex items-center gap-1 leading-tight">
               {opportunity.company} <span className="text-zinc-700">•</span> {opportunity.location}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={`text-xs rounded-sm border ${
            opportunity.matchScore >= 85 ? 'text-emerald-400 border-emerald-900 bg-emerald-950/30' :
            opportunity.matchScore >= 70 ? 'text-amber-400 border-amber-900 bg-amber-950/30' :
            'text-red-400 border-red-900 bg-red-950/30'
          }`}>
            Match Score: {opportunity.matchScore}%
          </Badge>
          <Button onClick={handleSave} size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700">Save Workspace</Button>
        </div>
      </div>

      {/* Split Screen Content */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Column: Analysis & JD */}
        <div className="w-1/2 border-r border-zinc-800 flex flex-col bg-zinc-950">
            <ScrollArea className="flex-1 p-4">

                {/* Semantic Analysis Badges */}
                <div className="mb-6 space-y-4">
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Target className="w-3.5 h-3.5 text-indigo-400" />
                        AI Semantic Match Analysis
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-950/10 border border-emerald-900/30 p-3 rounded-md">
                            <span className="text-xs font-semibold text-emerald-400 mb-2 block">Aligned Pros</span>
                            <ul className="text-xs text-zinc-300 space-y-1.5 list-disc pl-4">
                                {opportunity.matchPros.map((pro, i) => <li key={i}>{pro}</li>)}
                            </ul>
                        </div>
                        <div className="bg-red-950/10 border border-red-900/30 p-3 rounded-md">
                            <span className="text-xs font-semibold text-red-400 mb-2 block">Gaps / Cons</span>
                            <ul className="text-xs text-zinc-300 space-y-1.5 list-disc pl-4">
                                {opportunity.matchCons.map((con, i) => <li key={i}>{con}</li>)}
                            </ul>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-indigo-950/10 border border-indigo-900/30 p-3 rounded-md">
                            <span className="text-xs font-semibold text-indigo-400 mb-2 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Hidden Assets
                            </span>
                            <ul className="text-xs text-zinc-300 space-y-1.5 list-disc pl-4">
                                {opportunity.hiddenAssets.map((asset, i) => <li key={i}>{asset}</li>)}
                            </ul>
                        </div>
                        <div className="bg-amber-950/10 border border-amber-900/30 p-3 rounded-md">
                            <span className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" /> Friction Points
                            </span>
                            <ul className="text-xs text-zinc-300 space-y-1.5 list-disc pl-4">
                                {opportunity.frictionPoints.map((point, i) => <li key={i}>{point}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>

                <Separator className="bg-zinc-800 my-6" />

                {/* Cleaned JD */}
                <div>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                        Parsed Requirements (Cleaned)
                    </h3>
                    <div className="text-xs text-zinc-400 font-mono whitespace-pre-wrap leading-relaxed bg-zinc-900/50 p-4 rounded-md border border-zinc-800">
                        {opportunity.cleanDescription || "No clean description generated."}
                    </div>
                </div>

            </ScrollArea>
        </div>

        {/* Right Column: Editable Drafts */}
        <div className="w-1/2 flex flex-col bg-zinc-950/50">
            <div className="flex-1 p-4 flex flex-col gap-4">

                <div className="flex-1 flex flex-col min-h-0">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                       <Zap className="w-3 h-3 text-amber-400" />
                       Resume Impact Tweaks
                    </h3>
                    <Textarea
                        value={resumeTweaks}
                        onChange={e => setResumeTweaks(e.target.value)}
                        className="flex-1 resize-none bg-zinc-900 border-zinc-800 text-sm font-mono focus-visible:ring-indigo-500/50"
                        placeholder="Rewrite specific profile bullets to match JD keywords..."
                    />
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                       <Target className="w-3 h-3 text-emerald-400" />
                       Targeted Executive Pitch
                    </h3>
                    <Textarea
                        value={executivePitch}
                        onChange={e => setExecutivePitch(e.target.value)}
                        className="flex-1 resize-none bg-zinc-900 border-zinc-800 text-sm font-mono focus-visible:ring-emerald-500/50"
                        placeholder="Draft hyper-metricized brief for recruiter..."
                    />
                </div>

            </div>
        </div>

      </div>
    </div>
  );
}
