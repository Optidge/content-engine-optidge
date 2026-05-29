type Props = {
  liked: number;
  disliked: number;
  pending: number;
};

export function FeedbackSummary({ liked, disliked, pending }: Props) {
  return (
    <div className="mt-4 rounded border border-gray-200 bg-optidge-green-pale/50 px-3 py-2 text-sm text-optidge-text">
      {liked} approved · {disliked} rejected · {pending} pending
      <span className="mt-1 block text-xs text-optidge-text-muted">
        Ratings are local until you save your review below.
      </span>
    </div>
  );
}
