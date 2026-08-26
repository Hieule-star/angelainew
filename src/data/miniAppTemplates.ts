export interface MiniAppTemplate {
  id: string;
  app_type: string;
  title: string;
  emoji: string;
  description: string;
  prompt: string;
}

export const MINI_APP_TEMPLATES: MiniAppTemplate[] = [
  {
    id: "quiz",
    app_type: "quiz",
    title: "Quiz Game",
    emoji: "❓",
    description: "Trắc nghiệm nhiều câu hỏi, tính điểm cuối game.",
    prompt: "Tạo một quiz game 5 câu hỏi về kiến thức chung. Mỗi câu có 4 lựa chọn, chọn đúng cộng điểm, cuối hiển thị tổng điểm + nút Chơi lại.",
  },
  {
    id: "memory",
    app_type: "memory",
    title: "Memory Card",
    emoji: "🃏",
    description: "Lật cặp thẻ giống nhau, rèn trí nhớ.",
    prompt: "Tạo memory card game 4x4 (8 cặp emoji). Người chơi lật 2 thẻ mỗi lượt, ghép đúng sẽ giữ mở. Hiện số lượt và thời gian.",
  },
  {
    id: "clicker",
    app_type: "clicker",
    title: "Clicker",
    emoji: "👆",
    description: "Bấm để tích điểm, mở khoá nâng cấp.",
    prompt: "Tạo clicker game: nhấn nút lớn để +1 điểm. Mỗi 10 điểm mở upgrade x2. Có animation pulse khi click.",
  },
  {
    id: "puzzle",
    app_type: "puzzle",
    title: "Slide Puzzle",
    emoji: "🧩",
    description: "Xếp số 1–15 thành đúng thứ tự.",
    prompt: "Tạo 15-puzzle (sliding puzzle 4x4). Random shuffle, click ô cạnh ô trống để di chuyển. Hiện số bước và thông báo khi giải xong.",
  },
  {
    id: "spin",
    app_type: "spin",
    title: "Spin Wheel",
    emoji: "🎡",
    description: "Quay vòng quay may mắn.",
    prompt: "Tạo spin wheel với 8 ô màu khác nhau (Lucky/Try Again/Bonus/...). Nút Spin sẽ quay 3-5 vòng rồi dừng random, hiện kết quả.",
  },
  {
    id: "breathing",
    app_type: "breathing",
    title: "Meditation Breathing",
    emoji: "🌬️",
    description: "Bài tập thở 4-7-8 với animation.",
    prompt: "Tạo guided breathing app theo nhịp 4-7-8 (hít 4s, giữ 7s, thở 8s). Vòng tròn phình ra/co lại theo nhịp, hiện text 'Hít vào / Giữ / Thở ra'. Nhẹ nhàng, màu pastel xanh-vàng.",
  },
  {
    id: "platformer",
    app_type: "platformer",
    title: "Tiny Platformer",
    emoji: "🦘",
    description: "Nhảy qua chướng ngại bằng phím Space.",
    prompt: "Tạo endless runner đơn giản: nhân vật (emoji) chạy trên mặt đất, nhấn Space để nhảy qua chướng ngại. Hiện điểm = giây sống sót. Game over khi va chạm.",
  },
  {
    id: "reaction",
    app_type: "reaction",
    title: "Reaction Speed",
    emoji: "⚡",
    description: "Đo tốc độ phản xạ tính bằng ms.",
    prompt: "Tạo reaction time tester: màn xanh 'Chờ...' rồi sau 2-5s ngẫu nhiên đổi sang đỏ 'Bấm!'. Đo ms từ lúc đỏ tới khi click. Lưu best score in-memory.",
  },
];
