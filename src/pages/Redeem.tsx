import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ccLogoWhite from "@/assets/cc-logo-white.png";
import giftBox from "@/assets/gift-box.png";
import openBox from "@/assets/open-box.png";
import checkImg from "@/assets/check.png";

// Cafe emoji burst elements
const CAFE_EMOJIS = ["☕", "🫘", "🍩", "🧁", "🍪", "☕", "🫘", "☕"];

const EmojiParticle = ({ delay, x, y, emoji, size }: { delay: number; x: number; y: number; emoji: string; size: number }) => (
  <motion.div
    className="absolute pointer-events-none select-none"
    style={{ fontSize: size }}
    initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
    animate={{
      opacity: [0, 1, 1, 0],
      x: x,
      y: y,
      scale: [0, 1.3, 1, 0.6],
      rotate: [0, Math.random() > 0.5 ? 180 : -180],
    }}
    transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
  />
);

const DotParticle = ({ delay, x, y, color, size }: { delay: number; x: number; y: number; color: string; size: number }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{ backgroundColor: color, width: size, height: size }}
    initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
    animate={{
      opacity: [0, 1, 1, 0],
      x: x,
      y: y,
      scale: [0, 1.5, 1, 0],
    }}
    transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
  />
);

// Ring burst effect (like Lovable's expanding ring)
const RingBurst = () => (
  <motion.div
    className="absolute rounded-full border-2 pointer-events-none"
    style={{ borderColor: "hsl(22, 97%, 54%)" }}
    initial={{ width: 0, height: 0, opacity: 0.8 }}
    animate={{ width: 200, height: 200, opacity: 0 }}
    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
  />
);

const CONFETTI_COLORS = [
  "hsl(22, 97%, 54%)",
  "hsl(30, 90%, 50%)",
  "hsl(45, 93%, 58%)",
  "hsl(25, 60%, 40%)",
  "hsl(22, 97%, 70%)",
  "hsl(0, 0%, 100%)",
];

const ConfettiBurst = ({ show }: { show: boolean }) => {
  if (!show) return null;

  const emojis = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * Math.PI * 2;
    const distance = 70 + Math.random() * 60;
    return {
      id: `e-${i}`,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 30,
      delay: 0.05 + Math.random() * 0.15,
      emoji: CAFE_EMOJIS[i % CAFE_EMOJIS.length],
      size: 18 + Math.random() * 10,
    };
  });

  const dots = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2;
    const distance = 40 + Math.random() * 100;
    return {
      id: `d-${i}`,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 10,
      delay: Math.random() * 0.12,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 3 + Math.random() * 5,
    };
  });

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-visible z-50 pointer-events-none">
      <RingBurst />
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{ backgroundColor: "hsl(22, 97%, 54%)" }}
        initial={{ width: 0, height: 0, opacity: 0.3 }}
        animate={{ width: 120, height: 120, opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
      />
      {emojis.map((p) => (
        <EmojiParticle key={p.id} {...p} />
      ))}
      {dots.map((p) => (
        <DotParticle key={p.id} {...p} />
      ))}
    </div>
  );
};

type CouponState = "loading" | "scanned" | "claimed" | "redeemed" | "expired" | "invalid" | "claiming" | "success";

interface CouponData {
  offer_title?: string;
  offer_description?: string;
  discount_value?: string;
  campaign_name?: string;
  coupon_code?: string;
}

