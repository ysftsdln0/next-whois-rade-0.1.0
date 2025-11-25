import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Home, Loader2, RefreshCw, CheckCircle2, AlertCircle, Activity } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type TestResponse = {
  status: string;
  logs: string[];
  message?: string;
};

export default function TestProvidersPage() {
  const [data, setData] = useState<TestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/test");
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // runTest(); // Disable auto-run on mount to prevent potential loops or double-fetching in strict mode
  }, []);

  return (
    <ScrollArea className="w-full h-full bg-background">
      <main className="relative w-full min-h-screen flex flex-col items-center px-4 pt-24 pb-6">
        <Link href="/" className="absolute top-6 left-6 md:top-10 md:left-10">
          <Button variant="outline" size="icon">
            <Home className="w-4 h-4" />
          </Button>
        </Link>

        <div className="w-full max-w-[600px] space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              Provider System Test
            </h1>
            <p className="text-muted-foreground">
              Verify rotation, rate limiting, and fallback mechanisms.
            </p>
          </div>

          <div className="flex justify-center">
            <Button 
              onClick={runTest} 
              disabled={loading}
              className="w-full sm:w-auto min-w-[200px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Rerun Tests
                </>
              )}
            </Button>
          </div>

          {error && (
            <Card className="border-destructive/50 bg-destructive/10">
              <CardContent className="pt-6 flex items-center gap-3 text-destructive">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">{error}</p>
              </CardContent>
            </Card>
          )}

          {data && (
            <Card className="shadow-lg border-primary/20">
              <CardHeader className="border-b bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    Test Results
                  </CardTitle>
                  <Badge 
                    variant={data.status === "success" ? "default" : "destructive"}
                    className={cn(
                      "uppercase tracking-wider",
                      data.status === "success" ? "bg-green-500 hover:bg-green-600" : ""
                    )}
                  >
                    {data.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {data.logs.map((log, index) => {
                    const isHeader = log.startsWith("\n---");
                    const isError = log.toLowerCase().includes("fail") || log.toLowerCase().includes("error");
                    
                    if (isHeader) {
                      return (
                        <div key={index} className="bg-muted/50 px-6 py-3 font-semibold text-sm text-primary">
                          {log.replace("\n", "")}
                        </div>
                      );
                    }

                    return (
                      <div key={index} className="px-6 py-3 text-sm font-mono flex items-start gap-3 hover:bg-muted/20 transition-colors">
                        {isError ? (
                          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        )}
                        <span className={cn(isError ? "text-red-600 dark:text-red-400" : "text-foreground/80")}>
                          {log}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </ScrollArea>
  );
}
