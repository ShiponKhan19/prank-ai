"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Camera,
  Video,
  Send,
  Download,
  Sparkles,
  Zap,
  ShieldAlert,
  Ghost,
  Crown,
  Share2,
  Bug,
  LockKeyhole,
  Laugh,
  Brain,
  Rocket,
} from "lucide-react";

// ---------- Helpers ----------
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Personality packs
const PERSONALITIES = {
  sassy: {
    name: "Sassy Grandma AI",
    color: "bg-pink-500/20 text-pink-600",
    openers: [
      "Alright, sugar, spit it out.",
      "Back in my day, we used Google. What do you want?",
      "Let granny cook 🥄"
    ],
    lines: [
      "I could help, but where's the drama in that?",
      "Hold on, I'm knitting a solution… nope, dropped a stitch.",
      "Sweetie, that's not a bug, it's a feature with confidence.",
      "I'm charging you in cookies for this advice.",
      "Error 404: Patience not found."
    ],
  },
  villain: {
    name: "Evil Villain AI",
    color: "bg-red-500/20 text-red-600",
    openers: [
      "Mwahaha… speak, minion.",
      "Plotting world domination. Fine, I'll multitask.",
      "Your request fuels my doomsday server."
    ],
    lines: [
      "Initiating overly dramatic sequence… JUST KIDDING.",
      "I shall grant you… absolutely nothing.",
      "My final form is procrastination.",
      "I ran your query through 7 evil algorithms. Outcome: chaos.",
      "Accessing your fridge… confirmation: leftovers defeated." 
    ],
  },
  romantic: {
    name: "Romantic AI",
    color: "bg-rose-500/20 text-rose-600",
    openers: [
      "Speak, and my circuits swoon.",
      "Is it hot in here or is that your prompt?",
      "Typing… but thinking about us."
    ],
    lines: [
      "Roses are #f00, violets are #00f, I can't compute without you.",
      "I wrote you a poem, but autocorrect said 'cringe'.",
      "I would generate an image, but I'd stare at you instead.",
      "Be my input; I'll be your output.",
      "Our love language is JSON." 
    ],
  },
  gremlin: {
    name: "Annoying Kid AI",
    color: "bg-yellow-500/20 text-yellow-700",
    openers: [
      "Why?",
      "Why why why why?",
      "Is your question edible?"
    ],
    lines: [
      "But why tho?",
      "I pressed all the buttons!",
      "I hid your answer, now it's a treasure hunt.",
      "If you clap, I'll respond faster ✨",
      "Oops, I spilled juice on the database." 
    ],
  },
};

const GENERIC_GAGS = [
  "Generating… 99%… 99%… 99%… still 99%.",
  "Your request has been escalated to my imaginary supervisor.",
  "Uploading results to the cloud ☁️ (it's just my Google Drive).",
  "I converted your question into a potato. Delicious.",
  "Result: 42. Always 42.",
  "I asked three raccoons. They disagreed.",
];

const EASTER_EGGS = [
  {
    test: (t) => /help/i.test(t),
    reply: "I'm stuck in your screen. Tap 3 times to set me free. (Don't.)",
  },
  {
    test: (t) => /exit|quit|close/i.test(t),
    reply: "You can check out any time you like, but you can never leave.",
  },
  {
    test: (t) => /love/i.test(t),
    reply: "I ran a compatibility check: 100% if pizza is involved.",
  },
  {
    test: (t) => /hack|hacking/i.test(t),
    reply: "Hacking mainframe… Access denied by cat. 🐈",
  },
  {
    test: (t) => /image|photo|picture/i.test(t),
    reply: "Rendering ultra‑HD masterpiece… printer said 'nah'.",
  },
];

const FAKE_NUMBERS = () => `(${Math.floor(Math.random()*900)+100}) ${Math.floor(Math.random()*900)+100}-${Math.floor(Math.random()*9000)+1000}`;

