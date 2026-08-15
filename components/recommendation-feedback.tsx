"use client";

import { useEffect, useState } from "react";

type RecommendationFeedbackProps = {
  childId: string;
  observationId: string;
  recommendationTitle: string;
};

export default function RecommendationFeedback({ childId, observationId, recommendationTitle }: RecommendationFeedbackProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [wasHelpful, setWasHelpful] = useState<boolean | undefined>();
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deferred, setDeferred] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, saving]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (wasHelpful === undefined) return setError("Vui lòng cho biết gợi ý có hữu ích với bé không.");
    if (!content.trim()) return setError("Vui lòng chia sẻ ngắn gọn kết quả sau khi thực hiện.");

    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, observationId, content: content.trim(), wasHelpful, rating }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Không thể lưu phản hồi.");
      setSaved(true);
      setOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể lưu phản hồi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="recommendation-feedback-cta">
        <div><small>Phản hồi từ phụ huynh</small><h3>{saved ? "Cảm ơn bạn đã chia sẻ kết quả" : deferred ? "Bạn có thể quay lại sau khi thực hiện" : "Bạn đã thực hiện gợi ý này chưa?"}</h3><p>{saved ? "Phản hồi đã được ghi nhận để các gợi ý sau phù hợp hơn với bé." : deferred ? "EchoKid sẽ chỉ ghi nhận feedback khi bạn đã thử hoạt động cùng bé." : "Phản hồi của bạn giúp AI hiểu bé hơn và cải thiện những gợi ý tiếp theo để phù hợp hơn với bé."}</p></div>
        {!saved && <div className="recommendation-feedback-cta__actions"><button type="button" className="button button--primary" onClick={() => { setDeferred(false); setOpen(true); }}>Đã thực hiện</button><button type="button" className="button button--ghost" onClick={() => setDeferred(true)}>Chưa thực hiện</button></div>}
      </section>

      {open && <div className="feedback-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setOpen(false); }}>
        <section className="feedback-modal" role="dialog" aria-modal="true" aria-labelledby="daily-feedback-title">
          <button type="button" className="feedback-modal__close" aria-label="Đóng" onClick={() => setOpen(false)} disabled={saving}>×</button>
          <span className="eyebrow"><i /> Ghi nhận sau hoạt động</span>
          <h2 id="daily-feedback-title">Gợi ý này đã diễn ra thế nào?</h2>
          <p className="feedback-modal__intro">Phản hồi cho “{recommendationTitle}” sẽ giúp AI hiểu điều gì phù hợp với bé.</p>
          <form onSubmit={submit}>
            <fieldset><legend>Gợi ý có hữu ích không?</legend><div className="feedback-choice"><button type="button" className={wasHelpful === true ? "is-selected" : ""} onClick={() => setWasHelpful(true)}>Có, hữu ích</button><button type="button" className={wasHelpful === false ? "is-selected" : ""} onClick={() => setWasHelpful(false)}>Chưa hữu ích</button></div></fieldset>
            <fieldset><legend>Mức độ phù hợp</legend><div className="feedback-rating" aria-label="Đánh giá từ 1 đến 5">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" className={value <= rating ? "is-selected" : ""} aria-label={`${value} sao`} onClick={() => setRating(value)}>★</button>)}</div></fieldset>
            <label className="feedback-note">Kết quả sau khi thực hiện<textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Ví dụ: Bé tham gia khoảng 5 phút, bình tĩnh hơn và chủ động giao tiếp..." rows={4} /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="feedback-modal__actions"><button type="button" className="button button--ghost" onClick={() => setOpen(false)} disabled={saving}>Để sau</button><button type="submit" className="button button--primary" disabled={saving}>{saving ? "Đang ghi nhận..." : "Gửi phản hồi"}</button></div>
          </form>
        </section>
      </div>}
    </>
  );
}
