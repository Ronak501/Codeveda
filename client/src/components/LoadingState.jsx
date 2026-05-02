export default function LoadingState({ text = "Loading..." }) {
  return (
    <div className="loading-box" role="status" aria-live="polite">
      <div className="spinner" />
      <span>{text}</span>
    </div>
  );
}
