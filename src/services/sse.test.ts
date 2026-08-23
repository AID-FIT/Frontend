import { SseParser } from './sse';

function parse(...chunks: string[]): unknown[] {
  const parser = new SseParser();
  const events = chunks.flatMap((chunk) => parser.push(chunk));
  return [...events, ...parser.flush()];
}

describe('SseParser', () => {
  it('reads a single complete event', () => {
    expect(parse('data: {"type":"step"}\n\n')).toEqual([{ type: 'step' }]);
  });

  it('reads several events arriving in one chunk', () => {
    // 서버가 빠르게 두 단계를 끝내면 한 청크에 붙어 온다.
    expect(parse('data: {"tick":1}\n\ndata: {"tick":2}\n\n')).toEqual([{ tick: 1 }, { tick: 2 }]);
  });

  it('joins an event split across chunks', () => {
    // 네트워크는 이벤트 경계를 지켜 주지 않는다. 그대로 JSON.parse 하면 깨진다.
    expect(parse('data: {"ty', 'pe":"step","label":"찾는 중"}\n\n')).toEqual([
      { type: 'step', label: '찾는 중' },
    ]);
  });

  it('joins an event split exactly on the boundary marker', () => {
    expect(parse('data: {"tick":1}\n', '\ndata: {"tick":2}\n\n')).toEqual([{ tick: 1 }, { tick: 2 }]);
  });

  it('holds an incomplete event until the rest arrives', () => {
    const parser = new SseParser();

    expect(parser.push('data: {"tick":1}')).toEqual([]);
    expect(parser.push('\n\n')).toEqual([{ tick: 1 }]);
  });

  it('emits a trailing event even without the closing blank line', () => {
    // 스트림이 끝날 때 서버가 마지막 빈 줄을 빠뜨리면 결과를 통째로 잃는다.
    expect(parse('data: {"type":"result"}')).toEqual([{ type: 'result' }]);
  });

  it('joins an event written across several data lines', () => {
    expect(parse('data: {"a":\ndata: 1}\n\n')).toEqual([{ a: 1 }]);
  });

  it('ignores comment and field lines that are not data', () => {
    // SSE 규격의 하트비트(: ping)와 event: 필드가 섞여 와도 깨지면 안 된다.
    expect(parse(': ping\n\nevent: message\ndata: {"tick":1}\n\n')).toEqual([{ tick: 1 }]);
  });

  it('skips a malformed event instead of dropping the rest of the stream', () => {
    expect(parse('data: not json\n\ndata: {"tick":2}\n\n')).toEqual([{ tick: 2 }]);
  });

  it('returns nothing for an empty stream', () => {
    expect(parse('')).toEqual([]);
  });

  it('does not re-emit events after a flush', () => {
    const parser = new SseParser();
    parser.push('data: {"tick":1}\n\n');

    expect(parser.flush()).toEqual([]);
  });
});
