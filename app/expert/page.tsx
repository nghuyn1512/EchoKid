"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Expert = { id: number; name: string; specialty: string; hospital: string; experience: string; location: string; image: string; description: string };

function ExpertContent() {
  const params = useSearchParams();
  const childId = params.get("childId");
  const date = params.get("date") ?? new Date().toLocaleDateString("en-CA");
  const [experts, setExperts] = useState<Expert[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [contact, setContact] = useState("");
  const [slot, setSlot] = useState("Sáng · 08:00–11:00");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/expert").then((res) => res.json()).then((items) => { setExperts(items); setSelected(items[0]?.id ?? null); });
  }, []);

  async function book() {
    if (!childId || !selected) return;
    setLoading(true); setMessage("");
    const response = await fetch("/api/expert", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId, date, note: `${note}\nLiên hệ: ${contact}\nKhung giờ: ${slot}`, expertId: selected }),
    });
    const data = await response.json();
    setMessage(response.ok ? data.message : data.error);
    setLoading(false);
  }

  if (!childId) return <main className="flow-page"><div className="flow-shell"><section className="empty-state"><h1>Chọn bé trước khi đặt lịch</h1><Link href="/children" className="button button--primary">Chọn hồ sơ</Link></section></div></main>;

  return (
    <main className="expert-page">
      <div className="expert-shell">
        <header className="expert-hero">
          <div><span className="eyebrow"><i /> Kết nối chuyên môn</span><h1>Thêm một người<br /><em>cùng hiểu con.</em></h1><p>Chọn chuyên gia phù hợp và chuẩn bị sẵn dữ liệu để buổi tư vấn đi thẳng vào điều quan trọng.</p></div>
          <aside><span>▤</span><div><small>Hồ sơ trao đổi</small><strong>Đã sẵn sàng</strong><p>Tổng hợp tự động từ 30 ngày gần nhất.</p></div><a href={`/api/report?childId=${childId}`}>Tải file ↓</a></aside>
        </header>

        <section className="booking-layout">
          <div className="expert-list">
            <div className="section-mini-heading"><span>01</span><div><h2>Chọn chuyên gia</h2><p>Danh sách gợi ý dựa trên nhu cầu phát triển của trẻ.</p></div></div>
            {experts.map((expert) => <button key={expert.id} className={selected === expert.id ? "expert-card is-selected" : "expert-card"} onClick={() => setSelected(expert.id)}>
              <span className="doctor-avatar" aria-label={`Ảnh đại diện ${expert.name}`}>
                <svg viewBox="0 0 100 120" aria-hidden="true">
                  <circle cx="50" cy="37" r="22" />
                  <path d="M13 112c2-34 15-50 37-50s35 16 37 50" />
                </svg>
              </span>
              <div><span className="verified">✓ Đã xác minh</span><h3>{expert.name}</h3><strong>{expert.specialty}</strong><p>{expert.hospital} · {expert.location}</p><small>{expert.description}</small><b>{expert.experience} kinh nghiệm</b></div>
              <i>{selected === expert.id ? "✓" : "○"}</i>
            </button>)}
          </div>

          <aside className="booking-form">
            <div className="section-mini-heading"><span>02</span><div><h2>Thông tin buổi hẹn</h2><p>Chuyên gia sẽ liên hệ để xác nhận.</p></div></div>
            <label>Ngày mong muốn<input type="date" value={date} readOnly /></label>
            <label>Khung giờ thuận tiện<select value={slot} onChange={(e) => setSlot(e.target.value)}><option>Sáng · 08:00–11:00</option><option>Chiều · 13:30–17:00</option><option>Tối · 18:00–20:00</option></select></label>
            <label>Điện thoại hoặc email<input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Thông tin để chuyên gia liên hệ" /></label>
            <label>Điều ba mẹ muốn trao đổi<textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: Bé gần đây thường thu mình vào buổi chiều..." /></label>
            <div className="report-attach"><span>▤</span><div><strong>Bản tóm tắt EchoKid</strong><small>File .txt · 30 ngày gần nhất</small></div><a href={`/api/report?childId=${childId}`}>Tải</a></div>
            <button className="button button--primary" onClick={book} disabled={loading || !selected}>{loading ? "Đang gửi..." : "Gửi yêu cầu đặt lịch"} <span>→</span></button>
            {message && <p className="booking-message">{message}</p>}
            <small className="privacy-note">🔒 Thông tin chỉ được chia sẻ với chuyên gia ba mẹ chọn.</small>
          </aside>
        </section>
      </div>
    </main>
  );
}

export default function ExpertPage() {
  return <Suspense fallback={<main className="expert-page" />}><ExpertContent /></Suspense>;
}
