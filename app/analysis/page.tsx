"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Mood } from "@/types/dailyLog";
import type { RecommendationResult } from "@/types/recommendation";

type Track = {
  id: string;
  date: string;
  time: string;
  mood: string;
  meltdown?: { totalCount?: number };
  sleep?: { quality?: string };
  socialInteraction?: string;
  focus?: string;
  freeTextNote?: string;
  activityFeedback?: string;
};

const moods = [
  { value: "happy", label: "Vui vẻ", image: "/happy.png" },
  { value: "calm", label: "Bình tĩnh", image: "/calm.png" },
  { value: "irritable", label: "Cáu gắt", image: "/angry.png" },
  { value: "anxious", label: "Lo âu", image: "/worry.png" },
  { value: "withdrawn", label: "Thu mình", image: "/shy.png" },
];
const moodNames: Record<string, string> = Object.fromEntries(moods.map((item) => [item.value, item.label]));

function trackSignals(track: Track): string[] {
  const signals: string[] = [];
  const meltdownCount = track.meltdown?.totalCount ?? 0;
  if (meltdownCount > 0) signals.push(`Meltdown ${meltdownCount} lần`);
  if (track.sleep?.quality === "poor") signals.push("Ngủ kém");
  if (track.sleep?.quality === "restless") signals.push("Ngủ trằn trọc");
  if (track.socialInteraction === "low") signals.push("Tương tác thấp");
  if (track.focus === "low") signals.push("Tập trung thấp");
  return signals;
}

