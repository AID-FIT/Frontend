import { normalizeAssetUrl } from './url';

describe('normalizeAssetUrl', () => {
  it('빈 입력은 null을 반환한다', () => {
    expect(normalizeAssetUrl(null)).toBeNull();
    expect(normalizeAssetUrl(undefined)).toBeNull();
    expect(normalizeAssetUrl('')).toBeNull();
  });

  it('레거시 origin을 설정된 api origin으로 치환한다', () => {
    // 기본 apiBaseUrl origin은 http://127.0.0.1:8000
    expect(normalizeAssetUrl('http://devse.kr:12570/uploads/a.jpg')).toBe(
      'http://127.0.0.1:8000/uploads/a.jpg',
    );
  });

  it('레거시가 아닌 url은 그대로 둔다', () => {
    const external = 'https://image.msscdn.net/images/goods/1.jpg';
    expect(normalizeAssetUrl(external)).toBe(external);
  });
});
