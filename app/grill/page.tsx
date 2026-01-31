"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";

// --- Types ---
interface ClickEffect {
  id: number;
  x: number;
  y: number;
  value: string;
}

interface ShopItem {
  id: string;
  name: string;
  baseCost: number;
  baseRate: number;
  icon: string;
  description: string;
}

// --- Constants ---
const SHOP_ITEMS: ShopItem[] = [
  { id: "pickle", name: "Pickle Jar", baseCost: 15, baseRate: 0.5, icon: "🥒", description: "Salty snack" },
  { id: "blahaj", name: "Blåhaj", baseCost: 100, baseRate: 2, icon: "🦈", description: "Emotional support shark" },
  { id: "ears", name: "Cat Ears", baseCost: 500, baseRate: 10, icon: "🐱", description: "+10 Nyaa/s" },
  { id: "socks", name: "Coding Socks", baseCost: 1200, baseRate: 25, icon: "🧦", description: "Improved circulation" },
  { id: "nitro", name: "Discord Nitro", baseCost: 5000, baseRate: 80, icon: "🚀", description: "Upload bigger files" },
  { id: "voice", name: "Voice Training", baseCost: 20000, baseRate: 250, icon: "🎤", description: "Heat from fire" },
  { id: "surgery", name: "F.F.S.", baseCost: 100000, baseRate: 1000, icon: "🏥", description: "The big one" },
];

