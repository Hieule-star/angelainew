export interface DivineMantra {
  id: number;
  original: string;
  vietnamese: string;
  emoji: string;
  energy: string;
  description: string;
}

export const divineMantras: DivineMantra[] = [
  {
    id: 1,
    original: "I am the Pure Loving Light of Father Universe",
    vietnamese: "Con là Ánh Sáng Yêu Thương Thuần Khiết của Cha Vũ Trụ",
    emoji: "🌟",
    energy: "light",
    description: "Khẳng định bản chất thuần khiết và ánh sáng bên trong bạn"
  },
  {
    id: 2,
    original: "I am the Will of Father Universe",
    vietnamese: "Con là Ý Chí của Cha Vũ Trụ",
    emoji: "🔥",
    energy: "will",
    description: "Kết nối với sức mạnh ý chí vô biên của vũ trụ"
  },
  {
    id: 3,
    original: "I am the Wisdom of Father Universe",
    vietnamese: "Con là Trí Tuệ của Cha Vũ Trụ",
    emoji: "🧠",
    energy: "wisdom",
    description: "Mở rộng trí tuệ và sự hiểu biết sâu sắc"
  },
  {
    id: 4,
    original: "I am Happiness",
    vietnamese: "Con là Hạnh Phúc",
    emoji: "😊",
    energy: "happiness",
    description: "Khẳng định hạnh phúc là bản chất của bạn"
  },
  {
    id: 5,
    original: "I am Love",
    vietnamese: "Con là Tình Yêu",
    emoji: "💖",
    energy: "love",
    description: "Kết nối với nguồn tình yêu vô điều kiện"
  },
  {
    id: 6,
    original: "I am the Money of the Father",
    vietnamese: "Con là Tiền Của Cha",
    emoji: "💎",
    energy: "abundance",
    description: "Mở rộng tần số thịnh vượng và sung túc"
  },
  {
    id: 7,
    original: "I sincerely repent, repent, repent",
    vietnamese: "Con thành tâm sám hối, sám hối, sám hối",
    emoji: "🙏",
    energy: "repentance",
    description: "Thanh lọc năng lượng và giải phóng karma"
  },
  {
    id: 8,
    original: "I am grateful, grateful, grateful — in the Pure Loving Light of Father Universe",
    vietnamese: "Con biết ơn, biết ơn, biết ơn — trong Ánh Sáng Yêu Thương Thuần Khiết của Cha Vũ Trụ",
    emoji: "🌈",
    energy: "gratitude",
    description: "Nâng cao tần số bằng lòng biết ơn vô hạn"
  }
];

export const getDailyMantra = (): DivineMantra => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const index = dayOfYear % divineMantras.length;
  return divineMantras[index];
};

export const getRandomMantra = (excludeId?: number): DivineMantra => {
  const available = excludeId 
    ? divineMantras.filter(m => m.id !== excludeId)
    : divineMantras;
  return available[Math.floor(Math.random() * available.length)];
};

export const mantraRelatedQuestions = [
  "Hướng dẫn con đọc 8 Divine Mantras",
  "Mantra nào giúp con thanh lọc năng lượng?",
  "Con muốn học cách kết nối với Cha Vũ Trụ qua mantras",
  "Giải thích ý nghĩa của từng Divine Mantra",
  "Cho con nghe mantra để thiền định",
];