function AnalysisContent() {
  const params = useSearchParams();
  const childId = params.get("childId");
  const today = new Date().toLocaleDateString("en-CA");
  const [mood, setMood] = useState<Mood>("calm");
  const [sleepHours, setSleepHours] = useState(8);
  const [sleepQuality, setSleepQuality] = useState("good");
  const [social, setSocial] = useState("medium");
  const [focus, setFocus] = useState("medium");
  const [ateNormally, setAteNormally] = useState(true);
  const [mealNotes, setMealNotes] = useState("");
  const [meltdown, setMeltdown] = useState(false);
  const [meltdownCount, setMeltdownCount] = useState(1);
  const [meltdownTrigger, setMeltdownTrigger] = useState("");
  const [note, setNote] = useState("");
  const [activityFeedback, setActivityFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [loadingSavedResult, setLoadingSavedResult] = useState(true);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!childId) return;
    const encodedChildId = encodeURIComponent(childId);
    fetch(`/api/daily_log?childId=${encodedChildId}&days=7`)
      .then((res) => res.json())
      .then((data) => setTracks((data.observations ?? []).slice(-8).reverse()))
      .catch(() => undefined);
    fetch(`/api/recommendation?childId=${encodedChildId}`)
      .then(async (response) => {
        if (response.status === 404) return null;
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error);
        return payload.recommendation as RecommendationResult;
      })
      .then((saved) => { if (saved) setResult(saved); })
      .catch(() => undefined)
      .finally(() => setLoadingSavedResult(false));
  }, [childId]);

  async function submit() {
    if (!childId) return;
    setSaving(true); setError(""); setResult(null);
    try {
      const logResponse = await fetch("/api/daily_log", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId, date: today, mood,
          sleep: { hours: sleepHours, quality: sleepQuality },
          meal: { ateNormally, notes: mealNotes }, socialInteraction: social, focus, freeTextNote: note,
          activityFeedback,
          meltdown: {
            occurred: meltdown,
            count: meltdown ? meltdownCount : 0,
            trigger: meltdown ? meltdownTrigger : "",
          },
          markCompleted: true,
        }),
      });
      const logData = await logResponse.json();
      if (!logResponse.ok) throw new Error(logData.error || "Không thể lưu ghi nhận.");
      const recommendationResponse = await fetch("/api/recommendation", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, observationId: logData.observationId }),
      });
      const recommendation = await recommendationResponse.json();
      if (!recommendationResponse.ok) throw new Error(recommendation.error || "AI chưa thể phân tích.");
      setResult(recommendation);
      setTracks((items) => [{
        id: logData.observationId, date: today,
        time: new Date().toTimeString().slice(0, 5), mood,
        meltdown: { totalCount: meltdown ? meltdownCount : 0 },
        sleep: { quality: sleepQuality }, socialInteraction: social, focus,
        freeTextNote: note,
        activityFeedback,
      }, ...items].slice(0, 8));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Có lỗi xảy ra.");
    } finally { setSaving(false); }
  }

  if (!childId) return (
    <main className="flow-page"><div className="flow-shell"><section className="empty-state"><span>♡</span><h1>Chọn bé trước khi bắt đầu</h1><p>Mỗi bé có một không gian AI và lịch sử riêng.</p><Link href="/children" className="button button--primary">Đến trang chọn bé</Link></section></div></main>
  );

  return (
    <main className="ai-page">
      <div className="ai-shell">
        <header className="ai-header">
          <div><span className="eyebrow"><i /> AI đồng hành</span><h1>Ghi nhận một khoảnh khắc,<br /><em>hiểu thêm về con.</em></h1><p>Mỗi lần lưu là một điểm trên hành trình. Ba mẹ có thể ghi nhiều lần trong ngày.</p></div>
        </header>

        <div className="ai-layout">
          <section className="checkin-card">
            <div className="card-title"><span>01</span><div><h2>Bé đang cảm thấy thế nào?</h2><p>Chọn cảm xúc gần nhất ở thời điểm này.</p></div></div>
            <div className="mood-picker">
              {moods.map((item) => <button type="button" key={item.value} onClick={() => setMood(item.value as Mood)} className={mood === item.value ? "is-selected" : ""} aria-pressed={mood === item.value}><img className="face-image" src={item.image} alt={item.label} /><small>{item.label}</small></button>)}
            </div>
            <div className="checkin-fields">
              <label>
                <span>Thời lượng ngủ <b>{sleepHours} giờ</b></span>
                <div className="sleep-control">
                  <input
                    type="range"
                    min="3"
                    max="12"
                    step="0.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(Number(e.target.value))}
                  />
                  <span className="sleep-number">
                    <input
                      type="number"
                      min="3"
                      max="12"
                      step="0.5"
                      value={sleepHours}
                      aria-label="Nhập số giờ ngủ"
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (Number.isFinite(value)) setSleepHours(Math.min(12, Math.max(3, value)));
                      }}
                    />
                    <small>giờ</small>
                  </span>
                </div>
              </label>
              <div className="segmented-field">
                <span>Chất lượng giấc ngủ</span>
                <div>
                  {[["good", "Ngủ tốt"], ["restless", "Trằn trọc"], ["poor", "Ngủ kém"]].map(([value, label]) => (
                    <button key={value} className={sleepQuality === value ? "is-active" : ""} onClick={() => setSleepQuality(value)}>{label}</button>
                  ))}
                </div>
              </div>
              <div className="segmented-field"><span>Tương tác xã hội</span><div>{["low", "medium", "high"].map((v) => <button key={v} className={social === v ? "is-active" : ""} onClick={() => setSocial(v)}>{v === "low" ? "Thấp" : v === "medium" ? "Vừa" : "Tốt"}</button>)}</div></div>
              <div className="segmented-field"><span>Khả năng tập trung</span><div>{["low", "medium", "high"].map((v) => <button key={v} className={focus === v ? "is-active" : ""} onClick={() => setFocus(v)}>{v === "low" ? "Thấp" : v === "medium" ? "Vừa" : "Tốt"}</button>)}</div></div>
              <section className="observation-block observation-block--meal">
                <header><span>04</span><div><h3>Ăn uống</h3><p>Ghi nhận tình trạng ăn uống trong lần quan sát này.</p></div></header>
                <button className={`observation-toggle ${ateNormally ? "is-on" : ""}`} onClick={() => setAteNormally((v) => !v)}><i /> Ăn uống bình thường</button>
                {!ateNormally && (
                  <label className="note-field">Ghi chú bữa ăn<textarea value={mealNotes} onChange={(e) => setMealNotes(e.target.value)} placeholder="Ví dụ: Chỉ ăn bánh gạo, từ chối cơm..." /></label>
                )}
              </section>

              <section className="observation-block observation-block--meltdown">
                <header><span>05</span><div><h3>Meltdown</h3><p>Cơn mất kiểm soát cảm xúc hoặc hành vi của bé.</p></div></header>
                <button className={`observation-toggle ${meltdown ? "is-alert" : ""}`} onClick={() => setMeltdown((v) => !v)}><i /> Có xảy ra meltdown</button>
                {meltdown && (
                  <div className="meltdown-details">
                    <label>
                      Số lần
                      <input type="number" min="1" max="20" value={meltdownCount} onChange={(e) => setMeltdownCount(Math.min(20, Math.max(1, Number(e.target.value) || 1)))} />
                    </label>
                    <label>
                      Tác nhân có thể xảy ra
                      <input value={meltdownTrigger} onChange={(e) => setMeltdownTrigger(e.target.value)} placeholder="Ví dụ: Đồ ăn không đúng vị" />
                    </label>
                  </div>
                )}
              </section>
              <label className="note-field">Ghi chú thêm<textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Điều gì vừa xảy ra? Có tác nhân nào đáng chú ý không?" /></label>
              <label className="note-field">Phản hồi sau khi thử gợi ý trước<textarea value={activityFeedback} onChange={(e) => setActivityFeedback(e.target.value)} placeholder="Ví dụ: Hoạt động lăn bóng giúp con bình tĩnh hơn, nhưng 10 phút là hơi dài và con bỏ đi giữa chừng." /></label>
            </div>
            {error && <p className="form-error">{error}</p>}
            <button className="button button--primary submit-observation" onClick={submit} disabled={saving}>{saving ? "AI đang phân tích..." : "Lưu & phân tích bằng AI"} <span>✦</span></button>
          </section>

          <aside className="session-timeline">
            <div className="card-title"><span>◷</span><div><h2>Dòng thời gian gần đây</h2><p>{tracks.length} lần ghi nhận · mới nhất trước</p></div></div>
            <div className="timeline-list">
              {tracks.length ? tracks.map((track) => {
                const signals = trackSignals(track);
                return <article key={track.id} className={signals.length ? "has-warning" : ""}><i /><time>{track.time}</time><div><strong>{moodNames[track.mood] ?? track.mood}{signals.length ? " · Cần theo dõi" : ""}</strong>{signals.length > 0 && <span className="timeline-signals">{signals.map((signal) => <b key={signal}>{signal}</b>)}</span>}<small>{track.date}{track.freeTextNote ? ` · ${track.freeTextNote}` : ""}{track.activityFeedback ? ` · Phản hồi: ${track.activityFeedback}` : ""}</small></div></article>;
              }) : <p className="timeline-empty">Chưa có ghi nhận. Khoảnh khắc đầu tiên sẽ xuất hiện tại đây.</p>}
            </div>
            <Link href={`/dashboard?childId=${childId}`} className="button button--ghost">Xem toàn bộ tiến trình →</Link>
          </aside>
        </div>

        {loadingSavedResult && <section className="saved-result-loading">Đang tải gợi ý gần nhất đã lưu...</section>}
        {result && <section className="ai-result">
          <div className="result-intro"><span className={`severity severity--${result.severityLevel}`}>{result.severityLevel === "high" ? "Cần chú ý" : result.severityLevel === "moderate" ? "Theo dõi thêm" : "Ổn định"}</span><h2>AI đã phân tích xong</h2><p>{result.contextSummary}</p><blockquote>{result.empathyMessage}</blockquote></div>
          <div className="action-plan"><span className="action-plan__icon">✦</span><small>Gợi ý hành động ngay</small><h3>{result.recommendation.title}</h3><p>{result.recommendation.whyThis}</p><span className="duration">{result.recommendation.durationMinutes} phút</span><ol>{result.recommendation.steps.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol>{result.recommendation.references?.length ? <div className="action-plan__references"><strong>Nguồn tham khảo</strong><ul>{result.recommendation.references.map((reference) => <li key={reference.key}><b>{reference.title}</b> · {reference.organization} · {reference.note}</li>)}</ul></div> : null}<Link className="saved-recommendation-link" href={`/recommendation?childId=${encodeURIComponent(childId)}&observationId=${encodeURIComponent(result.logId)}`}>Xem chi tiết gợi ý đã lưu →</Link></div>
          {result.escalation.shouldSuggestExpert && <div className="expert-nudge"><p>{result.escalation.message}</p><Link href={`/expert?childId=${childId}&date=${today}`}>Trao đổi với chuyên gia →</Link></div>}
          <small className="disclaimer">{result.disclaimer}</small>
        </section>}
      </div>
    </main>
  );
}

export default function AnalysisPage() {
  return <Suspense fallback={<main className="ai-page" />}><AnalysisContent /></Suspense>;
}