export default function EstrogenPage() {
  // --- State ---
  // Game State
  const [estrogen, setEstrogen] = useState(0);
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [prestigeLevel, setPrestigeLevel] = useState(0);
  
  // UI State
  const [clicks, setClicks] = useState<ClickEffect[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [purchaseMode, setPurchaseMode] = useState<"buy" | "sell">("buy");
  const [showPrestigeModal, setShowPrestigeModal] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Cheats State
  const [showCheatMenu, setShowCheatMenu] = useState(false);
  const [debugClicks, setDebugClicks] = useState(0);

  // --- Derived Values ---
  const prestigeMultiplier = 1 + (prestigeLevel * 0.05); // 5% per level

  const calculateProductionRate = useCallback(() => {
    let rate = 0;
    SHOP_ITEMS.forEach(item => {
      const count = inventory[item.id] || 0;
      rate += count * item.baseRate;
    });
    return rate * prestigeMultiplier;
  }, [inventory, prestigeMultiplier]);

  const productionRate = calculateProductionRate();

  const getCost = (itemId: string, count: number) => {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return 0;
    return Math.floor(item.baseCost * Math.pow(1.15, count));
  };

  const getSellPrice = (itemId: string, count: number) => {
    return Math.floor(getCost(itemId, count) * 0.5);
  };

  // --- Persistence ---
  const stateRef = useRef({ estrogen, inventory, prestigeLevel, hasStarted });
  useEffect(() => {
    stateRef.current = { estrogen, inventory, prestigeLevel, hasStarted };
  }, [estrogen, inventory, prestigeLevel, hasStarted]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("estrogenClickerSave");
      if (saved) {
        const parsed = JSON.parse(saved);
        setEstrogen(parsed.estrogen ?? 0);
        setInventory(parsed.inventory ?? {});
        setPrestigeLevel(parsed.prestigeLevel ?? 0);
        setHasStarted(parsed.hasStarted ?? false);
      }
    } catch (e) {
      console.error("Failed to load save", e);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const save = () => {
      if (stateRef.current.hasStarted) {
        localStorage.setItem("estrogenClickerSave", JSON.stringify(stateRef.current));
      }
    };
    const interval = setInterval(save, 1000); 
    window.addEventListener("beforeunload", save);

    // --- Cheats Injection ---
    (window as any).hackTheHRT = {
      addEstrogen: (amount: number) => setEstrogen(prev => prev + amount),
      setPrestige: (level: number) => setPrestigeLevel(level),
      giveAllItems: (amount = 1) => {
        setInventory(prev => {
          const newInv = { ...prev };
          SHOP_ITEMS.forEach(item => {
            newInv[item.id] = (newInv[item.id] || 0) + amount;
          });
          return newInv;
        });
      },
      reset: () => {
         localStorage.removeItem("estrogenClickerSave");
         window.location.reload();
      },
      toggleMenu: () => setShowCheatMenu(prev => !prev)
    };
    
    console.log("%c💊 HRT Clicker Loaded", "color: #F5A9B8; font-size: 20px; font-weight: bold;");
    console.log("Psst... want some cheats? Try typing `hackTheHRT` in console or click the version number 5 times.");

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", save);
      delete (window as any).hackTheHRT;
    };
  }, [isLoaded]);


  // --- Game Loop ---
  useEffect(() => {
    if (!hasStarted) return;
    const tickRate = 100;
    const interval = setInterval(() => {
      if (productionRate > 0) {
        setEstrogen(prev => prev + (productionRate / (1000 / tickRate)));
      }
    }, tickRate);
    return () => clearInterval(interval);
  }, [hasStarted, productionRate]);

  // --- Handlers ---
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!hasStarted) setHasStarted(true);
    
    const clickValue = 1 * prestigeMultiplier;
    setEstrogen(prev => prev + clickValue);

    const newClick = {
      id: Date.now(),
      x: e.clientX,
      y: e.clientY,
      value: `+${clickValue.toFixed(1)}`
    };

    setClicks(prev => [...prev, newClick]);
    setTimeout(() => {
      setClicks(prev => prev.filter(c => c.id !== newClick.id));
    }, 1000);
  };

  const handleTransaction = (item: ShopItem) => {
    const currentCount = inventory[item.id] || 0;
    if (purchaseMode === "buy") {
      const cost = getCost(item.id, currentCount);
      if (estrogen >= cost) {
        setEstrogen(prev => prev - cost);
        setInventory(prev => ({ ...prev, [item.id]: currentCount + 1 }));
      }
    } else {
      if (currentCount > 0) {
        const refund = getSellPrice(item.id, currentCount - 1);
        setEstrogen(prev => prev + refund);
        setInventory(prev => ({ ...prev, [item.id]: currentCount - 1 }));
      }
    }
  };

  const handlePrestige = () => {
    const newPrestige = prestigeLevel + 1;
    setPrestigeLevel(newPrestige);
    setEstrogen(0);
    setInventory({});
    setShowPrestigeModal(false);
    localStorage.setItem("estrogenClickerSave", JSON.stringify({
        estrogen: 0,
        inventory: {},
        prestigeLevel: newPrestige,
        hasStarted: true
    }));
  };

  const handleDebugTrigger = () => {
    setDebugClicks(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setShowCheatMenu(true);
        return 0;
      }
      return next;
    });
  };

  if (!isLoaded) return <div className="min-h-screen bg-slate-950"></div>;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 overflow-hidden relative select-none font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#5BCEFA_0%,#F5A9B8_20%,#FFFFFF_40%,#F5A9B8_60%,#5BCEFA_80%)] opacity-20 blur-3xl pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      
      <AnimatePresence>
        {hasStarted && (
          <>
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-8 left-8 z-50 p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl min-w-[320px]"
            >
              <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Current HRT Level</div>
              <div className="flex items-baseline gap-2">
                <motion.span 
                  key={Math.floor(estrogen)}
                  className="text-5xl font-black bg-clip-text bg-gradient-to-r from-[#5BCEFA] to-[#F5A9B8] text-transparent tabular-nums"
                >
                  {Math.floor(estrogen).toLocaleString()}
                </motion.span>
                <span className="text-xl text-slate-500 font-bold">mg</span>
              </div>
              <div className="text-slate-500 text-xs mt-3 font-mono flex justify-between items-center border-t border-white/5 pt-3">
                <span>{productionRate.toFixed(1)} mg/sec</span>
                {prestigeLevel > 0 && (
                   <span className="text-yellow-400 font-bold">Prestige {prestigeLevel} (+{Math.round((prestigeMultiplier - 1) * 100)}%)</span>
                )}
              </div>
              
              {estrogen > 1000 && (
                 <button 
                  onClick={() => setShowPrestigeModal(true)}
                  className="w-full mt-4 bg-purple-900/50 hover:bg-purple-800 text-purple-200 text-xs py-2 rounded border border-purple-500/30 transition-colors uppercase tracking-wider font-bold"
                 >
                   Ascend (Prestige)
                 </button>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute right-0 top-0 bottom-0 w-96 bg-slate-900/90 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col"
            >
              <div className="p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center justify-between">
                  <span>Pharmacy</span> 
                  <span 
                    onClick={handleDebugTrigger}
                    className="text-xs font-mono text-slate-500 hover:text-[#F5A9B8] cursor-help select-none"
                  >
                    v1.2
                  </span>
                </h2>
                
                <div className="flex bg-slate-800 rounded-lg p-1">
                  <button 
                    onClick={() => setPurchaseMode("buy")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${purchaseMode === "buy" ? "bg-[#5BCEFA] text-slate-900 shadow-sm" : "text-slate-400 hover:text-white"}`}
                  >
                    BUY
                  </button>
                  <button 
                    onClick={() => setPurchaseMode("sell")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${purchaseMode === "sell" ? "bg-[#F5A9B8] text-slate-900 shadow-sm" : "text-slate-400 hover:text-white"}`}
                  >
                    SELL
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {SHOP_ITEMS.map((item) => {
                  const count = inventory[item.id] || 0;
                  const cost = getCost(item.id, count);
                  const sellValue = getSellPrice(item.id, count - 1);
                  const canAfford = estrogen >= cost;
                  const canSell = count > 0;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTransaction(item)}
                      disabled={purchaseMode === "buy" ? !canAfford : !canSell}
                      className={`w-full group relative p-4 rounded-xl border transition-all text-left
                        ${purchaseMode === "buy" 
                          ? (canAfford ? "bg-slate-800/40 hover:bg-slate-800 border-white/5 hover:border-[#5BCEFA]/50" : "bg-slate-800/20 border-transparent opacity-50 cursor-not-allowed")
                          : (canSell ? "bg-slate-800/40 hover:bg-slate-800 border-white/5 hover:border-[#F5A9B8]/50" : "bg-slate-800/20 border-transparent opacity-50 cursor-not-allowed")
                        }
                      `}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl filter drop-shadow-lg">{item.icon}</span>
                          <div>
                            <div className="font-bold text-slate-200 group-hover:text-white transition-colors">{item.name}</div>
                            <div className={`text-xs font-mono transition-colors ${
                              purchaseMode === "buy" 
                                ? (canAfford ? "text-[#5BCEFA]" : "text-red-400") 
                                : "text-[#F5A9B8]"
                            }`}>
                              {purchaseMode === "buy" ? `${cost.toLocaleString()} mg` : `+${sellValue.toLocaleString()} mg`}
                            </div>
                          </div>
                        </div>
                        <div className="text-xl font-black text-slate-700 group-hover:text-slate-600">
                          {count}
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-2 flex justify-between items-center border-t border-white/5 pt-2">
                         <span>+{item.baseRate * prestigeMultiplier} mg/s</span>
                         <span className="uppercase tracking-wide font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                           {purchaseMode}
                         </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPrestigeModal && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-purple-500/30 rounded-2xl p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(168,85,247,0.2)]"
            >
              <h2 className="text-3xl font-black text-white mb-2">ASCEND</h2>
              <div className="text-purple-400 mb-6 font-mono text-sm">Reset for power</div>
              <div className="bg-slate-950 rounded-xl p-6 mb-8 border border-white/5">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-slate-500 text-right">Current Bonus</div>
                  <div className="text-white text-left font-bold">{Math.round((prestigeMultiplier - 1) * 100)}%</div>
                  <div className="text-purple-400 text-right font-bold">New Bonus</div>
                  <div className="text-[#5BCEFA] text-left font-black">{Math.round((prestigeMultiplier + 0.05 - 1) * 100)}%</div>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowPrestigeModal(false)}
                  className="flex-1 py-3 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePrestige}
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:brightness-110 shadow-lg shadow-purple-500/25 transition-all"
                >
                  Prestige (+5%)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCheatMenu && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="absolute bottom-8 left-8 z-[110] bg-black/90 border border-[#F5A9B8] p-4 rounded-xl shadow-2xl w-64 backdrop-blur-md"
          >
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
              <h3 className="text-[#F5A9B8] font-bold font-mono text-sm">HACK THE HRT</h3>
              <button onClick={() => setShowCheatMenu(false)} className="text-white/50 hover:text-white">&times;</button>
            </div>
            <div className="space-y-2">
              <button onClick={() => setEstrogen(prev => prev + 10000)} className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded font-mono">+10k mg</button>
              <button onClick={() => setEstrogen(prev => prev + 1000000)} className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded font-mono">+1M mg</button>
              <button onClick={() => setPrestigeLevel(prev => prev + 1)} className="w-full py-1 bg-purple-900/50 hover:bg-purple-900 text-xs text-purple-200 rounded font-mono">Force Prestige</button>
              <button onClick={() => {
                localStorage.removeItem("estrogenClickerSave");
                window.location.reload();
              }} className="w-full py-1 bg-red-900/50 hover:bg-red-900 text-xs text-red-200 rounded font-mono border border-red-500/30">Wipe Save</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 pointer-events-none z-[90] overflow-hidden">
        <AnimatePresence>
          {clicks.map((click) => (
            <motion.div
              key={click.id}
              initial={{ opacity: 1, y: click.y - 20, x: click.x }}
              animate={{ opacity: 0, y: click.y - 150 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute text-2xl font-black text-white pointer-events-none whitespace-nowrap drop-shadow-[0_0_10px_rgba(91,206,250,0.8)]"
              style={{ left: 0, top: 0 }}
            >
              {click.value}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <motion.h1 
        animate={{ 
          opacity: hasStarted ? 0.1 : 1,
          y: hasStarted ? -150 : 0,
          scale: hasStarted ? 0.6 : 1,
          filter: hasStarted ? "blur(4px)" : "blur(0px)"
        }}
        className="text-6xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#5BCEFA] via-[#F5A9B8] to-[#5BCEFA] mb-12 z-10 tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-1000"
      >
        ESTROGEN
      </motion.h1>

      <div className="relative z-10" style={{ perspective: "1000px" }}>
        <motion.button
          onClick={handleClick}
          style={{ transformStyle: "preserve-3d" }}
          animate={{ 
            rotateY: 360,
            rotateZ: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          whileHover={{ scale: 1.2, rotateZ: 5, cursor: "pointer" }}
          whileTap={{ scale: 0.95, rotateZ: -5 }}
          transition={{ 
            rotateY: { duration: 3, repeat: Infinity, ease: "linear" },
            rotateZ: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            default: { duration: 0.1 }
          }}
          className="appearance-none w-96 h-48 bg-teal-400 rounded-[100px] shadow-[0_0_50px_#5BCEFA,0_0_100px_#F5A9B8] flex items-center justify-center border-4 border-teal-300 relative transform-style-3d active:shadow-[0_0_150px_#5BCEFA,0_0_200px_#F5A9B8] outline-none group"
        >
          <div className="absolute top-4 left-8 right-8 h-12 bg-white/40 rounded-full blur-sm pointer-events-none group-hover:bg-white/50 transition-colors"></div>
          <span className="text-teal-600/50 font-mono text-6xl font-bold select-none transform backdrop-blur-sm pointer-events-none">
            e
          </span>
        </motion.button>
      </div>

      <motion.p
        animate={{ 
          opacity: hasStarted ? 0 : [0.5, 1, 0.5],
          color: ["#5BCEFA", "#F5A9B8", "#5BCEFA"]
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="mt-16 text-2xl font-bold font-mono drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
      >
        *spins in traaa*
      </motion.p>
    </div>
  );
}
