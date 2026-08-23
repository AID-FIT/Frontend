/**
 * SSE 본문 파서.
 *
 * 네트워크는 이벤트 경계를 지켜 주지 않는다. `data: {"a":1}\n\n` 하나가 두
 * 청크로 쪼개져 오거나, 여러 이벤트가 한 청크에 붙어 오기도 한다. 청크를
 * 그대로 JSON.parse 하면 두 경우 모두 깨진다. 남은 조각을 들고 있다가
 * 완성된 이벤트만 내보낸다.
 */
export class SseParser {
  private buffer = '';

  /** 새 청크를 받아 그 안에서 완성된 이벤트들을 돌려준다. */
  push(chunk: string): unknown[] {
    this.buffer += chunk;
    const events: unknown[] = [];

    // 이벤트 경계는 빈 줄이다. 마지막 조각은 아직 미완성이라 버퍼에 남긴다.
    let boundary = this.buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const block = this.buffer.slice(0, boundary);
      this.buffer = this.buffer.slice(boundary + 2);

      const payload = parseBlock(block);
      if (payload !== undefined) {
        events.push(payload);
      }
      boundary = this.buffer.indexOf('\n\n');
    }

    return events;
  }

  /** 스트림이 끝났을 때 남아 있는 조각. 서버가 마지막 빈 줄을 빠뜨린 경우다. */
  flush(): unknown[] {
    const rest = this.buffer.trim();
    this.buffer = '';
    if (!rest) {
      return [];
    }
    const payload = parseBlock(rest);
    return payload === undefined ? [] : [payload];
  }
}

function parseBlock(block: string): unknown | undefined {
  // 한 이벤트가 여러 data: 줄로 나뉘어 올 수 있다(SSE 규격). 이어 붙인다.
  const data = block
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice('data:'.length).trim())
    .join('\n');

  if (!data) {
    return undefined;
  }

  try {
    return JSON.parse(data);
  } catch {
    // 깨진 이벤트 하나 때문에 나머지 스트림을 버리지 않는다.
    return undefined;
  }
}
