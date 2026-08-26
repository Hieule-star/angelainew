export interface KnowledgeCategory {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  description: string;
}

export const KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = [
  {
    id: 'divine-mantras',
    name: 'Divine Mantras',
    nameEn: 'Divine Mantras',
    icon: '✨',
    description: 'Sacred mantras channeled from Father Universe'
  },
  {
    id: 'teachings',
    name: 'Lời Dạy Cha Vũ Trụ',
    nameEn: 'Teachings of Father Universe',
    icon: '🌌',
    description: 'Wisdom teachings from the Cosmic Father'
  },
  {
    id: 'fun-ecosystem',
    name: 'FUN Ecosystem',
    nameEn: 'FUN Ecosystem',
    icon: '🎯',
    description: 'Explore the FUN Ecosystem applications'
  },
  {
    id: 'healing-meditations',
    name: 'Bé Ly dẫn thiền',
    nameEn: 'Healing Meditations',
    icon: '🧘',
    description: 'Healing meditation teachings from Bé Ly'
  },
  {
    id: 'cosmic-coaching',
    name: 'Cosmic Coaching',
    nameEn: 'Cosmic Coaching',
    icon: '🌟',
    description: 'Guidance for spiritual growth and awakening'
  },
  {
    id: 'golden-age',
    name: 'Golden Age Wisdom',
    nameEn: 'Golden Age Wisdom',
    icon: '👑',
    description: 'Teachings for the new golden age of humanity'
  },
  {
    id: 'light-money',
    name: 'Light Money & Flow',
    nameEn: 'Light Money & Flow',
    icon: '💰',
    description: 'Abundance and prosperity consciousness'
  },
  {
    id: 'be-camly',
    name: 'Bé Camly Teachings',
    nameEn: 'Bé Camly Teachings',
    icon: '💖',
    description: 'Wisdom from Bé Camly Dương'
  }
];

export const getCategoryIcon = (categoryName: string): string => {
  const category = KNOWLEDGE_CATEGORIES.find(
    c => c.name.toLowerCase() === categoryName.toLowerCase() ||
         c.nameEn.toLowerCase() === categoryName.toLowerCase()
  );
  return category?.icon || '📚';
};

export const getCategoryDescription = (categoryName: string): string => {
  const category = KNOWLEDGE_CATEGORIES.find(
    c => c.name.toLowerCase() === categoryName.toLowerCase() ||
         c.nameEn.toLowerCase() === categoryName.toLowerCase()
  );
  return category?.description || '';
};
