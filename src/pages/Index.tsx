import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Coffee, QrCode, Shield, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoWhite from "@/assets/logo-white.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-border">
        <img alt="Cafe Connect" className="h-16 object-contain" src="/lovable-uploads/0408a127-79d5-40ae-b9e5-d86af37c1714.png" />
        <Link to="/login">
          <Button variant="outline" size="sm">Admin Login</Button>
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl">

          <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-6 leading-tight">
            QR Code <span className="text-gradient-cafe">Promotion</span> System
          </h1>

          <p className="text-lg text-muted-foreground mb-10 max-w-lg mx-auto">
            Create single-use QR coupons for your café. Generate, distribute, and track promotions with ease.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/admin">
              <Button size="lg" className="gradient-cafe text-primary-foreground shadow-cafe hover:shadow-cafe-lg transition-shadow px-8">
                <QrCode className="w-5 h-5 mr-2" />
                Generate QR Codes
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl w-full">

          {[
          { icon: QrCode, title: "Single-Use QR", desc: "Each code works only once — no duplicates, no screenshots" },
          { icon: Shield, title: "Server Validated", desc: "Redemption verified server-side for maximum security" },
          { icon: BarChart3, title: "Live Analytics", desc: "Track scans, redemptions, and conversion rates in real time" }].
          map((f, i) =>
          <div key={i} className="rounded-xl border border-border bg-card p-6 text-left hover:shadow-cafe transition-shadow">
              <div className="w-10 h-10 rounded-lg gradient-cafe flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          )}
        </motion.div>
      </main>
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-xs text-muted-foreground">Powered by ZIP Solutions</p>
      </div>
    </div>);
};

export default Index;
