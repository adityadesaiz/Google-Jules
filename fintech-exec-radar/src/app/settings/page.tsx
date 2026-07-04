"use client";

import { useStore } from "@/store/useStore";
import { useState, useEffect } from "react";
import { ArrowLeft, Key, Save } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  const apiKey = useStore((state) => state.apiKey);
  const setApiKey = useStore((state) => state.setApiKey);

  const [localKey, setLocalKey] = useState("");

  useEffect(() => {
    setLocalKey(apiKey);
  }, [apiKey]);

  const handleSave = () => {
    setApiKey(localKey);
    toast.success("Settings saved locally.");
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6 flex justify-center">
      <div className="max-w-2xl w-full space-y-6 mt-10">

        <Link href="/" className="inline-flex items-center text-xs text-zinc-400 hover:text-zinc-100 mb-4 transition-colors">
          <ArrowLeft className="w-3 h-3 mr-2" />
          Back to Radar
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Workspace Settings</h1>
          <p className="text-sm text-zinc-500 mt-1">Configure your private agentic integrations.</p>
        </div>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-400" />
              Google Gemini API Key
            </CardTitle>
            <CardDescription className="text-xs">
              Required for semantic JD matching and email pipeline automation. If NEXT_PUBLIC_GOOGLE_API_KEY is present in your environment, it will be used as a fallback. Keys provided here are stored only in your local browser storage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <Input
                type="password"
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value)}
                placeholder="AIzaSy..."
                className="bg-zinc-950 border-zinc-800 font-mono text-sm"
             />
             <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-xs">
                 <Save className="w-3 h-3 mr-2" />
                 Save to LocalStorage
             </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
