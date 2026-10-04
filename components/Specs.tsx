"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useMotionValueEvent, useSpring, useTransform } from "framer-motion";

type Stat = { value: number; label: string; suffix: string; decimals?: number; note: string };
const stats: Stat[] = [
  { value: 420, label: "Top speed", suffix: " km/h", note: "With Speed Key engaged" },
  { value: 24, label: "0–100 km/h", suffix: " s", decimals: 1, note: "From a standing start" },
  { value: 1500, label: "Power output", suffix: " PS", note: "1,103 kW of pure force" },
  { value: 1600, label: "Maximum torque", suffix: " Nm", note: "Available from 2,000 rpm" },
];

function CountUp({ stat, index }: { stat: Stat; index: number }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  const value = useMotionValue(0);
  const spring = useSpring(value, { stiffness: 55, damping: 22, mass: 0.7 });
  const rounded = useTransform(spring, (current) => Math.round(current));
  const [display, setDisplay] = useState("0");
  useMotionValueEvent(rounded, "change", (current) => {
    const scale = stat.decimals ? 10 : 1;
    setDisplay((current / scale).toLocaleString("en-US", {
      minimumFractionDigits: stat.decimals ?? 0,
      maximumFractionDigits: stat.decimals ?? 0,
    }));
  });
  useEffect(() => {
    if (isInView) value.set(stat.value * (stat.decimals ? 10 : 1));
  }, [isInView, stat.value, stat.decimals, value]);

  return (
    <motion.article className="spec-card" initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}>
      <span className="spec-index">0{index + 1}</span>
      <p className="spec-value" ref={ref} aria-label={`${stat.label}: ${stat.value}${stat.suffix}`}>
        <span aria-hidden="true">{display}</span><small>{stat.suffix}</small>
      </p>
      <div className="spec-caption"><span>{stat.label}</span><span>{stat.note}</span></div>
    </motion.article>
  );
}

export default function Specs() {
  return (
    <section id="performance" className="specs-section section-shell">
      <div className="section-heading">
        <p className="eyebrow"><span className="eyebrow-rule" />Performance / 01</p>
        <h2>Numbers with<br /><em>no equal.</em></h2>
        <p className="section-intro">Every figure is a consequence of uncompromising intent. Nothing is incidental.</p>
      </div>
      <div className="spec-grid">
        {stats.map((stat, index) => <CountUp key={stat.label} stat={stat} index={index} />)}
      </div>
      <p className="spec-source">Chiron model specifications · Figures sourced from BUGATTI</p>
    </section>
  );
}
