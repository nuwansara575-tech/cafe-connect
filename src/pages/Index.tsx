import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { QrCode, Shield, BarChart3, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background — curved arc lines like Specter */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large curved arcs */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 900" fill="none" preserveAspectRatio="xMidYMid slice">
          {/* Outer arc */}
          <ellipse cx="720" cy="450" rx="600" ry="380" stroke="hsl(var(--border))" strokeWidth="1" fill="none" opacity="0.5" />
          {/* Middle arc */}
          <ellipse cx="720" cy="450" rx="440" ry="280" stroke="hsl(var(--border))" strokeWidth="1" fill="none" opacity="0.4" />
          {/* Inner arc */}
          <ellipse cx="720" cy="450" rx="280" ry="180" stroke="hsl(var(--border))" strokeWidth="1" fill="none" opacity="0.3" />
          {/* Vertical line accent */}
          <line x1="720" y1="60" x2="720" y2="840" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.2" />
          {/* Horizontal line accent */}
          <line x1="120" y1="450" x2="1320" y2="450" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.2" />
        </svg>

        {/* Soft ambient glow */}
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-50 w-full px-6 md:px-12 py-5 flex items-center justify-between">
        <img
          alt="Cafe Connect"
          className="h-14 object-contain"
          src="/lovable-uploads/0408a127-79d5-40ae-b9e5-d86af37c1714.png"
        />
        <Link to="/login">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full px-6 border-border text-foreground hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground transition-colors"
          >
            Admin Login
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-6 py-12 md:py-20">
        {/* Stacked notification cards — centered above headline */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative z-10 mb-10 w-full max-w-[340px] h-[160px]"
        >
          {/* Card 3 — back */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[280px]"
          >
            <div className="glass-subtle rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground leading-tight">Live Analytics</p>
                <p className="text-xs text-muted-foreground">Real-time tracking</p>
              </div>
              <span className="ml-auto text-[10px] text-muted-foreground">1m</span>
            </div>
          </motion.div>

          {/* Card 2 — middle */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="absolute top-[42px] left-1/2 -translate-x-[46%] w-[300px]"
          >
            <div className="glass-strong rounded-xl px-4 py-3 flex items-center gap-3 shadow-md">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">Server Validated</p>
                <p className="text-xs text-muted-foreground">Verified server-side</p>
              </div>
              <span className="ml-auto text-[10px] text-muted-foreground">1m</span>
            </div>
          </motion.div>

          {/* Card 1 — front */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="absolute top-[88px] left-1/2 -translate-x-[42%] w-[320px]"
          >
            <div className="glass-strong rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-lg border border-border/60">
              <div className="w-8 h-8 rounded-lg gradient-cafe flex items-center justify-center shrink-0">
                <QrCode className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">Single-Use QR</p>
                <p className="text-xs text-muted-foreground">Each code works only once</p>
              </div>
              <span className="ml-auto text-[10px] text-muted-foreground/80 bg-primary/10 px-1.5 py-0.5 rounded text-primary font-medium">now</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Center content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative z-10 max-w-3xl text-center"
        >
          <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground mb-6 leading-[1.1] tracking-tight">
            Promote your café.{" "}
            <span className="text-gradient-cafe">Effortlessly.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            Create single-use QR coupons, run loyalty programs,
            and track every redemption — all from one dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/admin">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all px-8 h-12 text-sm font-medium rounded-full shadow-sm"
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative py-6 text-center">
        <p className="text-xs text-muted-foreground">Powered by ZIP Solutions</p>
      </footer>
    </div>
  );
};

export default Index;
