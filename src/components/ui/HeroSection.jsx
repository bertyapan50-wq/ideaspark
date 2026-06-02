import { Sparkles, Zap, Target } from "lucide-react";

export default function HeroSection() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      
      <div className="relative max-w-3xl mx-auto text-center pt-16 pb-8 px-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Zap className="h-3.5 w-3.5" />
          AI-Powered Idea Discovery
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
          Your next{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            billion-dollar
          </span>{" "}
          idea starts here
        </h1>
        <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Tell us your niche. Our AI analyzes real pain points and generates validated SaaS ideas — complete with pricing, tech stack, and timeline.
        </p>
        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Target className="h-4 w-4 text-primary" />
            Real problems
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-accent" />
            Validated ideas
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-primary" />
            Instant results
          </div>
        </div>
      </div>
    </div>
  );
}