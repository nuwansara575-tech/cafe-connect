import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { QrCode, Shield, BarChart3, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Animated blobs */}
        <motion.div
          animate={{ x: [0, 30, -20, 0], y: [0, -20, 15, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -right-32 w-[550px] h-[550px] rounded-full bg-primary/10 blur-[100px]"
        />
        <motion.div
          animate={{ x: [0, -25, 20, 0], y: [0, 25, -15, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 -left-32 w-[450px] h-[450px] rounded-full bg-primary/6 blur-[90px]"
        />
        <motion.div
          animate={{ x: [0, 15, -10, 0], y: [0, -30, 10, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[350px] h-[350px] rounded-full bg-primary/4 blur-[80px]"
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Header - Glass */}
      <header className="glass-subtle sticky top-0 z-50 w-full px-6 md:px-12 py-4 flex items-center justify-between">
        <img
          alt="Cafe Connect"
          className="h-14 object-contain"
          src="/lovable-uploads/0408a127-79d5-40ae-b9e5-d86af37c1714.png"
        />
        <Link to="/login">
          <Button variant="outline" size="sm" className="rounded-full px-5 glass border-border/50 hover:bg-card/60">
            Admin Login
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-6 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl text-center"
        >
          {/* Badge - Glass */}
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
            QR Code{" "}
            <span className="text-gradient-cafe">Promotion</span>
            <br />
            System
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            Create single-use QR coupons for your café. Generate, distribute, and track promotions — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/admin">
              <Button
                size="lg"
                className="gradient-cafe text-primary-foreground shadow-cafe hover:shadow-cafe-lg transition-all px-8 h-12 text-base font-semibold rounded-full"
              >
                <QrCode className="w-5 h-5 mr-2" />
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Features - Glass Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-24 max-w-4xl w-full"
        >
          {[
            {
              icon: QrCode,
              title: "Single-Use QR",
              desc: "Each code works only once — no duplicates, no screenshots.",
            },
            {
              icon: Shield,
              title: "Server Validated",
              desc: "Redemption verified server-side for maximum security.",
            },
            {
              icon: BarChart3,
              title: "Live Analytics",
              desc: "Track scans, redemptions, and conversion rates in real time.",
            },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
              className="group glass-strong rounded-2xl p-6 text-left hover:shadow-cafe hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl gradient-cafe flex items-center justify-center mb-4 group-hover:shadow-cafe transition-shadow duration-300">
                <f.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2 text-lg">
                {f.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
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
