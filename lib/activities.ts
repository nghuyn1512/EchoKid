import type { Activity } from "@/types/recommendation";

export const ACTIVITIES: Activity[] = [
  {
    id: "act_0091",
    title: "Trò chơi lăn bóng luân phiên",
    targetBehaviors: ["low_social_interaction", "poor_turn_taking"],
    ageRangeMonths: [18, 60],
    durationMinutes: 15,
    frameworkTag: "esdm",
    steps: [
      "Ngồi đối diện con trên sàn, khoảng cách 1-1.5m",
      "Lăn bóng qua lại, gọi tên con trước mỗi lượt lăn",
      "Khen ngợi ngay khi con nhìn hoặc lăn lại bóng",
    ],
  },
  {
    id: "act_0102",
    title: "Hộp cảm giác an toàn (giảm kích thích)",
    targetBehaviors: ["meltdown_linked_to_food_sensitivity", "sensory_overload"],
    ageRangeMonths: [18, 72],
    durationMinutes: 10,
    frameworkTag: "sensory_processing",
    steps: [
      "Chuẩn bị hộp cát/gạo/đậu để con thò tay vào cảm nhận",
      "Ngồi cạnh, mô tả cảm giác bằng lời nhẹ nhàng, không ép con nói theo",
      "Dừng ngay nếu con có dấu hiệu khó chịu hơn",
    ],
  },
  {
    id: "act_0115",
    title: "Mở rộng khẩu vị từng bước nhỏ",
    targetBehaviors: ["food_selectivity"],
    ageRangeMonths: [18, 72],
    durationMinutes: 10,
    frameworkTag: "gradual_exposure",
    steps: [
      "Đặt 1 miếng thức ăn mới cạnh món con đã quen ăn, không ép ăn",
      "Khuyến khích con chỉ cần chạm/ngửi trước, chưa cần ăn",
      "Khen ngợi bất kỳ tương tác nào với món mới, dù chỉ là nhìn",
    ],
  },
  {
    id: "act_0130",
    title: "Gọi tên - quay đầu (tăng phản ứng khi được gọi)",
    targetBehaviors: ["low_response_to_name", "poor_eye_contact"],
    ageRangeMonths: [12, 48],
    durationMinutes: 10,
    frameworkTag: "aba",
    steps: [
      "Gọi tên con ở khoảng cách gần, chờ 3-5 giây",
      "Khi con quay lại (dù chỉ liếc mắt), lập tức khen + đưa đồ chơi yêu thích",
      "Lặp lại 5-6 lần, dừng khi con có dấu hiệu mệt/chán",
    ],
  },
  {
    id: "act_default_calm",
    title: "Hoạt động trấn an nhẹ nhàng (mặc định)",
    targetBehaviors: ["*"], // fallback, dùng khi không có activity nào khớp rõ ràng
    ageRangeMonths: [0, 120],
    durationMinutes: 10,
    frameworkTag: "general",
    steps: [
      "Giảm âm thanh/ánh sáng xung quanh",
      "Ngồi gần con, giữ giọng nói nhẹ nhàng, không ép buộc",
      "Chờ con ổn định rồi mới thử tương tác tiếp",
    ],
  },
];

export function getActivityById(id: string): Activity | undefined {
  return ACTIVITIES.find((a) => a.id === id);
}