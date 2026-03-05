import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Check, Phone, User, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ccLogoWhite from "@/assets/cc-logo-white.png";
import giftBox from "@/assets/gift-box.png";
import openBox from "@/assets/open-box.png";
import checkImg from "@/assets/check.png";

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
      setState("success");
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

  return (
    <div className="min-h-screen gradient-cafe flex flex-col items-center font-[Inter] relative overflow-hidden">
      {/* Liquid glass ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-[80px]" />
        <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-white/8 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/5 blur-[60px]" />
      </div>

      {/* Header */}
      <div className="w-full pt-10 pb-6 flex flex-col items-center relative z-10">
        <img src={ccLogoWhite} alt="Cafe Connect" className="h-14 mb-2" />
        {state === "scanned" && data.campaign_name && (
          <p className="text-primary-foreground/80 text-sm font-medium tracking-wide">
            {data.campaign_name}
          </p>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Loading */}
        {state === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 mt-20 relative z-10"
          >
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-primary-foreground font-medium">Validating your coupon...</p>
          </motion.div>
        )}

        {/* Scanned - Claim Form */}
        {state === "scanned" && (
          <motion.div key="scanned" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="redeem-card glass-strong rounded-3xl max-w-sm w-full mx-4 overflow-hidden relative z-10"
          >
            <div className="p-6 pt-8">
              <div className="text-center mb-6">
                <motion.img
                  src={giftBox}
                  alt="Gift"
                  className="w-20 h-20 mx-auto mb-4"
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.2 }}
                />
                <h2 className="text-3xl font-extrabold text-primary mb-1 tracking-tight">
                  {data.discount_value?.includes("%") ? `${data.discount_value} OFF` : data.discount_value}
                </h2>
                <p className="text-base font-semibold text-foreground mb-1">{data.offer_title}</p>
                <p className="text-sm text-muted-foreground">{data.offer_description}</p>
              </div>

              <div className="space-y-4 mb-5">
                <div>
                  <Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-1.5 mb-1.5 text-foreground">
                    Mobile Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="e.g. +94 77 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-12 rounded-xl border-primary/40 focus:border-primary focus:ring-primary/30 text-base font-[Inter]"
                  />
                </div>
                <div>
                  <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-1.5 mb-1.5 text-foreground">
                    Name <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g. Sampath"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 rounded-xl border-primary/40 focus:border-primary focus:ring-primary/30 text-base font-[Inter]"
                  />
                </div>
              </div>

              {claimError && (
                <p className="text-sm text-destructive mb-3 text-center font-medium">{claimError}</p>
              )}

              <Button onClick={handleClaim} size="lg"
                className="w-full gradient-cafe text-primary-foreground shadow-cafe hover:shadow-cafe-lg transition-all text-lg py-6 rounded-2xl font-bold tracking-wide"
              >
                Claim Coupon
              </Button>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Your coupon code will be sent to your phone
              </p>
            </div>
          </motion.div>
        )}

        {/* Claiming spinner */}
        {state === "claiming" && (
          <motion.div key="claiming" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 mt-20 relative z-10"
          >
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-primary-foreground font-medium">Claiming your coupon...</p>
          </motion.div>
        )}

        {/* Success - Coupon Claimed */}
        {state === "success" && (
          <motion.div key="success" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="glass-strong rounded-3xl max-w-sm w-full mx-4 overflow-hidden relative z-10"
          >
            <div className="p-6 pt-8 text-center">
              <motion.img
                src={openBox}
                alt="Coupon Claimed"
                className="w-24 h-24 mx-auto mb-4"
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.2 }}
              />
              <h2 className="text-2xl font-extrabold text-primary mb-2 tracking-tight">Coupon Claimed!</h2>
              <p className="text-sm text-muted-foreground mb-5">Show this code to the cashier at the counter:</p>

              <div className="border-2 border-primary/30 rounded-2xl p-4 flex items-center justify-between mb-5 bg-secondary/50">
                <span className="text-xl font-mono font-bold text-foreground tracking-widest">{data.coupon_code}</span>
                <Button variant="ghost" size="sm" onClick={copyCode} className="hover:bg-primary/10">
                  {copied ? <Check className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5 text-primary" />}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Please take a screenshot of this page and<br />
                present it at the counter to redeem your coupon.
              </p>
              <p className="text-xs text-muted-foreground mt-2 font-medium">
                The cashier will verify and redeem this code<br />
                when you visit the cafe.
              </p>
            </div>
          </motion.div>
        )}

        {/* Already Claimed */}
        {state === "claimed" && (
          <motion.div key="claimed" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="glass-strong rounded-3xl max-w-sm w-full mx-4 p-8 text-center relative z-10"
          >
            <motion.img
              src={checkImg}
              alt="Already Claimed"
              className="w-20 h-20 mx-auto mb-5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            />
            <h2 className="text-2xl font-extrabold text-primary mb-2 tracking-tight">Already Claimed</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This coupon has already been claimed.<br />
              Check your phone for the coupon code.
            </p>
          </motion.div>
        )}

        {/* Already Redeemed */}
        {state === "redeemed" && (
          <motion.div key="redeemed" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="glass-strong rounded-3xl max-w-sm w-full mx-4 p-8 text-center relative z-10"
          >
            <motion.img
              src={checkImg}
              alt="Redeemed"
              className="w-20 h-20 mx-auto mb-5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            />
            <h2 className="text-2xl font-extrabold text-primary mb-2 tracking-tight">Already Redeemed</h2>
            <p className="text-sm text-muted-foreground">This coupon has already been used.</p>
          </motion.div>
        )}

        {/* Expired */}
        {state === "expired" && (
          <motion.div key="expired" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="glass-strong rounded-3xl max-w-sm w-full mx-4 p-8 text-center relative z-10"
          >
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
              <span className="text-3xl">⏳</span>
            </div>
            <h2 className="text-2xl font-extrabold text-primary mb-2 tracking-tight">Promotion Expired</h2>
            <p className="text-sm text-muted-foreground">This promotion has expired.</p>
          </motion.div>
        )}

        {/* Invalid */}
        {state === "invalid" && (
          <motion.div key="invalid" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="glass-strong rounded-3xl max-w-sm w-full mx-4 p-8 text-center relative z-10"
          >
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-5">
              <span className="text-3xl">❌</span>
            </div>
            <h2 className="text-2xl font-extrabold text-primary mb-2 tracking-tight">Invalid Coupon</h2>
            <p className="text-sm text-muted-foreground">This QR code is not valid.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="mt-auto py-6 relative z-10">
        <p className="text-xs text-primary-foreground/60">Powered by ZIP Solutions</p>
      </div>
    </div>
  );
};

export default Redeem;
