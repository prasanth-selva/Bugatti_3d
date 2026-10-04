"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import CarScroll from "@/components/CarScroll";
import Loader from "@/components/Loader";
import Navbar from "@/components/Navbar";
import Specs from "@/components/Specs";

const craftsmanship = [
  { number: "01", title: "Sculpted by the wind", detail: "Every contour is a conversation between downforce and desire.", mark: "aero" },
  { number: "02", title: "An atelier of one", detail: "Materials chosen, formed and finished with a level of care you can feel.", mark: "atelier" },
  { number: "03", title: "Precision, perfected", detail: "Thousands of decisions. One unmistakable expression of performance.", mark: "precision" },
];

export default function HomePage() {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [background, setBackground] = useState("#050505");
  const handleProgress = useCallback((value: number) => setProgress(value), []);
  const handleReady = useCallback(() => setReady(true), []);
  const handleBackground = useCallback((value: string) => setBackground(value), []);
  const handleError = useCallback((message: string) => setError(message), []);

  useEffect(() => {
    document.documentElement.style.setProperty("--bg", background);
  }, [background]);

  useEffect(() => {
    document.body.style.overflow = ready ? "" : "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [ready]);

  return (
    <main id="top" style={{ "--bg": background } as React.CSSProperties}>
      <Navbar />
      <CarScroll onProgress={handleProgress} onReady={handleReady} onBackground={handleBackground} onError={handleError} />
      <section className="interlude" aria-hidden="true">
        <span className="interlude-mark">B</span>
        <p>Beyond the visible.<br /><em>Beyond the possible.</em></p>
        <span className="interlude-rule" />
      </section>
      <Specs />
      <section id="craft" className="craft-section section-shell">
        <div className="section-heading craft-heading">
          <p className="eyebrow"><span className="eyebrow-rule" />Craftsmanship / 02</p>
          <h2>More than<br /><em>mechanical.</em></h2>
          <p className="section-intro">A Chiron is not assembled. It is brought into being — one deliberate detail at a time.</p>
        </div>
        <div className="craft-grid">
          {craftsmanship.map((item, index) => (
            <motion.article className={`craft-card craft-${item.mark}`} key={item.number} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.7, delay: index * 0.12 }}>
              <div className="craft-card-top"><span>{item.number}</span><span className="craft-icon" aria-hidden="true"><i /><i /><i /></span></div>
              <div><h3>{item.title}</h3><p>{item.detail}</p></div>
              <span className="craft-card-line" aria-hidden="true" />
            </motion.article>
          ))}
        </div>
      </section>
      <footer id="reserve" className="site-footer">
        <div className="footer-orbit" aria-hidden="true" />
        <p className="eyebrow"><span className="eyebrow-rule" />The next chapter is yours</p>
        <h2>Make the<br /><em>extraordinary</em><br />personal.</h2>
        <a className="button button-primary footer-cta" href="https://www.bugatti.com/en/models/chiron" target="_blank" rel="noreferrer">Enter the world of Bugatti <span aria-hidden="true">↗</span></a>
        <div className="footer-bottom">
          <a className="footer-wordmark" href="#top"><span className="brand-oval"><b>B</b></span><span>BUGATTI</span></a>
          <span className="footer-note">Anatomy of Speed · CHIRON</span>
          <a className="footer-top" href="#top">Back to top <span aria-hidden="true">↑</span></a>
        </div>
      </footer>
      <Loader progress={progress} ready={ready} error={error} />
    </main>
  );
}
