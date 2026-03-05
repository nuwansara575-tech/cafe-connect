import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Check } from "lucide-react";
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

  // Shared layout: orange top + white card bottom
  const PageShell = ({ children, topContent }: { children: React.ReactNode; topContent?: React.ReactNode }) => (
    <div className="min-h-screen flex flex-col font-[Inter]">
      <div className="gradient-cafe flex flex-col items-center px-4 pt-10 pb-0 relative">
        <img src={ccLogoWhite} alt="Cafe Connect" className="h-10 mb-1" />
        {topContent}
      </div>
      <div className="flex-1 bg-card rounded-t-[28px] -mt-1 relative z-10 flex flex-col">
        {children}
      </div>
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      {/* Loading */}
      {state === "loading" && (
        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <PageShell>
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <div className="w-10 h-10 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-[13px] text-muted-foreground font-medium">Validating your coupon...</p>
            </div>
          </PageShell>
        </motion.div>
      )}

      {/* Scanned - Claim Form */}
      {state === "scanned" && (
        <motion.div key="scanned" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
        >
          <PageShell
            topContent={
              <>
                {data.campaign_name && (
                  <p className="text-primary-foreground/80 text-[13px] font-medium tracking-wide mb-4">
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
              </>
            }
          >
            <div className="px-6 pt-7 pb-6 flex flex-col flex-1">
              <div className="text-center mb-6">
                <h2 className="text-[28px] font-extrabold text-primary mb-1 leading-tight font-[Inter]">
                  {data.discount_value?.includes("%") ? `${data.discount_value} OFF` : data.discount_value}
                </h2>
                <p className="text-[16px] font-semibold text-foreground mb-0.5 font-[Inter]">{data.offer_title}</p>
                <p className="text-[13px] text-muted-foreground font-[Inter]">{data.offer_description}</p>
              </div>

              <div className="space-y-4 mb-5">
                <div>
                  <Label htmlFor="phone" className="text-[13px] font-medium mb-1.5 text-foreground font-[Inter]">
                    Mobile Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="e.g. +94 77 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11 rounded-xl bg-secondary border-border text-[14px] font-[Inter] placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="name" className="text-[13px] font-medium mb-1.5 text-foreground font-[Inter]">
                    Name <span className="text-muted-foreground text-[11px] font-normal">(Optional)</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g. Sampath"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 rounded-xl bg-secondary border-border text-[14px] font-[Inter] placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {claimError && (
                <p className="text-[13px] text-destructive mb-3 text-center font-medium font-[Inter]">{claimError}</p>
              )}

              <Button onClick={handleClaim} size="lg"
                className="w-full gradient-cafe text-primary-foreground text-[16px] py-[14px] rounded-[14px] font-semibold font-[Inter] h-auto"
              >
                Claim Coupon
              </Button>
              <p className="text-[11px] text-muted-foreground mt-3 text-center font-[Inter]">
                Your coupon code will be sent to your phone
              </p>
            </div>
          </PageShell>
        </motion.div>
      )}

      {/* Claiming spinner */}
      {state === "claiming" && (
        <motion.div key="claiming" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <PageShell>
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <div className="w-10 h-10 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-[13px] text-muted-foreground font-medium font-[Inter]">Claiming your coupon...</p>
            </div>
          </PageShell>
        </motion.div>
      )}

      {/* Success - Coupon Claimed */}
      {state === "success" && (
        <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
        >
          <PageShell
            topContent={
              <motion.img
                src={openBox}
                alt="Coupon Claimed"
                className="w-[80px] h-[80px] my-4"
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.15 }}
              />
            }
          >
            <div className="px-6 pt-7 pb-6 text-center flex flex-col flex-1">
              <h2 className="text-[26px] font-extrabold text-primary mb-2 font-[Inter]">Coupon Claimed!</h2>
              <p className="text-[13px] text-muted-foreground mb-5 font-[Inter]">Show this code to the cashier at the counter:</p>

              <div className="border border-border rounded-2xl p-4 flex items-center justify-between mb-5 bg-secondary">
                <span className="text-[18px] font-mono font-bold text-foreground tracking-widest">{data.coupon_code}</span>
                <Button variant="ghost" size="sm" onClick={copyCode} className="hover:bg-primary/10 h-8 w-8 p-0">
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-primary" />}
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed font-[Inter]">
                Please take a screenshot of this page and<br />
                present it at the counter to redeem your coupon.
              </p>
              <p className="text-[11px] text-muted-foreground mt-2 font-medium font-[Inter]">
                The cashier will verify and redeem this code<br />
                when you visit the cafe.
              </p>
            </div>
          </PageShell>
        </motion.div>
      )}

      {/* Already Claimed */}
      {state === "claimed" && (
        <motion.div key="claimed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
        >
          <PageShell
            topContent={
              <motion.img
                src={checkImg}
                alt="Already Claimed"
                className="w-[72px] h-[72px] my-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.15 }}
              />
            }
          >
            <div className="px-6 pt-7 pb-6 text-center">
              <h2 className="text-[26px] font-extrabold text-primary mb-2 font-[Inter]">Already Claimed</h2>
              <p className="text-[13px] text-muted-foreground leading-relaxed font-[Inter]">
                This coupon has already been claimed.<br />
                Check your phone for the coupon code.
              </p>
            </div>
          </PageShell>
        </motion.div>
      )}

      {/* Already Redeemed */}
      {state === "redeemed" && (
        <motion.div key="redeemed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
        >
          <PageShell
            topContent={
              <motion.img
                src={checkImg}
                alt="Redeemed"
                className="w-[72px] h-[72px] my-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.15 }}
              />
            }
          >
            <div className="px-6 pt-7 pb-6 text-center">
              <h2 className="text-[26px] font-extrabold text-primary mb-2 font-[Inter]">Already Redeemed</h2>
              <p className="text-[13px] text-muted-foreground font-[Inter]">This coupon has already been used.</p>
            </div>
          </PageShell>
        </motion.div>
      )}

      {/* Expired */}
      {state === "expired" && (
        <motion.div key="expired" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
        >
          <PageShell>
            <div className="px-6 pt-10 pb-6 text-center">
              <div className="w-[72px] h-[72px] rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
                <span className="text-[28px]">⏳</span>
              </div>
              <h2 className="text-[26px] font-extrabold text-primary mb-2 font-[Inter]">Promotion Expired</h2>
              <p className="text-[13px] text-muted-foreground font-[Inter]">This promotion has expired.</p>
            </div>
          </PageShell>
        </motion.div>
      )}

      {/* Invalid */}
      {state === "invalid" && (
        <motion.div key="invalid" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
        >
          <PageShell>
            <div className="px-6 pt-10 pb-6 text-center">
              <div className="w-[72px] h-[72px] rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-5">
                <span className="text-[28px]">❌</span>
              </div>
              <h2 className="text-[26px] font-extrabold text-primary mb-2 font-[Inter]">Invalid Coupon</h2>
              <p className="text-[13px] text-muted-foreground font-[Inter]">This QR code is not valid.</p>
            </div>
          </PageShell>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Redeem;