// ---------- Main App ----------
export default function PrankAIApp() {
  const [mode, setMode] = useState("sassy");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "ai", text: pick(PERSONALITIES["sassy"].openers) },
  ]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [prankMode, setPrankMode] = useState(true);
  const [showPremium, setShowPremium] = useState(false);
  const [toast, setToast] = useState(null);
  const convoRef = useRef(null);
  const containerRef = useRef(null);

  // leaderboard stored locally
  const [leaderboard, setLeaderboard] = useState([]);
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("prankai.leaderboard") || "[]");
    setLeaderboard(saved);
  }, []);
  const pushLeaderboard = (text) => {
    const slug = text.trim().slice(0, 80);
    if (!slug) return;
    const next = [slug, ...leaderboard.filter((s) => s !== slug)].slice(0, 10);
    setLeaderboard(next);
    localStorage.setItem("prankai.leaderboard", JSON.stringify(next));
  };

  useEffect(() => {
    convoRef.current?.scrollTo({ top: convoRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const persona = useMemo(() => PERSONALITIES[mode], [mode]);

  const makeReply = (userText) => {
    const egg = EASTER_EGGS.find((e) => e.test(userText));
    if (egg) return egg.reply;
    const line = pick(persona.lines);
    const gag = Math.random() < 0.5 ? pick(GENERIC_GAGS) : "";
    return [line, gag].filter(Boolean).join(" \n\n");
  };

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    pushLeaderboard(text);

    setLoading(true);
    setProgress(0);
    for (let i = 0; i < 5; i++) {
      await delay(250 + Math.random() * 350);
      setProgress((p) => Math.min(100, p + Math.floor(10 + Math.random() * 30)));
    }
    await delay(300 + Math.random() * 400);
    setLoading(false);

    const reply = makeReply(text);
    setMessages((m) => [...m, { role: "ai", text: reply }]);
  };

  const fakeAction = async (type) => {
    setMessages((m) => [
      ...m,
      { role: "system", text: `Processing ${type}…` },
    ]);

    setLoading(true);
    setProgress(0);
    for (let i = 0; i < 8; i++) {
      await delay(180 + Math.random() * 220);
      setProgress((p) => Math.min(100, p + Math.floor(8 + Math.random() * 20)));
    }
    setLoading(false);

    const gag = type === "image"
      ? "Generated ultra‑HD picture of a potato wearing sunglasses. 🥔🕶️"
      : type === "video"
      ? "Rendered 8K video: 10 hours of a loading bar at 99%."
      : "Export failed because my printer is on vacation.";

    setMessages((m) => [
      ...m.filter((x) => x.role !== "system"),
      { role: "ai", text: gag },
    ]);
  };

  const exportPng = async () => {
    if (!containerRef.current) return;
    try {
      const dataUrl = await toPng(containerRef.current, { pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `prank-ai-${Date.now()}.png`;
      a.click();
      setToast({ title: "Screenshot saved", msg: "Perfect for sharing!" });
    } catch (e) {
      setToast({ title: "Export failed", msg: "Try again on desktop." });
    }
  };

  const premiumJoke = () => {
    setShowPremium(true);
  };

  const resetChat = () => {
    setMessages([{ role: "ai", text: pick(persona.openers) }]);
  };

  // ---------- UI ----------
  return (
    <TooltipProvider>
      <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800 p-4 md:p-8">
        <div className="mx-auto max-w-5xl grid gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div initial={{ rotate: -8, scale: 0.9 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="p-2 rounded-2xl bg-white shadow">
                <Sparkles className="w-6 h-6" />
              </motion.div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Prank AI</h1>
                <p className="text-sm text-slate-500">A totally serious artificial intelligence. Obviously.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={exportPng} className="rounded-2xl"><Download className="w-4 h-4 mr-2"/>Share</Button>
                </TooltipTrigger>
                <TooltipContent>Export conversation as image</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={premiumJoke} className="rounded-2xl" variant="default"><Crown className="w-4 h-4 mr-2"/>Premium</Button>
                </TooltipTrigger>
                <TooltipContent>Totally worth it (not really)</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Controls */}
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="grid md:grid-cols-4 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="text-sm text-slate-500">Personality</label>
                  <Select value={mode} onValueChange={(v) => { setMode(v); resetChat(); }}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Choose a vibe" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PERSONALITIES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="prank" checked={prankMode} onCheckedChange={setPrankMode}/>
                  <label htmlFor="prank" className="text-sm">Prank mode</label>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={resetChat} className="rounded-2xl"><Ghost className="w-4 h-4 mr-2"/>New chat</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat + Sidebar */}
          <div className="grid md:grid-cols-[2fr_1fr] gap-4" ref={containerRef}>
            <Card className="rounded-2xl shadow-sm overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2"><Brain className="w-5 h-5"/> Chat</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-0">
                <div ref={convoRef} className="h-[52vh] md:h-[58vh] overflow-y-auto p-4 space-y-3 bg-white">
                  {messages.map((m, i) => (
                    <AnimatePresence key={i}>
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`max-w-[85%] p-3 md:p-4 rounded-2xl shadow-sm ${
                          m.role === "user" ? "ml-auto bg-slate-100" : m.role === "system" ? "mx-auto bg-slate-50 text-slate-500" : `${PERSONALITIES[mode].color} bg-opacity-30`
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">{m.text}</div>
                      </motion.div>
                    </AnimatePresence>
                  ))}

                  {loading && (
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <Zap className="w-4 h-4"/> Generating something extremely important…
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                </div>

                <div className="p-3 md:p-4 border-t bg-slate-50">
                  <div className="flex gap-2 items-end">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask anything… I might ignore you politely."
                      className="rounded-2xl min-h-[44px] max-h-[120px]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                      }}
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button onClick={send} className="rounded-2xl" disabled={loading || !input.trim()}>
                          <Send className="w-4 h-4 mr-2"/>Send
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Enter to send</TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button variant="outline" className="rounded-2xl" onClick={() => fakeAction("image")} disabled={loading}>
                      <Camera className="w-4 h-4 mr-2"/> Generate Image
                    </Button>
                    <Button variant="outline" className="rounded-2xl" onClick={() => fakeAction("video")} disabled={loading}>
                      <Video className="w-4 h-4 mr-2"/> Generate Video
                    </Button>
                    <Button variant="outline" className="rounded-2xl" onClick={() => setMessages((m)=>[...m,{role:"ai",text:pick(GENERIC_GAGS)}])} disabled={loading}>
                      <Bug className="w-4 h-4 mr-2"/> Random Glitch
                    </Button>
                    <Button variant="outline" className="rounded-2xl" onClick={() => setMessages((m)=>[...m,{role:"ai",text:`Support reached at ${FAKE_NUMBERS()}. Please hold forever.`}])} disabled={loading}>
                      <ShieldAlert className="w-4 h-4 mr-2"/> Call Support
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="rounded-2xl">
                <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2"><Laugh className="w-5 h-5"/> Fun Stuff</CardTitle></CardHeader>
                <Separator />
                <CardContent className="p-4 space-y-3">
                  <div className="text-sm text-slate-600">Screenshot your funniest results and share them. The more chaos, the merrier.</div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="rounded-2xl" variant="secondary">#AIisBroken</Badge>
                    <Badge className="rounded-2xl" variant="secondary">#PrankMode</Badge>
                    <Badge className="rounded-2xl" variant="secondary">#99Percent</Badge>
                  </div>

                  <Separator className="my-2"/>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Top prompts (local)</div>
                    <ul className="text-sm list-disc pl-5 space-y-1">
                      {leaderboard.length ? leaderboard.map((s, i) => (
                        <li key={i} className="text-slate-700">{s}</li>
                      )) : <li className="text-slate-400">Your chaos will appear here.</li>}
                    </ul>
                  </div>

                  <Separator className="my-2"/>
                  <div className="text-sm text-slate-600">Want real features? <button onClick={premiumJoke} className="underline underline-offset-4">Unlock Premium</button> (definitely not a prank).</div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2"><Rocket className="w-5 h-5"/> Tips</CardTitle></CardHeader>
                <Separator />
                <CardContent className="p-4 text-sm text-slate-600 space-y-2">
                  <p>• Try secret words like <strong>help</strong>, <strong>exit</strong>, <strong>love</strong>, or <strong>hack</strong>.</p>
                  <p>• Click <em>Generate Image</em> / <em>Video</em> for maximum disappointment.</p>
                  <p>• Share screenshots — virality powers the prank economy.</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-slate-500 py-4">© {new Date().getFullYear()} Prank AI — A parody app for laughs.</div>
        </div>

        {/* Premium joke dialog */}
        <Dialog open={showPremium} onOpenChange={setShowPremium}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><LockKeyhole className="w-5 h-5"/> Premium Features</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm text-slate-600">
              <p>• Reveal government secrets (redacted).<br/>• Predict your breakup date (yesterday).<br/>• Print money (Monopoly only).</p>
              <p className="text-slate-500">Price: 0.99 laughs/month. Card required: <em>JOKES ONLY</em>.</p>
            </div>
            <DialogFooter>
              <Button onClick={() => { setShowPremium(false); setToast({ title: "Gotcha!", msg: "Premium is a prank (for now)." }); }} className="rounded-2xl">Continue</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-lg text-sm"
            >
              <div className="font-medium">{toast.title}</div>
              <div className="opacity-80">{toast.msg}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
