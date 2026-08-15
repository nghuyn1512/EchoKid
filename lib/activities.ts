import type { Activity } from "@/types/recommendation";
import type { ActivityReferenceKey,ActivityReference } from "@/types/recommendation";
export const ACTIVITY_REFERENCE_CATALOG: Record<ActivityReferenceKey, ActivityReference> = {
      esdm: {
      key: "esdm",
      title: "Early Start Denver Model",
      organization: "Sally Rogers & Geraldine Dawson",
      note: "Phù hợp các hoạt động tương tác tự nhiên, lượt chơi và giao tiếp sớm.",
      },
      aba: {
      key: "aba",
      title: "Applied Behavior Analysis",
      organization: "Behavior Analyst Certification Board",
      note: "Phù hợp khi cần chia nhỏ bước, tăng cường phản hồi và cụ thể hóa kỳ vọng.",
      },
      sensory_regulation: {
      key: "sensory_regulation",
      title: "Sensory Regulation Strategies",
      organization: "Sensory integration practice",
      note: "Phù hợp khi trẻ có dấu hiệu quá tải kích thích hoặc cần ổn định cảm giác.",
      },
      who_cst: {
      key: "who_cst",
      title: "Caregiver Skills Training",
      organization: "World Health Organization",
      note: "Nhấn mạnh cách cha mẹ hỗ trợ trẻ tại nhà bằng các hoạt động gần với sinh hoạt hằng ngày.",
      },
      aap_co_regulation: {
      key: "aap_co_regulation",
      title: "Co-Regulation And Supportive Routines",
      organization: "American Academy of Pediatrics",
      note: "Phù hợp với hoạt động ngắn, an toàn, giúp người lớn đồng điều hòa cùng trẻ.",
      },
      cdc_play: {
      key: "cdc_play",
      title: "Developmental Play And Routines",
      organization: "CDC",
      note: "Phù hợp với hoạt động chơi đơn giản, rõ ràng, dễ áp dụng tại nhà theo từng độ tuổi.",
      },
    };
    