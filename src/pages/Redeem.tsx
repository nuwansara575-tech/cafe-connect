import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Clock, Coffee, Gift, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoOrange from "@/assets/logo-orange.png";
import logoWhite from "@/assets/logo-white.png";

type CouponState = "loading" | "unused" | "redeemed" | "expired" | "invalid" | "success";

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
  const [copied, setCopied] = useState(false);
  const redeeming = useRef(false);

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
      setState(result.status as CouponState);
    } catch {
      setState("invalid");
    }
  };

  const handleRedeem = async () => {
    if (redeeming.current || !token) return;
    redeeming.current = true;
    try {
      const { data: result, error } = await supabase.functions.invoke("coupons/redeem", {
        body: { token },
      });
      if (error) {
        setState("redeemed");
        return;
      }
      if (result?.success) {
        setData((prev) => ({ ...prev, coupon_code: result.coupon_code }));
        setState("success");
      } else {
        setState("redeemed");
      }
    } catch {
      setState("redeemed");
    }
  };

  const copyCode = () => {
    if (data.coupon_code) {
      navigator.clipboard.writeText(data.coupon_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen gradient-cafe flex flex-col items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {state === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-12 h-12 border-4 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            <p className="text-primary-foreground font-medium">Validating your coupon...</p>
          </motion.div>
        )}

        {state === "unused" && (
          <motion.div key="unused" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="bg-card rounded-2xl shadow-cafe-lg max-w-sm w-full overflow-hidden"
          >
            <div className="gradient-cafe p-6 text-center">
              <img src={logoOrange} alt="Cafe Connect" className="h-16 mx-auto mb-3 rounded-lg" />
              <p className="text-primary-foreground/80 text-sm font-medium">{data.campaign_name}</p>
            </div>
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full gradient-cafe flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                <Gift className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-3xl font-display font-bold text-foreground mb-2">{data.discount_value?.includes("%") ? `${data.discount_value} OFF` : data.discount_value}</h2>
              <p className="text-lg font-semibold text-foreground mb-1">{data.offer_title}</p>
              <p className="text-sm text-muted-foreground mb-6">{data.offer_description}</p>
              <Button onClick={handleRedeem} size="lg"
                className="w-full gradient-cafe text-primary-foreground shadow-cafe hover:shadow-cafe-lg transition-all text-lg py-6"
              >
                <Coffee className="w-5 h-5 mr-2" />
                Redeem Now
              </Button>
              <p className="text-xs text-muted-foreground mt-3">This coupon can only be used once</p>
            </div>
          </motion.div>
        )}

        {state === "success" && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="bg-card rounded-2xl shadow-cafe-lg max-w-sm w-full overflow-hidden"
          >
            <div className="gradient-cafe p-6 text-center">
              <img src={logoOrange} alt="Cafe Connect" className="h-16 mx-auto mb-3 rounded-lg" />
            </div>
            <div className="p-6 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
                <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
              </motion.div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">Coupon Redeemed! 🎉</h2>
              <p className="text-muted-foreground mb-4">Show this code to the cashier:</p>
              <div className="bg-secondary rounded-xl p-4 flex items-center justify-between mb-4">
                <span className="text-xl font-mono font-bold text-foreground tracking-wider">{data.coupon_code}</span>
                <Button variant="ghost" size="sm" onClick={copyCode}>
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">This coupon has been marked as used and cannot be reused.</p>
            </div>
          </motion.div>
        )}

        {state === "redeemed" && (
          <motion.div key="redeemed" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="bg-card rounded-2xl shadow-cafe-lg max-w-sm w-full p-8 text-center"
          >
            <img src={logoWhite} alt="Cafe Connect" className="h-12 mx-auto mb-6" />
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">Already Redeemed</h2>
            <p className="text-muted-foreground">❌ This coupon has already been redeemed.</p>
          </motion.div>
        )}

        {state === "expired" && (
          <motion.div key="expired" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="bg-card rounded-2xl shadow-cafe-lg max-w-sm w-full p-8 text-center"
          >
            <img src={logoWhite} alt="Cafe Connect" className="h-12 mx-auto mb-6" />
            <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">Promotion Expired</h2>
            <p className="text-muted-foreground">⏳ This promotion has expired.</p>
          </motion.div>
        )}

        {state === "invalid" && (
          <motion.div key="invalid" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="bg-card rounded-2xl shadow-cafe-lg max-w-sm w-full p-8 text-center"
          >
            <img src={logoWhite} alt="Cafe Connect" className="h-12 mx-auto mb-6" />
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">Invalid Coupon</h2>
            <p className="text-muted-foreground">This QR code is not valid.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Redeem;
