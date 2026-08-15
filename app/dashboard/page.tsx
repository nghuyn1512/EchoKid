"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

type DashboardData = {
  todayLogSubmitted: boolean;
  streakDays: number;
  lastRecommendation: { id: string; activityTitle: string; date: string } | null;
  quickStats7d: { meltdownAvg: number; sleepAvgHours: number };
};

type Range = "day" | "week" | "month";
type ProgressObservation = { id: string; date: string; time: string; mood: string; sleepHours: number; meltdownCount: number };
type ProgressData = {
  summary: { logsSubmitted: number; meltdownTrend: "increasing" | "decreasing" | "stable"; sleepAvgHours: number; activitiesCompleted: number };
  observations: ProgressObservation[];
};

const moodScores: Record<string, number> = { withdrawn: 1, anxious: 2, irritable: 2, calm: 4, happy: 5 };
const rangeLabels: Record<Range, string> = { day: "Hôm nay", week: "7 ngày", month: "30 ngày" };

type IconName = "spark" | "calendar" | "moon" | "heart" | "arrow" | "check";

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    spark: <><path d="m12 3 1.7 6.3L20 11l-6.3 1.7L12 19l-1.7-6.3L4 11l6.3-1.7L12 3Z" /><path d="m19 17 .6 2.4L22 20l-2.4.6L19 23l-.6-2.4L16 20l2.4-.6L19 17Z" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
    moon: <path d="M20 15.2A8.5 8.5 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2Z" />,
    heart: <path d="M20.8 5.8a5.4 5.4 0 0 0-7.6 0L12 7l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 22l8.8-8.6a5.4 5.4 0 0 0 0-7.6Z" />,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function DashboardContent() {
  const childId = useSearchParams().get("childId");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState<Range>("week");
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [progressLoading, setProgressLoading] = useState(true);

  const loadDashboard = useCallback(async (signal?: AbortSignal) => {
    if (!childId) return;
    await Promise.resolve();
    if (signal?.aborted) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/dashboard?childId=${encodeURIComponent(childId)}`, { signal });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Không thể tải dashboard");
      setData(payload);
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      setError("Chưa thể tải dữ liệu hôm nay. Bạn thử lại nhé.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    if (!childId) return;
    const controller = new AbortController();
    fetch(`/api/dashboard/progress?childId=${encodeURIComponent(childId)}&range=${range}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Không thể tải tiến trình");
        return payload as ProgressData;
      })
      .then(setProgress)
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setProgress(null);
      })
      .finally(() => { if (!controller.signal.aborted) setProgressLoading(false); });
    return () => controller.abort();
  }, [childId, range]);

  const visibleObservations = useMemo(() => (progress?.observations ?? []).slice(-12), [progress]);
  const emotionPoints = visibleObservations.length > 1
    ? visibleObservations.map((item, index) => `${(index / (visibleObservations.length - 1)) * 100},${100 - (moodScores[item.mood] ?? 3) * 18}`).join(" ")
    : "";
  const allProgressObservations = progress?.observations ?? [];
  const positiveRate = allProgressObservations.length
    ? Math.round(allProgressObservations.filter((item) => ["happy", "calm"].includes(item.mood) && item.meltdownCount === 0).length / allProgressObservations.length * 100)
    : 0;

  useEffect(() => {
    if (!childId) return;
    const controller = new AbortController();
    fetch(`/api/dashboard?childId=${encodeURIComponent(childId)}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Không thể tải dashboard");
        return payload as DashboardData;
      })
      .then((payload) => { setData(payload); setError(""); })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError("Chưa thể tải dữ liệu hôm nay. Bạn thử lại nhé.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [childId]);

  if (!childId) {
    return <main className="dashboard-page"><div className="dashboard-shell"><section className="empty-state"><span>♡</span><h1>Hôm nay mình đồng hành cùng ai?</h1><p>Chọn hồ sơ của bé để xem nhịp chăm sóc trong ngày.</p><Link className="button button--primary" href="/children">Chọn hồ sơ bé</Link></section></div></main>;
  }

  const encodedChildId = encodeURIComponent(childId);
  const todayHref = `/daily-log?childId=${encodedChildId}`;

  return (
    <main className="dashboard-page home-dashboard">
      <div className="dashboard-shell">
        <header className="home-dashboard__header">
          <div><span className="eyebrow"><i /> Tổng quan hôm nay</span><h1>Mỗi ngày một chút,<br /><em>hiểu con thêm nhiều.</em></h1><p>Một góc nhỏ để ba mẹ theo dõi nhịp sinh hoạt và tiếp tục đồng hành cùng con.</p></div>
          <div className="home-dashboard__date"><Icon name="calendar" /><span><small>Hôm nay</small><strong>{new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "long" }).format(new Date())}</strong></span></div>
        </header>

        {error && <div className="dashboard-error" role="alert"><span>{error}</span><button type="button" onClick={() => void loadDashboard()}>Thử lại</button></div>}

        <section className="home-dashboard__grid" aria-busy={loading}>
          <article className={`today-checkin ${data?.todayLogSubmitted ? "is-complete" : ""}`}>
            <div className="today-checkin__top"><span className="home-card-icon"><Icon name={data?.todayLogSubmitted ? "check" : "heart"} /></span><span className="today-checkin__status">{loading ? "Đang kiểm tra..." : data?.todayLogSubmitted ? "Đã hoàn thành hôm nay" : "Chưa ghi nhận hôm nay"}</span></div>
            <div className="today-checkin__copy"><small>Khoảnh khắc hiện tại</small><h2>{data?.todayLogSubmitted ? "Cảm ơn ba mẹ đã lắng nghe con." : "Hôm nay bé cảm thấy thế nào?"}</h2><p>{data?.todayLogSubmitted ? "Bạn vẫn có thể thêm một ghi nhận mới khi cảm xúc hoặc hành vi của bé thay đổi." : "Chỉ vài phút ghi nhận sẽ giúp những gợi ý dành cho bé sát với thực tế hơn."}</p></div>
            <Link className="button button--primary" href={todayHref}>{data?.todayLogSubmitted ? "Ghi nhận thêm" : "Bắt đầu ghi nhận"}<Icon name="arrow" /></Link>
          </article>

          <div className="home-dashboard__side">
            <article className="streak-card"><div className="streak-card__badge"><span>✦</span><strong>{loading ? "—" : data?.streakDays ?? 0}</strong><small>ngày</small></div><div><small>Chuỗi đồng hành</small><h2>{(data?.streakDays ?? 0) > 0 ? "Mình đang làm rất tốt!" : "Bắt đầu chuỗi hôm nay"}</h2><p>Mỗi ghi nhận đều là một bước nhỏ để hiểu con hơn.</p></div></article>
            <article className="recommendation-card">
              <span className="home-card-icon home-card-icon--aqua"><Icon name="spark" /></span>
              <div><small>Gợi ý gần nhất</small><h2>{loading ? "Đang tải gợi ý..." : data?.lastRecommendation?.activityTitle ?? "Chưa có hoạt động được gợi ý"}</h2>{data?.lastRecommendation ? <p>Từ ghi nhận ngày {new Intl.DateTimeFormat("vi-VN").format(new Date(`${data.lastRecommendation.date}T00:00:00`))}</p> : <p>Hoàn tất ghi nhận để nhận gợi ý phù hợp cho bé.</p>}</div>
              {!loading && (data?.lastRecommendation
                ? <Link className="recommendation-card__action" href={`/recommendation?childId=${encodedChildId}&observationId=${encodeURIComponent(data.lastRecommendation.id)}`}>Xem chi tiết gợi ý <Icon name="arrow" /></Link>
                : <Link className="recommendation-card__action" href={todayHref}>Tạo gợi ý đầu tiên <Icon name="arrow" /></Link>)}
            </article>
          </div>
        </section>

        <section className="home-dashboard__stats">
          <div className="home-dashboard__section-title"><div><small>7 ngày gần đây</small><h2>Một nhịp nhìn thật nhẹ nhàng</h2></div><Link href={todayHref}>Ghi nhận mới <Icon name="arrow" /></Link></div>
          <div className="quick-stat-grid">
            <article><span className="home-card-icon home-card-icon--cream"><Icon name="moon" /></span><div><small>Giấc ngủ trung bình</small><strong>{loading ? "—" : `${data?.quickStats7d.sleepAvgHours ?? 0} giờ`}</strong><p>Mỗi ngày có ghi nhận</p></div></article>
            <article><span className="home-card-icon home-card-icon--pink"><Icon name="heart" /></span><div><small>Số lần khủng hoảng</small><strong>{loading ? "—" : data?.quickStats7d.meltdownAvg ?? 0}</strong><p>Trung bình mỗi ngày</p></div></article>
            <article className="quick-stat-cta"><div><small>Tiếp tục hành trình</small><strong>Quan sát đều, thấu hiểu sâu.</strong></div><Link href={todayHref} aria-label="Ghi nhận mới"><Icon name="arrow" /></Link></article>
          </div>
        </section>

        <section className="progress-overview" aria-busy={progressLoading}>
          <header className="progress-overview__header">
            <div><span className="eyebrow"><i /> Thay đổi theo thời gian</span><h2>Nhìn thấy nhịp của con,<br /><em>không chỉ những con số.</em></h2><p>So sánh cảm xúc, giấc ngủ và các lần meltdown trong khoảng ba mẹ muốn quan sát.</p></div>
            <div className="range-switch" aria-label="Chọn khoảng thời gian">{(["day", "week", "month"] as Range[]).map((item) => <button type="button" key={item} className={range === item ? "is-active" : ""} aria-pressed={range === item} onClick={() => { setProgressLoading(true); setRange(item); }}>{rangeLabels[item]}</button>)}</div>
          </header>

          <div className="progress-summary-grid">
            <article><small>Lần quan sát</small><strong>{progressLoading ? "—" : allProgressObservations.length}</strong><p>Trong {rangeLabels[range].toLowerCase()}</p></article>
            <article><small>Khoảnh khắc ổn định</small><strong>{progressLoading ? "—" : `${positiveRate}%`}</strong><p>Bình tĩnh/vui và không meltdown</p></article>
            <article><small>Ngủ trung bình</small><strong>{progressLoading ? "—" : `${progress?.summary.sleepAvgHours ?? 0}h`}</strong><p>Trong khoảng đã chọn</p></article>
            <article><small>Xu hướng meltdown</small><strong className={`trend trend--${progress?.summary.meltdownTrend ?? "stable"}`}>{progressLoading ? "—" : progress?.summary.meltdownTrend === "increasing" ? "Tăng" : progress?.summary.meltdownTrend === "decreasing" ? "Giảm" : "Ổn định"}</strong><p>So với nửa đầu khoảng</p></article>
          </div>

          <div className="progress-chart-grid">
            <article className="progress-chart-card progress-chart-card--emotion">
              <div className="progress-chart-title"><div><small>Cảm xúc</small><h3>Nhịp cảm xúc</h3></div><span>● Tích cực hơn</span></div>
              {emotionPoints ? <div className="emotion-chart"><div className="emotion-axis"><span>Vui</span><span>Bình tĩnh</span><span>Khó chịu</span><span>Thu mình</span></div><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Biểu đồ thay đổi cảm xúc"><defs><linearGradient id="emotion-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#41c8c1" stopOpacity=".38"/><stop offset="1" stopColor="#41c8c1" stopOpacity="0"/></linearGradient></defs><polygon points={`0,100 ${emotionPoints} 100,100`} fill="url(#emotion-area)"/><polyline points={emotionPoints} fill="none" stroke="#36aaa4" strokeWidth="2.5" vectorEffect="non-scaling-stroke"/></svg><div className="progress-labels">{visibleObservations.map((item) => <span key={item.id}>{range === "day" ? item.time : item.date.slice(5)}</span>)}</div></div> : <div className="progress-empty">Cần ít nhất hai lần ghi nhận để hiển thị đường thay đổi cảm xúc.</div>}
            </article>

            <article className="progress-chart-card">
              <div className="progress-chart-title"><div><small>Sinh hoạt & dấu hiệu</small><h3>Ngủ và meltdown</h3></div></div>
              {visibleObservations.length ? <div className="dual-bars">{visibleObservations.map((item) => <div className="dual-bars__item" key={item.id}><div className="dual-bars__plot"><i style={{ height: `${Math.min(item.sleepHours / 12 * 100, 100)}%` }} title={`Ngủ ${item.sleepHours} giờ`} /><b style={{ height: `${Math.min(item.meltdownCount / 4 * 100, 100)}%` }} title={`${item.meltdownCount} lần meltdown`} /></div><small>{range === "day" ? item.time : item.date.slice(5)}</small></div>)}</div> : <div className="progress-empty">Chưa có dữ liệu trong khoảng này.</div>}
              <div className="bar-legend"><span><i /> Giờ ngủ</span><span><b /> Meltdown</span></div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return <Suspense fallback={<main className="dashboard-page home-dashboard"><div className="dashboard-shell"><div className="dashboard-skeleton" /></div></main>}><DashboardContent /></Suspense>;
}
