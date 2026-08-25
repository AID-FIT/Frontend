import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { colors } from '../../constants/colors';
import { fontFamily, fontWeight } from '../../constants/typography';

type ExpandableReasonProps = {
  text: string;
  /** 접혀 있을 때 보여줄 줄 수. */
  collapsedLines: number;
  textStyle: StyleProp<TextStyle>;
  /** 링크 글자 크기를 카드 본문에 맞춘다. */
  linkSize?: number;
};

/**
 * 잘렸을 때만 "더보기"를 붙이는 추천 근거 문단.
 *
 * 줄 수를 세는 `onTextLayout`은 react-native-web에 아예 구현돼 있지 않아
 * 웹에서는 콜백이 오지 않는다(문서 05의 "조용히 무시한다" 사례).
 * 그래서 접힌 문단과 화면 밖 전체 사본의 높이를 재서 비교한다.
 * `onLayout`은 웹·네이티브 양쪽 모두 동작한다.
 */
export function ExpandableReason({
  text,
  collapsedLines,
  textStyle,
  linkSize = 11,
}: ExpandableReasonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  // null이면 아직 재보지 않았다는 뜻. 그동안만 측정용 사본을 그린다.
  const [isTruncated, setIsTruncated] = useState<boolean | null>(null);
  const heights = useRef<{ collapsed?: number; full?: number }>({});
  const measuredWidth = useRef<number | null>(null);

  // 목록에서 카드가 재사용되면 다른 문장이 같은 자리에 온다. 측정을 다시 한다.
  useEffect(() => {
    heights.current = {};
    setIsTruncated(null);
    setIsExpanded(false);
  }, [text]);

  const settle = () => {
    const { collapsed, full } = heights.current;
    if (collapsed === undefined || full === undefined) {
      return;
    }
    // 소수점 단위 오차로 한 줄짜리 문장에 링크가 붙는 것을 막는다.
    setIsTruncated(full > collapsed + 1);
  };

  const measureCollapsed = (event: LayoutChangeEvent) => {
    if (isExpanded || isTruncated !== null) {
      return;
    }
    heights.current.collapsed = event.nativeEvent.layout.height;
    settle();
  };

  const measureFull = (event: LayoutChangeEvent) => {
    heights.current.full = event.nativeEvent.layout.height;
    settle();
  };

  // 폭이 달라지면 몇 줄인지도 달라진다. 창 크기를 바꾸거나 기기를 돌렸을 때
  // 한 번 잰 결과를 그대로 두면, 잘렸는데 링크가 없거나 그 반대가 된다.
  const watchWidth = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    const previous = measuredWidth.current;
    measuredWidth.current = width;

    if (previous === null || Math.abs(previous - width) < 1 || isExpanded) {
      return;
    }
    heights.current = {};
    setIsTruncated(null);
  };

  return (
    <View onLayout={watchWidth}>
      <Text
        style={textStyle}
        numberOfLines={isExpanded ? undefined : collapsedLines}
        onLayout={measureCollapsed}
      >
        {text}
      </Text>

      {isTruncated === null ? (
        // 같은 폭에서 자르지 않은 높이를 잰다. absolute라 배치에는 영향을 주지 않는다.
        <Text
          aria-hidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={[textStyle, styles.probe]}
          onLayout={measureFull}
        >
          {text}
        </Text>
      ) : null}

      {isTruncated ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isExpanded ? '추천 이유 접기' : '추천 이유 전체 보기'}
          onPress={() => setIsExpanded((expanded) => !expanded)}
          style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
        >
          <Text style={[styles.linkText, { fontSize: linkSize }]}>
            {isExpanded ? '접기' : '더보기'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  probe: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    opacity: 0,
    zIndex: -1,
  },
  link: {
    alignSelf: 'flex-start',
    paddingTop: 3,
    // 작은 글씨라 누를 곳이 좁다. 아래위로 여유를 준다.
    paddingBottom: 2,
  },
  linkPressed: {
    opacity: 0.6,
  },
  linkText: {
    color: colors.primary,
    lineHeight: 16,
    textDecorationLine: 'underline',
    fontFamily: fontFamily.semibold,
    fontWeight: fontWeight.semibold,
  },
});
