"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { RecommendationResult } from "@/types/recommendation";

type DetailPayload = {
  recommendation: RecommendationResult;
  observation: { date: string; time: string; mood: string };
};

function RecommendationDetail() {
  const params = useSearchParams();
  const childId = params.get("childId");
  const observationId = params.get("observationId");
  const [data, setData] = useState<DetailPayload | null>(null);
  const [error, setError] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [wasHelpful, setWasHelpful] = useState<boolean | undefined>(undefined);
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [feedbackDeferred, setFeedbackDeferred] = useState(false);

  useEffect(() => {
    if (!childId || !observationId) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ childId, observationId });
    fetch(`/api/recommendation?${query}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Không thể tải gợi ý.");
        return payload as DetailPayload;
      })
      .then(setData)
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "Không thể tải gợi ý.");
      });
    return () => controller.abort();
  }, [childId, observationId]);

  useEffect(() => {
    if (!feedbackOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !feedbackSaving) setFeedbackOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [feedbackOpen, feedbackSaving]);

  async function submitFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!childId || !observationId) return;
    if (wasHelpful === undefined) {
      setFeedbackError("Vui lòng cho biết gợi ý có hữu ích với bé không.");
      return;
    }
    if (!feedbackContent.trim()) {
      setFeedbackError("Vui lòng chia sẻ ngắn gọn kết quả sau khi thực hiện.");
      return;
    }

    setFeedbackSaving(true);
    setFeedbackError("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          observationId,
          content: feedbackContent.trim(),
          wasHelpful,
          rating,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Không thể lưu phản hồi.");
      setFeedbackSaved(true);
      setFeedbackOpen(false);
    } catch (cause) {
      setFeedbackError(cause instanceof Error ? cause.message : "Không thể lưu phản hồi.");
    } finally {
      setFeedbackSaving(false);
    }
  }

  if (!childId || !observationId) {
    return <main className="flow-page"><div className="flow-shell"><section className="empty-state"><span>✦</span><h1>Chưa chọn gợi ý</h1><p>Quay lại tổng quan để mở gợi ý gần nhất của bé.</p><Link className="button button--primary" href={childId ? `/dashboard?childId=${encodeURIComponent(childId)}` : "/children"}>Quay lại tổng quan</Link></section></div></main>;
  }

  if (error) {
    return <main className="flow-page"><div className="flow-shell"><section className="empty-state"><span>♡</span><h1>Chưa thể mở gợi ý</h1><p>{error}</p><Link className="button button--primary" href={`/dashboard?childId=${encodeURIComponent(childId)}`}>Quay lại tổng quan</Link></section></div></main>;
  }

  if (!data) {
    return <main className="ai-page"><div className="ai-shell"><div className="dashboard-skeleton" /></div></main>;
  }

  const result = data.recommendation;
  const date = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${data.observation.date}T00:00:00`));

  return (
    <main className="ai-page recommendation-detail-page">
      <div className="ai-shell">
        <header className="recommendation-detail__header">
          <div><span className="eyebrow"><i /> Gợi ý đã lưu</span><h1>Một hoạt động nhỏ,<br /><em>dành riêng cho khoảnh khắc này.</em></h1><p>Được tạo từ ghi nhận lúc {data.observation.time}, ngày {date}.</p></div>
          <Link href={`/dashboard?childId=${encodeURIComponent(childId)}`} className="button button--ghost">← Về tổng quan</Link>
        </header>

        <section className="ai-result recommendation-detail__result">
          {result.escalation.shouldSuggestExpert && <div className={`expert-alert ${result.severityLevel === "high" ? "expert-alert--high" : ""}`}><span className="expert-alert__icon">!</span><div><small>Khuyến nghị ưu tiên</small><h2>Ba mẹ nên trao đổi với bác sĩ hoặc chuyên gia</h2><p>{result.escalation.message}</p></div><Link href={`/expert?childId=${encodeURIComponent(childId)}&date=${data.observation.date}`}>Đặt lịch ngay →</Link></div>}
          <div className="result-intro">
            <span className={`severity severity--${result.severityLevel}`}>{result.severityLevel === "high" ? "Cần chú ý" : result.severityLevel === "moderate" ? "Theo dõi thêm" : "Ổn định"}</span>
            <h2>Điều AI nhận thấy</h2><p>{result.contextSummary}</p><blockquote>{result.empathyMessage}</blockquote>
          </div>
          <div className="action-plan"><span className="action-plan__icon">✦</span><small>Gợi ý hành động</small><h3>{result.recommendation.title}</h3><span className="duration">{result.recommendation.durationMinutes} phút</span><div className="recommendation-rationale"><div className="recommendation-rationale__why"><strong>Vì sao AI chọn hoạt động này?</strong><p>{result.recommendation.whyThis}</p></div>{(result.recommendation.references?.length ?? 0) > 0 && <div className="recommendation-sources"><strong>Nguồn tham khảo</strong><div>{result.recommendation.references?.map((reference) => <article key={reference.key}><span>↗</span><div><b>{reference.title}</b><small>{reference.organization}</small><p>{reference.note}</p></div></article>)}</div></div>}</div><strong className="action-plan__steps-title">Các bước thực hiện</strong><ol>{result.recommendation.steps.map((step, index) => <li key={`${index}-${step}`}><span>{index + 1}</span>{step}</li>)}</ol></div>
          <section className="recommendation-feedback-cta">
            <div><small>Phản hồi từ phụ huynh</small><h3>{feedbackSaved ? "Cảm ơn bạn đã chia sẻ kết quả" : feedbackDeferred ? "Bạn có thể quay lại sau khi thực hiện" : "Bạn đã thực hiện gợi ý này chưa?"}</h3><p>{feedbackSaved ? "Phản hồi đã được ghi nhận để các gợi ý sau phù hợp hơn với bé." : feedbackDeferred ? "EchoKid sẽ chỉ ghi nhận feedback khi bạn đã thử hoạt động cùng bé." : "Phản hồi của bạn giúp AI hiểu bé hơn và cải thiện những gợi ý tiếp theo để phù hợp hơn với bé."}</p></div>
            {!feedbackSaved && <div className="recommendation-feedback-cta__actions"><button type="button" className="button button--primary" onClick={() => { setFeedbackDeferred(false); setFeedbackOpen(true); }}>Đã thực hiện</button><button type="button" className="button button--ghost" onClick={() => setFeedbackDeferred(true)}>Chưa thực hiện</button></div>}
          </section>
          <small className="disclaimer">{result.disclaimer}</small>
        </section>
      </div>

      {feedbackOpen && (
        <div className="feedback-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !feedbackSaving) setFeedbackOpen(false); }}>
          <section className="feedback-modal" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
            <button type="button" className="feedback-modal__close" aria-label="Đóng" onClick={() => setFeedbackOpen(false)} disabled={feedbackSaving}>×</button>
            <span className="eyebrow"><i /> Ghi nhận sau hoạt động</span>
            <h2 id="feedback-title">Gợi ý này đã diễn ra thế nào?</h2>
            <p className="feedback-modal__intro">Phản hồi cho “{result.recommendation.title}” sẽ giúp AI hiểu điều gì phù hợp với bé.</p>
            <form onSubmit={submitFeedback}>
              <fieldset><legend>Gợi ý có hữu ích không?</legend><div className="feedback-choice"><button type="button" className={wasHelpful === true ? "is-selected" : ""} onClick={() => setWasHelpful(true)}>Có, hữu ích</button><button type="button" className={wasHelpful === false ? "is-selected" : ""} onClick={() => setWasHelpful(false)}>Chưa hữu ích</button></div></fieldset>
              <fieldset><legend>Mức độ phù hợp</legend><div className="feedback-rating" aria-label="Đánh giá từ 1 đến 5">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" className={value <= rating ? "is-selected" : ""} aria-label={`${value} sao`} onClick={() => setRating(value)}>★</button>)}</div></fieldset>
              <label className="feedback-note">Kết quả sau khi thực hiện<textarea value={feedbackContent} onChange={(event) => setFeedbackContent(event.target.value)} placeholder="Ví dụ: Bé tham gia khoảng 5 phút, bình tĩnh hơn và chủ động giao tiếp..." rows={4} /></label>
              {feedbackError && <p className="form-error" role="alert">{feedbackError}</p>}
              <div className="feedback-modal__actions"><button type="button" className="button button--ghost" onClick={() => setFeedbackOpen(false)} disabled={feedbackSaving}>Để sau</button><button type="submit" className="button button--primary" disabled={feedbackSaving}>{feedbackSaving ? "Đang ghi nhận..." : "Gửi phản hồi"}</button></div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default function RecommendationPage() {
  return <Suspense fallback={<main className="ai-page" />}><RecommendationDetail /></Suspense>;
}
