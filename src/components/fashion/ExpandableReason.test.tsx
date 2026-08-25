import { Text } from 'react-native';
import renderer, { type ReactTestInstance } from 'react-test-renderer';
import { ExpandableReason } from './ExpandableReason';

const REASON =
  '검은 재킷의 각진 어깨선과 대비되도록 밑단이 넓은 슬랙스를 골랐습니다. 톤을 낮춘 회색이라 상의가 강해도 부딪히지 않습니다.';

function render(element: React.ReactElement): renderer.ReactTestRenderer {
  let tree!: renderer.ReactTestRenderer;
  renderer.act(() => {
    tree = renderer.create(element);
  });
  return tree;
}

function texts(tree: renderer.ReactTestRenderer): ReactTestInstance[] {
  return tree.root.findAllByType(Text);
}

/** 화면에 실제로 보이는 문단. 측정용 사본은 aria-hidden으로 구분한다. */
function visibleParagraph(tree: renderer.ReactTestRenderer): ReactTestInstance {
  return texts(tree).find((node) => node.props.numberOfLines !== undefined || !node.props['aria-hidden'])!;
}

function probe(tree: renderer.ReactTestRenderer): ReactTestInstance | undefined {
  return texts(tree).find((node) => node.props['aria-hidden']);
}

function link(tree: renderer.ReactTestRenderer): ReactTestInstance | undefined {
  return tree.root.findAll(
    (node) =>
      node.props.accessibilityRole === 'button' &&
      typeof node.props.accessibilityLabel === 'string' &&
      node.props.accessibilityLabel.includes('추천 이유'),
  )[0];
}

function label(tree: renderer.ReactTestRenderer): string | undefined {
  return texts(tree)
    .map((node) => String(node.props.children))
    .find((value) => value === '더보기' || value === '접기');
}

/** onLayout을 흉내 낸다. 접힌 문단과 전체 사본의 높이를 각각 알려준다. */
function measure(tree: renderer.ReactTestRenderer, collapsed: number, full: number) {
  const paragraph = visibleParagraph(tree);
  const hidden = probe(tree);
  renderer.act(() => {
    paragraph.props.onLayout({ nativeEvent: { layout: { height: collapsed } } });
    hidden?.props.onLayout({ nativeEvent: { layout: { height: full } } });
  });
}

function mount() {
  return render(<ExpandableReason text={REASON} collapsedLines={3} textStyle={{ fontSize: 11 }} />);
}

describe('ExpandableReason', () => {
  it('shows no link before the text has been measured', () => {
    // 재기 전에 링크를 띄우면 짧은 문장에서도 한 번 깜빡인다.
    expect(link(mount())).toBeUndefined();
  });

  it('shows no link when the text already fits', () => {
    const tree = mount();

    measure(tree, 48, 48);

    expect(link(tree)).toBeUndefined();
  });

  it('offers 더보기 when the text is cut off', () => {
    const tree = mount();

    measure(tree, 48, 96);

    expect(label(tree)).toBe('더보기');
  });

  it('ignores a sub-pixel height difference', () => {
    // 반올림 오차로 한 줄짜리 문장에 링크가 붙으면 안 된다.
    const tree = mount();

    measure(tree, 48, 48.5);

    expect(link(tree)).toBeUndefined();
  });

  it('unclamps the paragraph when 더보기 is pressed', () => {
    const tree = mount();
    measure(tree, 48, 96);

    expect(visibleParagraph(tree).props.numberOfLines).toBe(3);
    renderer.act(() => link(tree)!.props.onPress());

    expect(visibleParagraph(tree).props.numberOfLines).toBeUndefined();
    expect(label(tree)).toBe('접기');
  });

  it('clamps it again when 접기 is pressed', () => {
    const tree = mount();
    measure(tree, 48, 96);
    renderer.act(() => link(tree)!.props.onPress());

    renderer.act(() => link(tree)!.props.onPress());

    expect(visibleParagraph(tree).props.numberOfLines).toBe(3);
    expect(label(tree)).toBe('더보기');
  });

  it('drops the measuring copy once the answer is known', () => {
    // 사본을 계속 그리면 카드마다 문단을 두 번씩 배치하게 된다.
    const tree = mount();
    expect(probe(tree)).toBeDefined();

    measure(tree, 48, 96);

    expect(probe(tree)).toBeUndefined();
  });

  it('keeps the measuring copy out of the accessibility tree', () => {
    // 스크린 리더가 같은 문장을 두 번 읽으면 안 된다.
    expect(probe(mount())!.props['aria-hidden']).toBe(true);
  });

  it('re-measures when the card is reused for another item', () => {
    const tree = mount();
    measure(tree, 48, 96);
    expect(label(tree)).toBe('더보기');

    renderer.act(() => {
      tree.update(
        <ExpandableReason text="짧은 이유." collapsedLines={3} textStyle={{ fontSize: 11 }} />,
      );
    });

    expect(link(tree)).toBeUndefined();
    expect(probe(tree)).toBeDefined();
  });
});

describe('ExpandableReason on resize', () => {
  function container(tree: renderer.ReactTestRenderer): ReactTestInstance {
    return tree.root.findAll((node) => typeof node.props.onLayout === 'function')[0];
  }

  function resize(tree: renderer.ReactTestRenderer, width: number) {
    renderer.act(() => {
      container(tree).props.onLayout({ nativeEvent: { layout: { width, height: 48 } } });
    });
  }

  it('measures again when the card gets wider', () => {
    // 좁을 때 잘렸어도 넓어지면 다 들어갈 수 있다.
    const tree = mount();
    resize(tree, 140);
    measure(tree, 48, 96);
    expect(label(tree)).toBe('더보기');

    resize(tree, 320);

    expect(link(tree)).toBeUndefined();
    expect(probe(tree)).toBeDefined();
  });

  it('keeps the answer when the width has not moved', () => {
    const tree = mount();
    resize(tree, 140);
    measure(tree, 48, 96);

    resize(tree, 140);

    expect(label(tree)).toBe('더보기');
  });

  it('does not collapse a paragraph the reader has opened', () => {
    const tree = mount();
    resize(tree, 140);
    measure(tree, 48, 96);
    renderer.act(() => link(tree)!.props.onPress());

    resize(tree, 320);

    expect(label(tree)).toBe('접기');
  });
});
