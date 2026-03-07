import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { QrCode, Shield, BarChart3, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const floatingCards = [
  {
    icon: QrCode,
    title: "Single-Use QR",
    desc: "Each code works only once",
    delay: 0.6,
    position: "top-[18%] left-[8%] md:left-[12%]",
    rotate: "-3deg",
  },
  {
    icon: Shield,
    title: "Server Validated",
    desc: "Verified server-side",
    delay: 0.9,
    position: "top-[10%] right-[8%] md:right-[12%]",
    rotate: "2deg",
  },
  {
    icon: BarChart3,
    title: "Live Analytics",
    desc: "Real-time tracking",
    delay: 1.2,
    position: "top-[32%] right-[4%] md:right-[18%]",
    rotate: "-1deg",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background — soft radial rings inspired by reference */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Central ring glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-primary/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full border border-primary/8" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-primary/6" />

        {/* Soft ambient blobs */}
        <motion.div
          animate={{ x: [0, 30, -20, 0], y: [0, -20, 15, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-primary/8 blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -25, 20, 0], y: [0, 25, -15, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[10%] left-[10%] w-[350px] h-[350px] rounded-full bg-primary/5 blur-[100px]"
        />

        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
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
        {/* Floating feature cards */}
        <div className="absolute inset-0 hidden md:block pointer-events-none">
          {floatingCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: card.delay, ease: "easeOut" }}
              className={`absolute ${card.position}`}
              style={{ transform: `rotate(${card.rotate})` }}
            >
              <div className="glass-strong rounded-2xl px-5 py-4 flex items-center gap-3 shadow-cafe min-w-[200px]">
                <div className="w-9 h-9 rounded-xl gradient-cafe flex items-center justify-center shrink-0">
                  <card.icon className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">{card.title}</p>
                  <p className="text-xs text-muted-foreground">{card.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Center content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 max-w-3xl text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-subtle inline-flex items-center gap-2 rounded-full px-5 py-2 mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Smart QR Coupon Platform</span>
          </motion.div>

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
                className="gradient-cafe text-primary-foreground shadow-cafe hover:shadow-cafe transition-all px-8 h-11 text-sm font-medium rounded-full"
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Mobile feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="grid grid-cols-1 gap-4 mt-16 w-full max-w-sm md:hidden"
        >
          {floatingCards.map((card, i) => (
            <div key={i} className="glass-strong rounded-2xl px-5 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl gradient-cafe flex items-center justify-center shrink-0">
                <card.icon className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">{card.title}</p>
                <p className="text-xs text-muted-foreground">{card.desc}</p>
              </div>
            </div>
          ))}
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
