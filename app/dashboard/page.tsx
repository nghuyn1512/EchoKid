"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Range = "day" | "week" | "month";
type Observation = {
  id: string; date: string; time: string; observedAt: string; mood: string;
  sleepHours: number; meltdownCount: number; socialInteraction: string;
  focus: string; note: string;
};
type Progress = {
  summary: { logsSubmitted: number; meltdownTrend: string; sleepAvgHours: number; activitiesCompleted: number };
  observations: Observation[];
};

const moodScore: Record<string, number> = { withdrawn: 1, anxious: 2, irritable: 2, calm: 4, happy: 5 };
const moodLabel: Record<string, string> = { withdrawn: "Thu mình", anxious: "Lo âu", irritable: "Cáu gắt", calm: "Bình tĩnh", happy: "Vui vẻ" };
const levelScore: Record<string, number> = { low: 1, medium: 2, high: 3 };

function DashboardContent() {
  const params = useSearchParams();
  const childId = params.get("childId");
  const [range, setRange] = useState<Range>("week");
  const [data, setData] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!childId) return;
    setLoading(true);
    fetch(`/api/dashboard/progress?childId=${childId}&range=${range}`)
      .then(async (res) => { const value = await res.json(); if (!res.ok) throw new Error(value.error); return value; })
      .then(setData).catch(() => setError("Không thể tải dữ liệu tiến trình.")).finally(() => setLoading(false));
  }, [childId, range]);

  const observations = useMemo(() => data?.observations ?? [], [data]);
  const chartPoints = observations.length > 1
    ? observations.map((item, index) => `${(index / (observations.length - 1)) * 100},${100 - (moodScore[item.mood] ?? 3) * 18}`).join(" ")
    : "";
  const happyRate = observations.length ? Math.round(observations.filter((item) => ["happy", "calm"].includes(item.mood)).length / observations.length * 100) : 0;
  const socialAverage = observations.length ? observations.reduce((sum, item) => sum + (levelScore[item.socialInteraction] ?? 2), 0) / observations.length : 0;

  if (!childId) return <main className="flow-page"><div className="flow-shell"><section className="empty-state"><h1>Chưa chọn hồ sơ bé</h1><Link className="button button--primary" href="/children">Chọn bé</Link></section></div></main>;

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <header className="dashboard-header">
          <div><span className="eyebrow"><i /> Bức tranh tiến trình</span><h1>Nhìn lại để hiểu con<br /><em>rõ hơn mỗi ngày.</em></h1><p>Dữ liệu được tổng hợp từ từng lần ghi nhận theo đúng thời gian.</p></div>
          <div className="range-switch">{(["day", "week", "month"] as Range[]).map((item) => <button key={item} className={range === item ? "is-active" : ""} onClick={() => setRange(item)}>{item === "day" ? "Hôm nay" : item === "week" ? "7 ngày" : "30 ngày"}</button>)}</div>
        </header>

        {error ? <div className="form-error">{error}</div> : null}
        <section className="metric-grid">
          <article><span className="metric-icon metric-icon--green">✦</span><small>Lần ghi nhận</small><strong>{loading ? "—" : observations.length}</strong><p>Trong khoảng đã chọn</p></article>
          <article><span className="metric-icon metric-icon--aqua">◡</span><small>Ổn định tích cực</small><strong>{loading ? "—" : `${happyRate}%`}</strong><p>Bình tĩnh hoặc vui vẻ</p></article>
          <article><span className="metric-icon metric-icon--cream">☾</span><small>Ngủ trung bình</small><strong>{loading ? "—" : `${data?.summary.sleepAvgHours ?? 0}h`}</strong><p>Mỗi lần ghi nhận</p></article>
          <article><span className="metric-icon metric-icon--pink">♡</span><small>Tương tác</small><strong>{loading ? "—" : socialAverage >= 2.5 ? "Tốt" : socialAverage >= 1.5 ? "Vừa" : "Thấp"}</strong><p>Mức trung bình</p></article>
        </section>

        <section className="charts-grid">
          <article className="chart-card chart-card--wide">
            <div className="chart-heading"><div><small>Biểu đồ cảm xúc</small><h2>Nhịp cảm xúc theo thời gian</h2></div><span className="legend-dot">● Mức tích cực</span></div>
            <div className="line-chart">
              <div className="axis-labels"><span>Vui</span><span>Bình tĩnh</span><span>Khó chịu</span><span>Thu mình</span></div>
              {chartPoints ? <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Xu hướng cảm xúc"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#41C8C1" stopOpacity=".35"/><stop offset="1" stopColor="#41C8C1" stopOpacity="0"/></linearGradient></defs><polyline points={`0,100 ${chartPoints} 100,100`} fill="url(#area)" stroke="none"/><polyline points={chartPoints} fill="none" stroke="#41C8C1" strokeWidth="2.3" vectorEffect="non-scaling-stroke"/></svg> : <div className="no-chart">Cần ít nhất hai lần ghi nhận để vẽ xu hướng.</div>}
              <div className="chart-times">{observations.slice(0, 6).map((item) => <span key={item.id}>{range === "day" ? item.time : item.date.slice(5)}</span>)}</div>
            </div>
          </article>

          <article className="chart-card">
            <div className="chart-heading"><div><small>Phân bố</small><h2>Cảm xúc nổi bật</h2></div></div>
            <div className="donut-wrap">
              <div className="donut" style={{ "--value": `${happyRate * 3.6}deg` } as React.CSSProperties}><span><strong>{happyRate}%</strong><small>tích cực</small></span></div>
              <div className="mood-summary">{Object.entries(observations.reduce<Record<string, number>>((acc, item) => { acc[item.mood] = (acc[item.mood] ?? 0) + 1; return acc; }, {})).slice(0, 4).map(([mood, count]) => <p key={mood}><i />{moodLabel[mood] ?? mood}<b>{count}</b></p>)}</div>
            </div>
          </article>

          <article className="chart-card">
            <div className="chart-heading"><div><small>So sánh</small><h2>Ngủ qua các lần ghi</h2></div></div>
            <div className="bar-chart">{observations.slice(-10).map((item) => <div key={item.id} title={`${item.date} ${item.time}: ${item.sleepHours}h`}><span style={{ height: `${Math.min(item.sleepHours / 12 * 100, 100)}%` }} /><small>{range === "day" ? item.time : item.date.slice(8)}</small></div>)}</div>
          </article>

          <article className="chart-card chart-card--wide">
            <div className="chart-heading"><div><small>Chi tiết</small><h2>Dòng thời gian ghi nhận</h2></div><Link href={`/analysis?childId=${childId}`}>+ Ghi nhận mới</Link></div>
            <div className="data-timeline">
              {observations.length ? observations.slice().reverse().map((item) => <div key={item.id}><time><strong>{item.time}</strong><small>{item.date}</small></time><i /><section><span className={`mood-tag mood-tag--${item.mood}`}>{moodLabel[item.mood] ?? item.mood}</span><p>Ngủ {item.sleepHours}h · Tương tác {item.socialInteraction === "high" ? "tốt" : item.socialInteraction === "medium" ? "vừa" : "thấp"} · Tập trung {item.focus === "high" ? "tốt" : item.focus === "medium" ? "vừa" : "thấp"}</p>{item.note && <small>{item.note}</small>}</section></div>) : <p className="no-chart">Chưa có dữ liệu trong khoảng này.</p>}
            </div>
          </article>
        </section>

        <section className="dashboard-actions">
          <div><span>✦</span><h2>Cần một góc nhìn chuyên môn?</h2><p>Mang theo bản tóm tắt 30 ngày để buổi trao đổi hiệu quả hơn.</p></div>
          <div><a className="button button--ghost" href={`/api/report?childId=${childId}`}>Tải bản tóm tắt ↓</a><Link className="button button--primary" href={`/expert?childId=${childId}&date=${new Date().toLocaleDateString("en-CA")}`}>Tìm chuyên gia →</Link></div>
        </section>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return <Suspense fallback={<main className="dashboard-page" />}><DashboardContent /></Suspense>;
}
