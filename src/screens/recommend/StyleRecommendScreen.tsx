import { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { ChatBubble } from '../../components/chat/ChatBubble';
import { ChatComposer } from '../../components/chat/ChatComposer';
import { ChatRecommendationList } from '../../components/chat/ChatRecommendationList';
import { ConversationList } from '../../components/chat/ConversationList';
import { TypingIndicator } from '../../components/chat/TypingIndicator';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { colors } from '../../constants/colors';
import { layout } from '../../constants/layout';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight, letterSpacing, typography } from '../../constants/typography';
import {
  createConversation,
  listConversations,
  listMessages,
  sendMessage,
  type ChatMessage,
  type Conversation,
} from '../../services/chatService';
import { getImageFingerprint, pickImageFiles, uploadImage } from '../../services/imageService';

const MAX_ATTACHMENTS = 8;
const GREETING =
  '안녕하세요! 옷 사진을 올리거나 원하는 스타일을 말씀해 주시면 어울리는 코디를 찾아드릴게요.';

export function StyleRecommendScreen() {
  const { width } = useWindowDimensions();
  const showSidebarInline = width >= layout.sidebarBreakpoint;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  // attachments와 같은 순서로 유지되는 내용 지문 목록.
  const [fingerprints, setFingerprints] = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [error, setError] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const isUploading = uploadingCount > 0;
  const canSend = Boolean(conversationId) && !isSending && !isUploading && draft.trim().length > 0;

  // 가장 최근 대화를 이어 쓰고, 없으면 새로 만든다.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        let list = await listConversations();
        if (list.length === 0) {
          list = [await createConversation()];
        }
        if (cancelled) {
          return;
        }

        const conversation = list[0];
        setConversations(list);
        setConversationId(conversation.id);
        const history = await listMessages(conversation.id, { limit: 50 });
        if (!cancelled) {
          setMessages(history.messages);
        }
      } catch {
        if (!cancelled) {
          setError('대화를 불러오지 못했어요.');
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToEnd();
    }
  }, [messages.length, scrollToEnd]);

  const handleAttach = async () => {
    setError('');
    const files = await pickImageFiles();
    if (files.length === 0) {
      return;
    }

    const remainingSlots = MAX_ATTACHMENTS - attachments.length;
    if (remainingSlots <= 0) {
      setError(`사진은 최대 ${MAX_ATTACHMENTS}장까지 첨부할 수 있어요.`);
      return;
    }

    // 업로드 전에 내용 지문으로 중복을 걸러낸다.
    const picked = await Promise.all(
      files.map(async (file) => ({ file, fingerprint: await getImageFingerprint(file) })),
    );
    const seen = new Set(fingerprints);
    const unique: typeof picked = [];
    let duplicateCount = 0;

    picked.forEach((entry) => {
      if (seen.has(entry.fingerprint)) {
        duplicateCount += 1;
        return;
      }
      seen.add(entry.fingerprint);
      unique.push(entry);
    });

    if (unique.length === 0) {
      setError('이미 같은 이미지가 업로드 되어 있습니다!');
      return;
    }

    const accepted = unique.slice(0, remainingSlots);
    if (duplicateCount > 0) {
      setError(`이미 같은 이미지가 업로드 되어 있습니다! (${duplicateCount}장 제외)`);
    } else if (accepted.length < unique.length) {
      setError(`사진은 최대 ${MAX_ATTACHMENTS}장까지라 ${accepted.length}장만 첨부했어요.`);
    }

    setUploadingCount((count) => count + accepted.length);

    // 한 장이 실패해도 나머지는 살리려고 allSettled로 각각 처리한다.
    const results = await Promise.allSettled(accepted.map(({ file }) => uploadImage(file)));
    const uploaded: string[] = [];
    const uploadedFingerprints: string[] = [];

    results.forEach((result, index) => {
      if (result.status !== 'fulfilled') {
        return;
      }
      // 백엔드도 내용 해시로 경로를 정하므로, 지문이 달라도 같은 URL이 올 수 있다.
      const { image_url: url } = result.value;
      if (uploaded.includes(url) || attachments.includes(url)) {
        return;
      }
      uploaded.push(url);
      uploadedFingerprints.push(accepted[index].fingerprint);
    });

    const failedCount = results.filter((result) => result.status === 'rejected').length;

    setAttachments((current) => [...current, ...uploaded]);
    setFingerprints((current) => [...current, ...uploadedFingerprints]);
    setUploadingCount((count) => Math.max(0, count - accepted.length));

    if (failedCount > 0) {
      setError(
        uploaded.length > 0 ? `${failedCount}장은 첨부하지 못했어요.` : '이미지 업로드에 실패했어요.',
      );
    }
  };

  const handleRemoveAttachment = (target: string) => {
    setError('');
    const index = attachments.indexOf(target);
    if (index === -1) {
      return;
    }
    setAttachments((current) => current.filter((imageUrl) => imageUrl !== target));
    setFingerprints((current) => current.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!conversationId || !canSend) {
      return;
    }

    const query = draft.trim();
    const imageUrls = attachments;
    setError('');
    setIsSending(true);

    // 보낸 말풍선은 서버 응답을 기다리지 않고 먼저 띄운다.
    const pendingId = `pending-${Date.now()}`;
    setMessages((current) => [
      ...current,
      {
        id: pendingId,
        conversation_id: conversationId,
        role: 'user',
        content: query,
        payload: { image_urls: imageUrls },
        created_at: new Date().toISOString(),
      },
    ]);
    setDraft('');
    setAttachments([]);
    setFingerprints([]);

    try {
      const result = await sendMessage(conversationId, query, imageUrls);
      setMessages((current) => [
        // 낙관적으로 띄운 말풍선을 서버가 확정한 id로 교체한다.
        ...current.map((message) =>
          message.id === pendingId ? { ...message, id: result.user_message_id } : message,
        ),
        {
          id: result.assistant_message_id,
          conversation_id: conversationId,
          role: 'assistant',
          content: result.response.message,
          payload: result.response,
          created_at: new Date().toISOString(),
        },
      ]);

      // 첫 질문이 대화 제목이 되므로 목록도 함께 맞춰준다.
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                title: conversation.title ?? query.slice(0, 40),
                updated_at: new Date().toISOString(),
              }
            : conversation,
        ),
      );
    } catch {
      // 실패하면 방금 띄운 말풍선을 되돌리고 입력 내용을 살려준다.
      setMessages((current) => current.filter((message) => message.id !== pendingId));
      setDraft(query);
      setAttachments(imageUrls);
      setError('답변을 받지 못했어요. 다시 시도해 주세요.');
    } finally {
      setIsSending(false);
    }
  };

  const resetComposer = () => {
    setAttachments([]);
    setFingerprints([]);
    setDraft('');
  };

  const handleNewConversation = async () => {
    setError('');
    setIsSidebarOpen(false);
    try {
      const conversation = await createConversation();
      setConversations((current) => [conversation, ...current]);
      setConversationId(conversation.id);
      setMessages([]);
      resetComposer();
    } catch {
      setError('새 대화를 시작하지 못했어요.');
    }
  };

  const handleSelectConversation = async (nextId: string) => {
    setIsSidebarOpen(false);
    if (nextId === conversationId || isSending) {
      return;
    }

    setError('');
    setConversationId(nextId);
    setMessages([]);
    resetComposer();
    setIsLoadingHistory(true);

    try {
      const history = await listMessages(nextId, { limit: 50 });
      setMessages(history.messages);
    } catch {
      setError('대화를 불러오지 못했어요.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const recommendations = item.role === 'assistant' ? item.payload.recommendations ?? [] : [];
    const tips = item.role === 'assistant' ? item.payload.style_guide?.tips ?? [] : [];

    return (
      <ChatBubble role={item.role} content={item.content} imageUrls={item.payload.image_urls ?? []}>
        {item.role === 'assistant' ? (
          <ChatRecommendationList items={recommendations} tips={tips} />
        ) : null}
      </ChatBubble>
    );
  };

  return (
    // 입력 바의 구분선이 대화 폭 끝까지 닿도록 좌우 여백은 각 영역에서 준다.
    <ScreenContainer
      scroll={false}
      padded={false}
      maxWidth={showSidebarInline ? layout.maxContentWidthWide : layout.maxContentWidth}
    >
      <View style={styles.body}>
        {/* 넓은 화면에서는 목록을 상시 노출하고, 좁으면 헤더 버튼으로 연다. */}
        {showSidebarInline ? (
          <View style={styles.sidebar}>
            <ConversationList
              conversations={conversations}
              activeId={conversationId}
              disabled={isSending}
              onSelect={handleSelectConversation}
              onNewConversation={handleNewConversation}
            />
          </View>
        ) : null}

        <View style={styles.main}>
        <View style={styles.header}>
          {!showSidebarInline ? (
            <Pressable
              accessibilityLabel="대화 목록 열기"
              onPress={() => setIsSidebarOpen((open) => !open)}
              style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}
            >
              <Ionicons name="menu" size={20} color={colors.primary} />
            </Pressable>
          ) : null}
          <Text style={styles.title}>스타일 추천</Text>
        </View>

        {!showSidebarInline && isSidebarOpen ? (
          <View style={styles.sidebarOverlay}>
            <ConversationList
              conversations={conversations}
              activeId={conversationId}
              disabled={isSending}
              onSelect={handleSelectConversation}
              onNewConversation={handleNewConversation}
            />
          </View>
        ) : null}

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToEnd}
            ListHeaderComponent={
              messages.length === 0 && !isBootstrapping && !isLoadingHistory ? (
                <View style={styles.intro}>
                  <ChatBubble role="assistant" content={GREETING} />
                </View>
              ) : null
            }
            ListFooterComponent={isSending || isLoadingHistory ? <TypingIndicator /> : null}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <ChatComposer
            value={draft}
            attachments={attachments}
            pendingAttachmentCount={uploadingCount}
            canSend={canSend}
            isSending={isSending}
            isUploading={isUploading}
            canStartNewConversation={messages.length > 0 && !isSending}
            onChangeText={setDraft}
            onAttach={handleAttach}
            onNewConversation={handleNewConversation}
            onRemoveAttachment={handleRemoveAttachment}
            onSend={handleSend}
          />
        </KeyboardAvoidingView>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
  },
  sidebar: {
    width: layout.sidebarWidth,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  // 좁은 화면에서는 대화 위에 얹어 띄운다.
  sidebarOverlay: {
    position: 'absolute',
    top: 76,
    left: spacing.lg,
    right: spacing.lg,
    maxHeight: 320,
    zIndex: 10,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing.md,
    shadowColor: colors.canvasDark,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 8,
  },
  main: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },
  flex: {
    flex: 1,
    minHeight: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  menuButton: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.navySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
  title: {
    color: colors.text,
    fontSize: typography.heading,
    lineHeight: 38,
    letterSpacing: letterSpacing.heading,
    fontFamily: fontFamily.heavy,
    fontWeight: fontWeight.heavy,
  },
  list: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  intro: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
  },
});
