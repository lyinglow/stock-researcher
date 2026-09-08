import React from "react";

export default function RatingBars({ rating, label = "Rating" }) {
  return (
    <div className="flex items-end gap-0.5" aria-label={`${label} ${rating} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`w-1.5 rounded-sm ${n <= rating ? "bg-sky-500" : "bg-butter-200"}`}
          style={{ height: `${8 + n * 3}px` }}
        />
      ))}
    </div>
  );
}
