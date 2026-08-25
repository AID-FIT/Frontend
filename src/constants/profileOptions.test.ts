import { genderLabel, MAX_HEIGHT_CM, MIN_HEIGHT_CM, parseHeight } from './profileOptions';

describe('parseHeight', () => {
  it('reads a plausible height', () => {
    expect(parseHeight('175')).toBe(175);
  });

  it('treats an empty box as "not set" rather than an error', () => {
    expect(parseHeight('')).toBeNull();
    expect(parseHeight('   ')).toBeNull();
  });

  it('accepts the ends of the range the server allows', () => {
    expect(parseHeight(String(MIN_HEIGHT_CM))).toBe(MIN_HEIGHT_CM);
    expect(parseHeight(String(MAX_HEIGHT_CM))).toBe(MAX_HEIGHT_CM);
  });

  it('rejects heights outside that range', () => {
    // 서버의 CHECK 제약과 같은 범위다. 저장을 눌러 본 뒤에야 알게 하지 않는다.
    expect(parseHeight('99')).toBe('invalid');
    expect(parseHeight('251')).toBe('invalid');
  });

  it('rejects anything that is not a whole number', () => {
    expect(parseHeight('175cm')).toBe('invalid');
    expect(parseHeight('17.5')).toBe('invalid');
    expect(parseHeight('-175')).toBe('invalid');
  });
});

describe('genderLabel', () => {
  it('shows the stored value in Korean', () => {
    expect(genderLabel('men')).toBe('남성');
    expect(genderLabel('women')).toBe('여성');
    expect(genderLabel('unisex')).toBe('공용');
  });

  it('shows nothing when it was never set', () => {
    expect(genderLabel(null)).toBeNull();
    expect(genderLabel(undefined)).toBeNull();
  });
});
