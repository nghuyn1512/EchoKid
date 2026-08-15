"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Child = { id: string; name: string; ageMonths: number; gender: string };
type AgeUnit = "months" | "years";

function formatAge(ageMonths: number) {
  if (ageMonths < 12) return `${ageMonths} tháng`;
  const years = Math.floor(ageMonths / 12);
  const months = ageMonths % 12;
  return months ? `${years} tuổi ${months} tháng` : `${years} tuổi`;
}

export default function ChildrenPage() {
  const { status } = useSession();
  const [children, setChildren] = useState<Child[]>([]);
  const [form, setForm] = useState({ name: "", ageMonths: 24, gender: "male" });
  const [ageUnit, setAgeUnit] = useState<AgeUnit>("years");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/children").then((res) => res.json()).then((data) => setChildren(data.children ?? []))
      .catch(() => setError("Không thể tải hồ sơ bé.")).finally(() => setLoading(false));
  }, [status]);

  async function createChild() {
    if (!form.name.trim()) return setError("Ba mẹ hãy nhập tên bé.");
    if (!Number.isFinite(form.ageMonths) || form.ageMonths < 1) return setError("Ba mẹ hãy nhập tuổi hợp lệ cho bé.");
    setCreating(true); setError("");
    const response = await fetch("/api/children", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, diagnosis: { status: "not_evaluated", type: [], diagnosedDate: null }, goals: [] }),
    });
    const data = await response.json();
    if (response.ok) { setChildren((items) => [...items, data.child]); setForm({ name: "", ageMonths: 24, gender: "male" }); setAgeUnit("years"); }
    else setError(data.error || "Không thể tạo hồ sơ.");
    setCreating(false);
  }

  return (
    <main className="flow-page">
      <div className="flow-shell">
        <header className="flow-hero">
          <span className="eyebrow"><i /> Bước khởi đầu</span>
          <h1>Hôm nay mình<br /><em>đồng hành cùng ai?</em></h1>
          <p>Chọn bé để mở không gian AI riêng, bắt đầu ghi nhận và theo dõi hành trình.</p>
        </header>
        <section className="profile-picker">
          <div className="profile-grid">
            {loading ? <p>Đang tải hồ sơ...</p> : children.map((child, index) => (
              <Link key={child.id} href={`/analysis?childId=${child.id}`} className="profile-card">
                <span className={`profile-card__avatar tone-${index % 4}`}>{child.name.slice(0, 1).toUpperCase()}</span>
                <div><h2>{child.name}</h2><p>{formatAge(child.ageMonths)} · {child.gender === "male" ? "Bé trai" : child.gender === "female" ? "Bé gái" : "Khác"}</p></div>
                <span className="profile-card__go">→</span>
              </Link>
            ))}
          </div>
          <div className="create-profile">
            <div><small>Hồ sơ mới</small><h2>Thêm một thành viên nhỏ</h2><p>Thông tin cơ bản giúp AI đưa ra gợi ý phù hợp hơn.</p></div>
            <div className="form-grid">
              <label>Tên bé<input value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} placeholder="Ví dụ: An" /></label>
              <label>Tuổi
                <span className="age-input-group">
                  <input
                    type="number"
                    min={ageUnit === "months" ? 1 : 0.1}
                    max={ageUnit === "months" ? 216 : 18}
                    step={ageUnit === "months" ? 1 : 0.1}
                    value={ageUnit === "months" ? form.ageMonths : Number((form.ageMonths / 12).toFixed(1))}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setForm((current) => ({ ...current, ageMonths: ageUnit === "months" ? value : Math.round(value * 12) }));
                    }}
                  />
                  <select value={ageUnit} aria-label="Đơn vị tuổi" onChange={(e) => setAgeUnit(e.target.value as AgeUnit)}>
                    <option value="months">Tháng tuổi</option>
                    <option value="years">Tuổi</option>
                  </select>
                </span>
              </label>
              <label>Giới tính<select value={form.gender} onChange={(e) => setForm((v) => ({ ...v, gender: e.target.value }))}><option value="male">Bé trai</option><option value="female">Bé gái</option><option value="other">Khác</option></select></label>
            </div>
            <div className="form-footer"><button className="button button--primary" onClick={createChild} disabled={creating}>{creating ? "Đang lưu..." : "Tạo hồ sơ"}</button>{error && <p>{error}</p>}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
