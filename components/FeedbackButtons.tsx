"use client";

export type FeedbackValue = "liked" | "disliked" | null;

type Props = {
  value: FeedbackValue;
  onChanged: (value: FeedbackValue) => void;
};

export function FeedbackButtons({ value, onChanged }: Props) {
  function submit(next: FeedbackValue) {
    onChanged(next);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => submit(value === "liked" ? null : "liked")}
        className={`rounded border px-2 py-1 text-xs ${
          value === "liked" ? "border-green-500 bg-green-100 text-green-700" : "border-gray-200 bg-white"
        }`}
      >
        👍
      </button>
      <button
        type="button"
        onClick={() => submit(value === "disliked" ? null : "disliked")}
        className={`rounded border px-2 py-1 text-xs ${
          value === "disliked" ? "border-red-500 bg-red-100 text-red-700" : "border-gray-200 bg-white"
        }`}
      >
        👎
      </button>
    </div>
  );
}
