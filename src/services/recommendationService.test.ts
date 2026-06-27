import { mapAgentRecommendation } from './recommendationService';

describe('mapAgentRecommendation', () => {
  it('성공 응답을 추천 모델로 변환한다', () => {
    const result = mapAgentRecommendation({
      status: 'success',
      message: '추천 완료',
      recommendations: [
        {
          item_id: '6081171',
          source: 'musinsa',
          item_name: '오버핏 반팔티',
          brand: '모즈모즈',
          category: '상의',
          image_url: 'https://image.msscdn.net/a.jpg',
          product_url: 'https://www.musinsa.com/products/6081171',
          price: 54400,
          reason: '잘 어울려요',
        },
      ],
      style_guide: { summary: '맞춤 코디', tips: ['팁1', '팁2'] },
    });

    expect(result.title).toBe('맞춤 코디');
    expect(result.summary).toContain('추천 완료');
    expect(result.summary).toContain('팁1');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].product?.brand).toBe('모즈모즈');
    expect(result.items[0].product?.price).toBe(54400);
    expect(result.items[0].product?.imageUrl).toBe('https://image.msscdn.net/a.jpg');
    expect(result.tags).toContain('상의');
  });

  it('style_guide가 없으면 message를 title로 쓰고 누락 필드를 보완한다', () => {
    const result = mapAgentRecommendation({
      status: 'success',
      message: '기본 추천',
      recommendations: [
        {
          item_id: null,
          source: 'closet',
          item_name: null,
          brand: null,
          category: null,
          image_url: 'https://example.com/x.jpg',
          product_url: null,
          price: null,
          reason: '옷장 매칭',
        },
      ],
      style_guide: null,
    });

    expect(result.title).toBe('기본 추천');
    expect(result.items[0].id).toContain('closet');
    expect(result.items[0].name).toBe('추천 아이템');
  });
});
