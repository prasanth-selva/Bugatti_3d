"use client";

import { AnimatePresence, motion } from "framer-motion";

type LoaderProps = { progress: number; ready: boolean; error: string | null };

export default function Loader({ progress, ready, error }: LoaderProps) {
  return (
    <AnimatePresence>
      {!ready && (
        <motion.div
          className="page-loader"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } }}
          role={error ? "alert" : "status"}
          aria-live="polite"
        >
          <div className="loader-brand"><span className="brand-oval brand-oval-small"><b>B</b></span><span>BUGATTI</span></div>
          <div className="loader-center">
            <div className={`loader-spinner${error ? " is-error" : ""}`} aria-hidden="true" />
            <p className="eyebrow">{error ? "Sequence unavailable" : "Preparing the experience"}</p>
            {error ? (
              <>
                <p className="loader-error">{error}</p>
                <button className="button button-quiet loader-retry" type="button" onClick={() => window.location.reload()}>Retry sequence <span aria-hidden="true">↻</span></button>
              </>
            ) : (
              <span className="loader-percent">{String(progress).padStart(2, "0")}<small>%</small></span>
            )}
          </div>
          <div className="loader-footer">
            <span>{error ? "Please try again" : "Loading precision, frame by frame"}</span>
            <div className="loader-track" role="progressbar" aria-label="Loading animation frames" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
              <motion.span className="loader-fill" animate={{ width: `${progress}%` }} transition={{ duration: 0.24, ease: "easeOut" }} />
            </div>
            <span>{error ? "" : `${progress} / 100`}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
