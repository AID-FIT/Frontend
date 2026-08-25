// 내정보와 온보딩이 같은 선택지를 보여줘야 한다. 두 화면이 각자 배열을 들고
// 있으면 한쪽만 고쳐도 티가 나지 않으므로 여기 한 벌만 둔다.

export const ageOptions = ['10대', '20대', '30대', '40대 이상'] as const;

export const styleOptions = ['캐주얼', '미니멀', '스트릿', '포멀', '스포티'] as const;

/** 화면에는 한국어로, 서버에는 카탈로그가 쓰는 값으로 보낸다. */
export const genderOptions = [
  { label: '남성', value: 'men' },
  { label: '여성', value: 'women' },
  { label: '공용', value: 'unisex' },
] as const;

export type GenderValue = (typeof genderOptions)[number]['value'];

export function genderLabel(value: string | null | undefined): string | null {
  return genderOptions.find((option) => option.value === value)?.label ?? null;
}

// 백엔드의 CHECK 제약(ck_user_preferences_height_cm)과 같은 범위.
export const MIN_HEIGHT_CM = 100;
export const MAX_HEIGHT_CM = 250;

/**
 * 입력한 키를 서버에 보낼 값으로 바꾼다.
 * 비우면 `null`(설정 안 함), 숫자가 아니거나 범위를 벗어나면 `'invalid'`.
 */
export function parseHeight(raw: string): number | null | 'invalid' {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  if (!/^\d+$/.test(trimmed)) {
    return 'invalid';
  }

  const height = Number(trimmed);
  return height >= MIN_HEIGHT_CM && height <= MAX_HEIGHT_CM ? height : 'invalid';
}

export const HEIGHT_ERROR_MESSAGE = `키는 ${MIN_HEIGHT_CM}~${MAX_HEIGHT_CM} 사이의 숫자로 입력해 주세요.`;
