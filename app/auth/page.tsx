"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authClient } from "@/lib/auth-client"; // adjust path
import { 
  EnvelopeIcon, 
  KeyIcon, 
  ArrowRightIcon, 
  ArrowLeftIcon,
  UserIcon
} from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

type AuthView = "login" | "signup";

export default function AuthPage() {
  const t = useTranslations("Auth");
  const [view, setView] = useState<AuthView>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Animation Variants
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  const [direction, setDirection] = useState(1);

  const navigate = (newView: AuthView, newDir: number) => {
    setDirection(newDir);
    setError("");
    setView(newView);
  };

  // --- LOGIC HANDLERS ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      setError(typeof error === 'object' && error.message ? error.message : t("login_failed"));
    } else {
      window.location.href = "/dashboard";
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await authClient.signUp.email({
      email,
      password,
      name,
    });
    if (error) {
      setError(typeof error === 'object' && error.message ? error.message : t("signup_failed"));
    } else {
      window.location.href = "/dashboard";
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-[400px] relative overflow-hidden bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl">
        
        <div className="p-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={view}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {/* HEADER */}
              <header className="mb-8">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {view === "login" && t("welcome_back")}
                  {view === "signup" && t("create_account")}
                </h1>
                <p className="text-neutral-400 text-sm mt-1">
                  {t("enter_details")}
                </p>
              </header>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-xs">
                  {error}
                </div>
              )}

              {/* FORMS */}
              <form className="space-y-4" onSubmit={view === "login" ? handleLogin : handleSignup}>
                {view === "signup" && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">{t("name")}</label>
                    <div className="relative">
                      <UserIcon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-600 transition-colors"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">{t("email_address")}</label>
                  <div className="relative">
                    <EnvelopeIcon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-600 transition-colors"
                      placeholder="name@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">{t("password")}</label>
                  <div className="relative">
                    <KeyIcon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-600 transition-colors"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white text-black font-semibold py-2.5 rounded-xl hover:bg-neutral-200 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (view === "login" ? t("signing_in") : t("creating_account")) : (view === "login" ? t("sign_in") : t("sign_up"))} 
                    <ArrowRightIcon className="size-4" />
                  </button>
                </div>

                {/* FOOTER LINKS */}
                <div className="text-center pt-4">
                  {view === "login" ? (
                    <p className="text-xs text-neutral-500">
                      {t("no_account")}{" "}
                      <button onClick={() => navigate("signup", 1)} className="text-white font-medium hover:underline">{t("sign_up_link")}</button>
                    </p>
                  ) : (
                    <button 
                      onClick={() => navigate("login", -1)}
                      className="text-xs text-neutral-500 flex items-center justify-center gap-1 mx-auto hover:text-white transition-colors"
                    >
                      <ArrowLeftIcon className="size-3" /> {t("back_to_login")}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}