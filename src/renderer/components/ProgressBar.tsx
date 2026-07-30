import { useEffect, useState } from "react";

export default function ProgressBar({ isLoading }: { isLoading: boolean }) {
  const [justFinished, setJustFinished] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setJustFinished(true);
      const timer = setTimeout(() => setJustFinished(false), 700);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <div
      className={`progress-bar${isLoading ? " active" : ""}${justFinished ? " complete" : ""}`}
    />
  );
}