const Redeem = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<CouponState>("loading");
  const [data, setData] = useState<CouponData>({});
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);
  const [claimError, setClaimError] = useState("");
  const submitting = useRef(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [buttonPressed, setButtonPressed] = useState(false);

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    validateToken(token);
  }, [token]);

  const validateToken = async (token: string) => {
    try {
      const { data: result, error } = await supabase.functions.invoke("coupons/validate", {
        body: { token },
      });
      if (error || !result) { setState("invalid"); return; }
      setData(result);
      if (result.status === "unused" || result.status === "scanned") {
        setState("scanned");
      } else {
        setState(result.status as CouponState);
      }
    } catch {
      setState("invalid");
    }
  };

  const handleClaim = async () => {
    if (submitting.current || !token) return;
    if (!phone.trim() || phone.trim().length < 7) {
      setClaimError("Please enter a valid phone number");
      return;
    }
    setClaimError("");
    submitting.current = true;
    setState("claiming");
    try {
      const { data: result, error } = await supabase.functions.invoke("coupons/claim", {
        body: { token, phone: phone.trim(), name: name.trim() || undefined },
      });
      if (error || !result?.success) {
        setClaimError(result?.error || "Failed to claim coupon");
        setState("scanned");
        submitting.current = false;
        return;
      }
      setData((prev) => ({ ...prev, coupon_code: result.coupon_code }));
      setShowConfetti(true);
      setState("success");
      setTimeout(() => setShowConfetti(false), 1200);
    } catch {
      setClaimError("Something went wrong. Please try again.");
      setState("scanned");
    }
    submitting.current = false;
  };

  const copyCode = () => {
    if (data.coupon_code) {
      navigator.clipboard.writeText(data.coupon_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const cardTransition = { type: "spring" as const, damping: 28, stiffness: 300 };

  return (
    <div className="min-h-screen gradient-cafe flex flex-col items-center justify-center px-4 py-10 font-[Inter] relative">
      {/* Logo */}
      <img src={ccLogoWhite} alt="Cafe Connect" className="h-14 mb-6" />

      <AnimatePresence mode="wait">
        {/* Loading */}
        {state === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-card rounded-3xl shadow-xl max-w-sm w-full p-8 flex flex-col items-center"
          >
            <div className="w-10 h-10 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-[13px] text-muted-foreground font-medium">Validating your coupon...</p>
          </motion.div>
        )}

        {/* Scanned - Claim Form */}
        {state === "scanned" && (
          <motion.div key="scanned" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={cardTransition}
            className="bg-card rounded-3xl shadow-xl max-w-sm w-full overflow-hidden"
          >
            {/* Top section with gift icon */}
            <div className="flex flex-col items-center pt-6 pb-4 px-6">
              {data.campaign_name && (
                <p className="text-muted-foreground text-[12px] font-medium tracking-wide mb-3 uppercase">
                  {data.campaign_name}
                </p>
              )}
              <motion.img
                src={giftBox}
                alt="Gift"
                className="w-[72px] h-[72px] mb-4"
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.15 }}
              />
              <h2 className="text-[28px] font-extrabold text-primary mb-1 leading-tight">
                {data.discount_value?.includes("%") ? `${data.discount_value} OFF` : data.discount_value}
              </h2>
              <p className="text-[16px] font-semibold text-foreground mb-0.5">{data.offer_title}</p>
              <p className="text-[13px] text-muted-foreground">{data.offer_description}</p>
            </div>

            {/* Divider */}
            <div className="mx-6 border-t border-border" />

            {/* Form */}
            <div className="px-6 pt-5 pb-6">
              <div className="space-y-4 mb-5">
                <div>
                  <Label htmlFor="phone" className="text-[13px] font-medium mb-1.5 text-foreground">
                    Mobile Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="e.g. +94 77 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11 rounded-xl bg-secondary border-border text-[14px] placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="name" className="text-[13px] font-medium mb-1.5 text-foreground">
                    Name <span className="text-muted-foreground text-[11px] font-normal">(Optional)</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g. Sampath"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 rounded-xl bg-secondary border-border text-[14px] placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {claimError && (
                <p className="text-[13px] text-destructive mb-3 text-center font-medium">{claimError}</p>
              )}

              <motion.div className="relative">
                <Button
                  onClick={() => {
                    setButtonPressed(true);
                    handleClaim();
                  }}
                  size="lg"
                  className="w-full gradient-cafe text-primary-foreground text-[16px] py-[14px] rounded-[14px] font-semibold h-auto shadow-cafe relative overflow-hidden group"
                  asChild={false}
                >
                  <motion.span
                    whileTap={{ scale: 0.96 }}
                    className="flex items-center justify-center gap-2 w-full"
                  >
                    <Sparkles className="w-[18px] h-[18px] opacity-80 group-hover:opacity-100 transition-opacity" />
                    Claim Coupon
                  </motion.span>
                  {/* Shimmer sweep */}
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
                </Button>
                <ConfettiBurst show={buttonPressed && showConfetti} />
              </motion.div>
              <p className="text-[11px] text-muted-foreground mt-3 text-center">
                Your coupon code will be sent to your phone
              </p>
            </div>
          </motion.div>
        )}

        {/* Claiming spinner */}
        {state === "claiming" && (
          <motion.div key="claiming" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-card rounded-3xl shadow-xl max-w-sm w-full p-8 flex flex-col items-center"
          >
            <div className="w-10 h-10 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-[13px] text-muted-foreground font-medium">Claiming your coupon...</p>
          </motion.div>
        )}

        {/* Success - Coupon Claimed */}
        {state === "success" && (
          <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={cardTransition}
            className="bg-card rounded-3xl shadow-xl max-w-sm w-full overflow-hidden relative"
          >
            <ConfettiBurst show={showConfetti} />
            <div className="flex flex-col items-center pt-6 pb-5 px-6">
              <motion.img
                src={openBox}
                alt="Coupon Claimed"
                className="w-[80px] h-[80px] mb-4"
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: [0, 1.15, 1], rotate: [-15, 5, 0] }}
                transition={{ type: "spring", delay: 0.15, duration: 0.6 }}
              />
              <h2 className="text-[26px] font-extrabold text-primary mb-2">Coupon Claimed!</h2>
              <p className="text-[13px] text-muted-foreground mb-5">Show this code to the cashier at the counter:</p>

              <div className="border border-border rounded-2xl p-4 flex items-center justify-between w-full mb-5 bg-secondary">
                <span className="text-[18px] font-mono font-bold text-foreground tracking-widest">{data.coupon_code}</span>
                <Button variant="ghost" size="sm" onClick={copyCode} className="hover:bg-primary/10 h-8 w-8 p-0">
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-primary" />}
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed text-center">
                Please take a screenshot of this page and<br />
                present it at the counter to redeem your coupon.
              </p>
              <p className="text-[11px] text-muted-foreground mt-2 font-medium text-center">
                The cashier will verify and redeem this code<br />
                when you visit the cafe.
              </p>
            </div>
          </motion.div>
        )}

        {/* Already Claimed */}
        {state === "claimed" && (
          <motion.div key="claimed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={cardTransition}
            className="bg-card rounded-3xl shadow-xl max-w-sm w-full p-8 flex flex-col items-center text-center"
          >
            <motion.img
              src={checkImg}
              alt="Already Claimed"
              className="w-[72px] h-[72px] mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.15 }}
            />
            <h2 className="text-[26px] font-extrabold text-primary mb-2">Already Claimed</h2>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              This coupon has already been claimed.<br />
              Check your phone for the coupon code.
            </p>
          </motion.div>
        )}

        {/* Already Redeemed */}
        {state === "redeemed" && (
          <motion.div key="redeemed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={cardTransition}
            className="bg-card rounded-3xl shadow-xl max-w-sm w-full p-8 flex flex-col items-center text-center"
          >
            <motion.img
              src={checkImg}
              alt="Redeemed"
              className="w-[72px] h-[72px] mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.15 }}
            />
            <h2 className="text-[26px] font-extrabold text-primary mb-2">Already Redeemed</h2>
            <p className="text-[13px] text-muted-foreground">This coupon has already been used.</p>
          </motion.div>
        )}

        {/* Expired */}
        {state === "expired" && (
          <motion.div key="expired" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={cardTransition}
            className="bg-card rounded-3xl shadow-xl max-w-sm w-full p-8 flex flex-col items-center text-center"
          >
            <div className="w-[72px] h-[72px] rounded-full bg-muted flex items-center justify-center mb-5">
              <span className="text-[28px]">⏳</span>
            </div>
            <h2 className="text-[26px] font-extrabold text-primary mb-2">Promotion Expired</h2>
            <p className="text-[13px] text-muted-foreground">This promotion has expired.</p>
          </motion.div>
        )}

        {/* Invalid */}
        {state === "invalid" && (
          <motion.div key="invalid" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={cardTransition}
            className="bg-card rounded-3xl shadow-xl max-w-sm w-full p-8 flex flex-col items-center text-center"
          >
            <div className="w-[72px] h-[72px] rounded-full bg-destructive/10 flex items-center justify-center mb-5">
              <span className="text-[28px]">❌</span>
            </div>
            <h2 className="text-[26px] font-extrabold text-primary mb-2">Invalid Coupon</h2>
            <p className="text-[13px] text-muted-foreground">This QR code is not valid.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <p className="text-[11px] text-primary-foreground/60 mt-6 font-medium tracking-wide">
        Powered by ZIP Solutions
      </p>
    </div>
  );
};

export default Redeem;
