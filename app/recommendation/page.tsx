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
          <div className="result-intro">
            <span className={`severity severity--${result.severityLevel}`}>{result.severityLevel === "high" ? "Cần chú ý" : result.severityLevel === "moderate" ? "Theo dõi thêm" : "Ổn định"}</span>
            <h2>Điều AI nhận thấy</h2><p>{result.contextSummary}</p><blockquote>{result.empathyMessage}</blockquote>
          </div>
          <div className="action-plan"><span className="action-plan__icon">✦</span><small>Gợi ý hành động</small><h3>{result.recommendation.title}</h3><p>{result.recommendation.whyThis}</p><span className="duration">{result.recommendation.durationMinutes} phút</span><ol>{result.recommendation.steps.map((step, index) => <li key={`${index}-${step}`}><span>{index + 1}</span>{step}</li>)}</ol></div>
          {result.escalation.shouldSuggestExpert && <div className="expert-nudge"><p>{result.escalation.message}</p><Link href={`/expert?childId=${encodeURIComponent(childId)}&date=${data.observation.date}`}>Trao đổi với chuyên gia →</Link></div>}
          <small className="disclaimer">{result.disclaimer}</small>
        </section>
      </div>
    </main>
  );
}

export default function RecommendationPage() {
  return <Suspense fallback={<main className="ai-page" />}><RecommendationDetail /></Suspense>;
}
