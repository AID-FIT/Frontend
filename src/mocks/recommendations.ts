import type { Recommendation } from '../types/fashion';

export const mockRecommendations: Recommendation[] = [
  {
    id: 'r1',
    title: '가볍고 단정한 데이트룩',
    summary:
      '밝은 셔츠와 와이드 데님을 조합해 편안하지만 신경 쓴 느낌을 살렸어요. 낮 일정부터 저녁 약속까지 자연스럽게 어울립니다.',
    tags: ['데이트룩', '캐주얼', '여름 추천'],
    items: [
      {
        id: 'o1',
        category: '상의',
        name: '린넨 오버 셔츠',
        reason: '시원한 소재와 여유 있는 핏이 산뜻한 인상을 줍니다.',
        imageTone: '#f5f7fa',
      },
      {
        id: 'o2',
        category: '하의',
        name: '연청 와이드 데님',
        reason: '셔츠의 단정함을 부담 없이 풀어주는 균형감 있는 아이템입니다.',
        imageTone: 'rgba(0,112,209,0.08)',
      },
      {
        id: 'o3',
        category: '신발',
        name: '화이트 스니커즈',
        reason: '전체 톤을 밝게 정리하고 오래 걸어도 편안합니다.',
        imageTone: '#f3f3f3',
      },
    ],
  },
];
