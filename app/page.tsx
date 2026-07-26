"use client";

import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

const featureCards = [
  { icon: "♡", title: "Ghi nhận nhẹ nhàng", text: "Ghi lại cảm xúc và hành vi nhiều lần trong ngày.", tone: "pink" },
  { icon: "✦", title: "AI đồng hành", text: "Phân tích và gợi ý hành động ngay trên cùng một trang.", tone: "aqua" },
  { icon: "◔", title: "Nhìn thấy tiến bộ", text: "Theo dõi rõ ràng theo giờ, ngày, tuần và tháng.", tone: "cream" },
];

export default function Home() {
  const { data: session } = useSession();
  return (
    <main className="home-page">
      <div className="ambient ambient--one" />
      <div className="ambient ambient--two" />
      <div className="home-shell">
        <section className="hero-card">
          <div className="hero-copy">
            <span className="eyebrow"><i /> Đồng hành cùng con mỗi ngày</span>
            <h1>Hiểu cảm xúc.<br /><em>Nuôi dưỡng kết nối.</em></h1>
            <p>EchoKid giúp ba mẹ ghi nhận những điều nhỏ bé, hiểu thay đổi của con và nhận gợi ý phù hợp cho từng thời điểm.</p>
            <div className="hero-actions">
              {session ? (
                <Link href="/children" className="button button--primary">Chọn bé để bắt đầu <span>→</span></Link>
              ) : (
                <button className="button button--primary" onClick={() => signIn("google")}>Bắt đầu miễn phí <span>→</span></button>
              )}
              <a href="#discover" className="text-link">Khám phá EchoKid <span>↓</span></a>
            </div>
            <div className="trust-row">
              <div className="mini-faces"><span>☺</span><span>●</span><span>♥</span></div>
              <p><strong>Dịu dàng & riêng tư</strong><small>Thiết kế dành cho cả gia đình</small></p>
            </div>
          </div>
          <div className="mood-panel">
            <div className="mood-panel__top"><span>Chào buổi sáng</span><button aria-label="Thông báo">♢</button></div>
            <div className="mood-panel__question"><small>Ngay lúc này</small><h2>Bé cảm thấy<br />thế nào?</h2><p>Một lần chạm để bắt đầu lắng nghe con.</p></div>
            <div className="mood-orbit">
              <span className="mood mood--pink"><img src="/angry.png" alt="Cáu gắt" /></span>
              <span className="mood mood--yellow"><img src="/happy.png" alt="Vui vẻ" /></span>
              <span className="mood mood--purple"><img src="/shy.png" alt="Thu mình" /></span>
              <span className="mood mood--aqua"><img src="/calm.png" alt="Bình tĩnh" /></span>
            </div>
            <div className="mood-label">Vui vẻ</div>
            <div className="listening"><span>≋</span><small>Đang lắng nghe</small></div>
          </div>
        </section>

        <section id="discover" className="features-section">
          <div className="section-heading">
            <div><span className="eyebrow"><i /> Những điều nhỏ tạo nên thay đổi lớn</span><h2>Một nhịp chăm sóc thật <em>nhẹ nhàng</em></h2></div>
            <p>Một luồng liền mạch từ ghi nhận, AI phân tích đến hành động phù hợp cho bé.</p>
          </div>
          <div className="feature-grid">
            {featureCards.map((item, index) => (
              <article key={item.title} className={`feature-card feature-card--${item.tone}`}>
                <span className="feature-card__number">0{index + 1}</span><span className="feature-card__icon">{item.icon}</span>
                <h3>{item.title}</h3><p>{item.text}</p><span className="feature-card__arrow">↗</span>
              </article>
            ))}
          </div>
        </section>

        <section className="welcome-strip">
          <div><span>✦</span><h2>{session ? "Hôm nay mình đồng hành cùng ai?" : "Sẵn sàng hiểu con hơn mỗi ngày?"}</h2><p>Chọn hồ sơ của bé trước khi bắt đầu phiên AI.</p></div>
          {session
            ? <Link href="/children" className="button button--dark">Đến trang chọn bé <span>→</span></Link>
            : <button onClick={() => signIn("google")} className="button button--dark">Đăng nhập với Google <span>→</span></button>}
        </section>
      </div>
    </main>
  );
}
