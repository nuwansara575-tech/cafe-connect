import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { QrCode, Shield, BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background — animated concentric arcs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Animated rotating arcs */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        >
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 900" fill="none" preserveAspectRatio="xMidYMid slice">
            <ellipse cx="720" cy="450" rx="650" ry="400" stroke="hsl(var(--primary) / 0.08)" strokeWidth="1" fill="none" />
            <ellipse cx="720" cy="450" rx="500" ry="310" stroke="hsl(var(--primary) / 0.06)" strokeWidth="1" fill="none" />
            <ellipse cx="720" cy="450" rx="350" ry="220" stroke="hsl(var(--primary) / 0.05)" strokeWidth="1" fill="none" />
          </svg>
        </motion.div>

        {/* Counter-rotating smaller arcs */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: -360 }}
          transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
        >
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 900" fill="none" preserveAspectRatio="xMidYMid slice">
            <ellipse cx="720" cy="450" rx="580" ry="360" stroke="hsl(var(--border))" strokeWidth="0.5" fill="none" opacity="0.3" />
            <ellipse cx="720" cy="450" rx="420" ry="260" stroke="hsl(var(--border))" strokeWidth="0.5" fill="none" opacity="0.2" />
          </svg>
        </motion.div>

        {/* Static cross lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 900" fill="none" preserveAspectRatio="xMidYMid slice">
          <line x1="720" y1="40" x2="720" y2="860" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.15" />
          <line x1="100" y1="450" x2="1340" y2="450" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.15" />
        </svg>

        {/* Warm ambient glow */}
        <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-primary/4 blur-[140px]" />

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/20"
            style={{
              left: `${20 + i * 12}%`,
              top: `${30 + (i % 3) * 15}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "easeInOut",
            }}
          />
        ))}
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
      <main className="relative flex-1 flex flex-col items-center justify-center px-6 py-8 md:py-16">
        {/* Stacked notification cards */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative z-10 mb-12 w-[380px] h-[140px]"
        >
          {/* Card 3 — back (Live Analytics) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="absolute top-0 left-0 w-[320px]"
          >
            <div className="bg-card/50 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-3 border border-border/20">
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

          {/* Card 2 — middle (Server Validated) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="absolute top-[36px] left-[20px] w-[340px]"
          >
            <div className="bg-card/80 backdrop-blur-md rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm border border-border/30">
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

          {/* Card 1 — front (Single-Use QR) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="absolute top-[72px] left-[40px] w-[340px]"
          >
            <div className="bg-card backdrop-blur-xl rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-lg border border-border/50">
              <div className="w-8 h-8 rounded-lg gradient-cafe flex items-center justify-center shrink-0">
                <QrCode className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">Single-Use QR</p>
                <p className="text-xs text-muted-foreground">Each code works only once</p>
              </div>
              <span className="ml-auto text-[10px] bg-primary/10 px-1.5 py-0.5 rounded text-primary font-medium">now</span>
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
