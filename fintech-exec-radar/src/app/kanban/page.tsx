"use client";

import { useStore, OpportunityStatus, Opportunity } from "@/store/useStore";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { parseEmailContext } from "@/actions/parseEmailContext";
import { toast } from "sonner";
import { ArrowLeft, Mail, Loader2, GripVertical, Check } from "lucide-react";
import Link from "next/link";

const COLUMNS: OpportunityStatus[] = ['Discovered', 'Shortlisted', 'Applied', 'Interviewing', 'Offer'];

// --- Drag & Drop Interfaces ---
interface DragItem {
  type: 'OPPORTUNITY';
  id: string;
}

// --- Component: Draggable Card ---
const KanbanCard = ({ opp }: { opp: Opportunity }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'OPPORTUNITY',
    item: { id: opp.id, type: 'OPPORTUNITY' },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag as unknown as React.LegacyRef<HTMLDivElement>}
      className={`bg-zinc-900 border border-zinc-800 p-3 rounded-md shadow-sm mb-2 cursor-grab active:cursor-grabbing hover:border-zinc-700 transition-colors ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 overflow-hidden">
           <h4 className="text-xs font-semibold text-zinc-100 truncate">{opp.title}</h4>
           <p className="text-[10px] text-zinc-500 truncate">{opp.company}</p>
        </div>
        <GripVertical className="w-3 h-3 text-zinc-600 mt-1 shrink-0" />
      </div>
      <div className="flex justify-between items-end mt-2">
         <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 rounded-sm border ${
            opp.matchScore >= 85 ? 'text-emerald-400 border-emerald-900 bg-emerald-950/30' :
            opp.matchScore >= 70 ? 'text-amber-400 border-amber-900 bg-amber-950/30' :
            'text-red-400 border-red-900 bg-red-950/30'
          }`}>
            {opp.matchScore}%
        </Badge>
        <span className="text-[9px] text-zinc-600 font-mono">{opp.location}</span>
      </div>
    </div>
  );
};

// --- Component: Drop Column ---
const KanbanColumn = ({ status, opps }: { status: OpportunityStatus, opps: Opportunity[] }) => {
  const updateOpportunityStatus = useStore((state) => state.updateOpportunityStatus);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'OPPORTUNITY',
    drop: (item: DragItem) => updateOpportunityStatus(item.id, status),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop as unknown as React.LegacyRef<HTMLDivElement>}
      className={`flex-1 flex flex-col bg-zinc-950/50 border-r border-zinc-800/50 min-h-0 ${isOver ? 'bg-zinc-900/40' : ''}`}
    >
      <div className="h-10 px-3 flex items-center justify-between border-b border-zinc-800/50 shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{status}</span>
        <Badge variant="secondary" className="text-[10px] h-5 bg-zinc-800 text-zinc-400">{opps.length}</Badge>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {opps.map(opp => <KanbanCard key={opp.id} opp={opp} />)}
      </div>
    </div>
  );
};

// --- Main Page ---
export default function KanbanPage() {
  const opportunities = useStore((state) => state.opportunities);
  const apiKey = useStore((state) => state.apiKey) || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";

  const [emailText, setEmailText] = useState("");
  const [isParsingEmail, setIsParsingEmail] = useState(false);
  const [parsedEmailResult, setParsedEmailResult] = useState<{intent: string, draftResponse: string, suggestedStatus: string, company: string} | null>(null);

  const handleEmailParse = async () => {
    if (!emailText.trim()) return;
    if (!apiKey) {
      toast.error("Google API Key missing.");
      return;
    }

    setIsParsingEmail(true);
    try {
      const result = await parseEmailContext(emailText, apiKey);
      setParsedEmailResult({
          intent: result.intent,
          draftResponse: result.draftResponse,
          suggestedStatus: result.suggestedStatus,
          company: result.extractedCompany
      });
      toast.success(`Classified as: ${result.intent}`);
    } catch (e: any) {
      toast.error(`Email parse failed: ${e.message}`);
    } finally {
      setIsParsingEmail(false);
    }
  };

  const copyDraft = () => {
      if(parsedEmailResult) {
          navigator.clipboard.writeText(parsedEmailResult.draftResponse);
          toast.success("Response draft copied to clipboard!");
      }
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden">

        {/* Header */}
        <div className="h-14 border-b border-zinc-800 bg-zinc-900/50 flex items-center px-4 justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-zinc-400 hover:text-zinc-100 transition-colors p-1">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="font-semibold text-sm">Pipeline Kanban Tracker</h1>
          </div>
        </div>

        {/* Board & Email Parser Split */}
        <div className="flex-1 flex overflow-hidden">

          {/* Kanban Board */}
          <div className="flex-1 flex overflow-x-auto">
             {COLUMNS.map(col => (
               <KanbanColumn
                 key={col}
                 status={col}
                 opps={opportunities.filter(o => o.status === col)}
               />
             ))}
          </div>

          {/* Email Automation Drop-Zone Sidebar */}
          <div className="w-80 border-l border-zinc-800 bg-zinc-950 flex flex-col">
             <div className="h-10 px-4 flex items-center border-b border-zinc-800 shrink-0">
                 <Mail className="w-3.5 h-3.5 text-indigo-400 mr-2" />
                 <span className="text-xs font-semibold text-zinc-300">Pipeline Automation</span>
             </div>
             <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
                <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold mb-2 block">Recruiter Comm Drop-Zone</span>
                    <Textarea
                        value={emailText}
                        onChange={e => setEmailText(e.target.value)}
                        placeholder="Paste recruiter email or system message here to automate tracking and draft response..."
                        className="bg-zinc-900 border-zinc-800 text-xs min-h-[150px] resize-y"
                    />
                    <Button
                        onClick={handleEmailParse}
                        disabled={isParsingEmail || !emailText}
                        className="w-full mt-2 h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
                    >
                        {isParsingEmail ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                        Analyze Context
                    </Button>
                </div>

                {parsedEmailResult && (
                    <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-md space-y-3">
                        <div>
                            <span className="text-[10px] text-zinc-500 block">Intent</span>
                            <span className="text-xs text-indigo-400 font-semibold">{parsedEmailResult.intent}</span>
                        </div>
                        <div>
                            <span className="text-[10px] text-zinc-500 block">Identified Target</span>
                            <span className="text-xs text-zinc-300">{parsedEmailResult.company}</span>
                        </div>
                        <div>
                            <span className="text-[10px] text-zinc-500 block">Suggested State Shift</span>
                            <Badge variant="outline" className="mt-1 text-[10px] border-zinc-700 text-zinc-300">{parsedEmailResult.suggestedStatus}</Badge>
                        </div>
                        <div className="pt-2 border-t border-zinc-800">
                            <span className="text-[10px] text-emerald-400 font-semibold block mb-1">Draft Response</span>
                            <div className="text-xs text-zinc-400 font-mono bg-zinc-950 p-2 rounded border border-zinc-800 max-h-40 overflow-y-auto">
                                {parsedEmailResult.draftResponse}
                            </div>
                            <Button onClick={copyDraft} variant="secondary" size="sm" className="w-full mt-2 h-7 text-[10px]">
                                <Check className="w-3 h-3 mr-1" /> Copy Draft
                            </Button>
                        </div>
                    </div>
                )}
             </div>
          </div>

        </div>
      </div>
    </DndProvider>
  );
}
