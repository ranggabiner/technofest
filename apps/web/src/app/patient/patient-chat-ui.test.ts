import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { dictionary } from "@/lib/i18n/dictionary";

describe("patient chat Stitch redesign contract", () => {
  const pageSource = () =>
    readFileSync(new URL("./chat/page.tsx", import.meta.url), "utf8");
  const actionSource = () =>
    readFileSync(new URL("./actions.ts", import.meta.url), "utf8");
  const clientSource = () =>
    readFileSync(new URL("./_components/ai-journal-client.tsx", import.meta.url), "utf8");
  const serviceSource = () =>
    readFileSync(new URL("../../lib/ai/journal-service.ts", import.meta.url), "utf8");

  it("keeps /patient/chat outside the shared patient portal shell", () => {
    expect(existsSync(new URL("./chat/page.tsx", import.meta.url))).toBe(true);
    expect(existsSync(new URL("./chat/loading.tsx", import.meta.url))).toBe(true);
    expect(existsSync(new URL("./(portal)/chat/page.tsx", import.meta.url))).toBe(false);
    expect(existsSync(new URL("./(portal)/chat/loading.tsx", import.meta.url))).toBe(false);
  });

  it("owns full-page auth and Stitch workspace without PatientLayout", () => {
    const source = pageSource();

    expect(source).not.toContain("PatientLayout");
    expect(source).not.toContain("PatientForbiddenLayout");
    expect(source).toContain("requireRole");
    expect(source).toContain('className="h-screen h-[100dvh] overflow-hidden bg-[var(--color-warm-canvas)]"');
    expect(source).toContain('data-chat-layout="stitch-chat-workspace"');
  });

  it("renders the page-local action rail, canvas, and bottom composer from the client component", () => {
    const source = clientSource();

    expect(source).toContain('data-chat-sidebar="actions"');
    expect(source).toContain('data-chat-canvas="conversation"');
    expect(source).toContain('data-chat-composer="bottom-input"');
  });

  it("removes mental and physical chat category selection", () => {
    const source = clientSource();
    const sidebarStart = source.indexOf('data-chat-sidebar="actions"');
    const canvasStart = source.indexOf('data-chat-canvas="conversation"');
    const sidebar = source.slice(sidebarStart, canvasStart);

    expect(source).not.toContain("activeCategory");
    expect(source).not.toContain("CategoryButton");
    expect(source).not.toContain("ChoiceCard");
    expect(source).not.toContain("copy.categoriesLabel");
    expect(source).not.toContain("copy.mentalCategory");
    expect(source).not.toContain("copy.physicalCategory");
    expect(source).not.toContain("copy.mentalChoiceTitle");
    expect(source).not.toContain("copy.physicalChoiceTitle");
    expect(source).not.toContain("focusComposer(\"mental\")");
    expect(source).not.toContain("focusComposer(\"physical\")");
    expect(sidebar).not.toContain("Brain");
    expect(sidebar).not.toContain("Activity");
  });

  it("renders static empty-state guidance cards without making them chat modes", () => {
    const source = clientSource();

    expect(source).toContain('data-chat-empty-guidance="cards"');
    expect(source).toContain('data-chat-empty-guidance-card={kind}');
    expect(source).toContain('kind="emotional"');
    expect(source).toContain('kind="body"');
    expect(source).toContain("copy.emotionalGuidanceTitle");
    expect(source).toContain("copy.emotionalGuidanceDescription");
    expect(source).toContain("copy.bodyGuidanceTitle");
    expect(source).toContain("copy.bodyGuidanceDescription");
    expect(source).toContain("function EmptyGuidanceCard");
    expect(source).not.toContain('data-chat-empty-guidance-card="mental-button"');
    expect(source).not.toContain('data-chat-empty-guidance-card="physical-button"');
  });

  it("bounds the chat workspace and scrolls only history items inside the sidebar", () => {
    const page = pageSource();
    const client = clientSource();

    expect(page).toContain('className="h-screen h-[100dvh] overflow-hidden bg-[var(--color-warm-canvas)]"');
    expect(page).toContain('className="h-full overflow-hidden bg-[var(--color-warm-canvas)]"');

    expect(client).toContain("grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-[var(--color-warm-canvas)]");
    expect(client).toContain("grid min-h-0 max-h-[min(220px,34dvh)]");
    expect(client).toContain("lg:flex lg:h-full lg:max-h-none lg:flex-col lg:gap-6");
    expect(client).toContain("lg:max-h-none");
    expect(client).toContain("relative flex h-full min-h-0 flex-col overflow-hidden");
    expect(client).toContain("min-h-0 flex-1 overflow-y-auto");
    expect(client).toContain('data-chat-history="items"');
    expect(client).toContain('className="min-h-0 overflow-x-auto overflow-y-hidden custom-scrollbar pb-1 lg:flex-1 lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0 lg:pr-1"');
    expect(client).not.toContain("grid min-h-[inherit]");
    expect(client).not.toContain("relative flex min-h-screen flex-col");

    const sidebarStart = client.indexOf('data-chat-sidebar="actions"');
    const sidebarEnd = client.indexOf('data-chat-canvas="conversation"');
    const sidebar = client.slice(sidebarStart, sidebarEnd);
    const historyStart = sidebar.indexOf('data-chat-history="items"');
    expect(historyStart).toBeGreaterThan(-1);
    expect(sidebar.slice(0, historyStart)).not.toContain("overflow-y-auto");
    expect(sidebar.slice(historyStart)).toContain("overflow-y-auto");
  });

  it("keeps the standalone chat workspace usable on narrow mobile viewports", () => {
    const page = pageSource();
    const client = clientSource();

    expect(page).toContain("h-screen h-[100dvh] overflow-hidden");
    expect(client).toContain("max-h-[min(220px,34dvh)]");
    expect(client).toContain("grid grid-cols-2 gap-2 lg:grid-cols-1 lg:gap-1");
    expect(client).toContain("overflow-x-auto overflow-y-hidden custom-scrollbar");
    expect(client).toContain("flex min-w-0 gap-2 lg:grid lg:gap-1");
    expect(client).toContain("w-[min(220px,70vw)] shrink-0");
    expect(client).toContain("min-h-[128px]");
    expect(client).toContain("max-w-[92%] px-3.5 py-3 text-sm leading-6 sm:max-w-[82%] sm:px-4");
    expect(client).toContain("pb-[calc(env(safe-area-inset-bottom)+1rem)]");
    expect(client).toContain("text-base sm:text-sm");
  });

  it("groups the AI avatar with the back affordance instead of centering it", () => {
    const source = clientSource();

    expect(source).toContain('data-chat-header="navigation-group"');
    expect(source).toContain("<BackNavigationMenu copy={copy} navigationCopy={navigationCopy} />");
    expect(source).toContain("{copy.aiAvatar}");
    expect(source).not.toContain('className="flex items-center justify-between gap-3"');
    expect(source).not.toContain('<span className="size-9" aria-hidden="true" />');
  });

  it("opens patient navigation from the chat back affordance instead of direct navigation", () => {
    const source = clientSource();

    expect(source).toContain("function BackNavigationMenu");
    expect(source).toContain('aria-haspopup="menu"');
    expect(source).toContain('data-chat-back-menu="patient-navigation"');
    expect(source).toContain('href="/patient"');
    expect(source).toContain('href="/patient/access"');
    expect(source).toContain('href="/patient/health-history"');
    expect(source).toContain("ClipboardList");
    expect(source).not.toContain('href="/patient/access-history"');
    expect(source).toContain('event.key === "Escape"');
    expect(source).toContain("contains(event.target as Node)");
  });

  it("dims the chat screen while the patient navigation popup is open", () => {
    const source = clientSource();

    expect(source).toContain('data-chat-backdrop="patient-navigation"');
    expect(source).toContain("fixed inset-0");
    expect(source).toContain("bg-black/20");
    expect(source).toContain('aria-hidden="true"');
    expect(source).toContain("onClick={() => setIsOpen(false)}");
  });

  it("passes localized patient navigation labels into the chat client", () => {
    const source = pageSource();

    expect(source).toContain("navigationCopy");
    expect(source).toContain("copy.patient.nav.dashboard");
    expect(source).toContain("copy.patient.nav.access");
    expect(source).toContain("copy.patient.nav.healthHistory");
    expect(source).not.toContain("copy.patient.nav.history");
  });

  it("keeps Stitch chat strings in Indonesian and English dictionaries", () => {
    const idChat = dictionary.id.patient.chat;
    const enChat = dictionary.en.patient.chat;

    expect(idChat.heroPrompt).toBe("Ada keluhan apa hari ini?");
    expect(idChat.emotionalGuidanceTitle).toBe("Kondisi Emosional");
    expect(idChat.emotionalGuidanceDescription).toBe(
      "Ceritakan stres, cemas, suasana hati, tidur, atau beban pikiran yang sedang dirasakan.",
    );
    expect(idChat.bodyGuidanceTitle).toBe("Keluhan Tubuh");
    expect(idChat.bodyGuidanceDescription).toBe(
      "Ceritakan nyeri, gejala fisik, aktivitas, atau perubahan kondisi tubuh hari ini.",
    );
    expect(idChat.newChat).toBe("Chat Baru");
    expect(idChat.newChatTitle).toBe("Mulai chat kesehatan baru. Kamu bisa cerita tentang keluhan fisik, mental, atau keduanya.");
    expect(idChat.searchChat).toBe("Cari Chat");
    expect(idChat.searchPlaceholder).toBe("Cari judul atau isi chat...");
    expect(idChat.noChatHistory).toBe("Belum ada riwayat chat.");
    expect(idChat.noSearchResults).toBe("Tidak ada chat yang cocok.");
    expect(idChat.newChatConfirmTitle).toBe("Mulai sesi baru?");
    expect(idChat.closedSessionNotice).toContain("sudah ditutup");
    expect(idChat.closedSessionReadonlyDescription).toContain("sesi ini sudah berakhir");
    expect(idChat.generalSummaryTitle).toBe("Ringkasan Umum");
    expect(idChat.mentalSummaryTitle).toBe("Ringkasan Mental");
    expect(idChat.physicalSummaryTitle).toBe("Ringkasan Fisik");
    expect(idChat.summaryGenerating).toBe("Ringkasan sedang diproses...");
    expect(idChat.summaryGeneratingDescription).toContain("tetap bisa pindah halaman");
    expect(idChat.summaryFailedTitle).toBe("Ringkasan gagal diproses");
    expect(idChat.retrySummary).toBe("Coba lagi");
    expect(idChat.emptyChat).toBe("Mulai chat kesehatan baru. Kamu bisa cerita tentang keluhan fisik, mental, atau keduanya.");
    expect(idChat.bottomDisclosure).toContain("MedProof AI");
    expect(idChat.sendDisabledTitle).toBe("Tunggu respons AI selesai");
    expect(idChat.backNavigationTitle).toBe("Buka navigasi pasien");
    expect(idChat.backNavigationMenuLabel).toBe("Navigasi pasien");
    expect(idChat).not.toHaveProperty("categoriesLabel");
    expect(idChat).not.toHaveProperty("mentalCategory");
    expect(idChat).not.toHaveProperty("physicalCategory");
    expect(idChat).not.toHaveProperty("mentalChoiceTitle");
    expect(idChat).not.toHaveProperty("mentalChoiceDescription");
    expect(idChat).not.toHaveProperty("physicalChoiceTitle");
    expect(idChat).not.toHaveProperty("physicalChoiceDescription");
    expect(idChat).not.toHaveProperty("chatHistoryItems");
    expect(idChat).not.toHaveProperty("limitReached");
    expect(idChat).not.toHaveProperty("storageLabel");
    expect(idChat).not.toHaveProperty("storageValue");
    expect(idChat).not.toHaveProperty("modelLabel");
    expect(idChat).not.toHaveProperty("modelValue");
    expect(idChat).not.toHaveProperty("consentProofLabel");
    expect(idChat).not.toHaveProperty("sessionCount");

    expect(enChat.heroPrompt).toBe("What concern do you have today?");
    expect(enChat.emotionalGuidanceTitle).toBe("Emotional Wellbeing");
    expect(enChat.emotionalGuidanceDescription).toBe(
      "Share stress, anxiety, mood, sleep, or mental load you are currently feeling.",
    );
    expect(enChat.bodyGuidanceTitle).toBe("Body Symptoms");
    expect(enChat.bodyGuidanceDescription).toBe(
      "Share pain, physical symptoms, activity, or changes in your body today.",
    );
    expect(enChat.newChat).toBe("New Chat");
    expect(enChat.newChatTitle).toBe("Start a new health chat. You can talk about physical symptoms, mental concerns, or both.");
    expect(enChat.searchChat).toBe("Search Chat");
    expect(enChat.searchPlaceholder).toBe("Search title or chat content...");
    expect(enChat.noChatHistory).toBe("No chat history yet.");
    expect(enChat.noSearchResults).toBe("No matching chats.");
    expect(enChat.newChatConfirmTitle).toBe("Start a new session?");
    expect(enChat.closedSessionNotice).toContain("closed");
    expect(enChat.closedSessionReadonlyDescription).toContain("session has ended");
    expect(enChat.generalSummaryTitle).toBe("General Summary");
    expect(enChat.mentalSummaryTitle).toBe("Mental Summary");
    expect(enChat.physicalSummaryTitle).toBe("Physical Summary");
    expect(enChat.summaryGenerating).toBe("Summary is being processed...");
    expect(enChat.summaryGeneratingDescription).toContain("navigate away");
    expect(enChat.summaryFailedTitle).toBe("Summary processing failed");
    expect(enChat.retrySummary).toBe("Retry");
    expect(enChat.emptyChat).toBe("Start a new health chat. You can talk about physical symptoms, mental concerns, or both.");
    expect(enChat.bottomDisclosure).toContain("MedProof AI");
    expect(enChat.sendDisabledTitle).toBe("Wait for the AI response to finish");
    expect(enChat.backNavigationTitle).toBe("Open patient navigation");
    expect(enChat.backNavigationMenuLabel).toBe("Patient navigation");
    expect(enChat).not.toHaveProperty("categoriesLabel");
    expect(enChat).not.toHaveProperty("mentalCategory");
    expect(enChat).not.toHaveProperty("physicalCategory");
    expect(enChat).not.toHaveProperty("mentalChoiceTitle");
    expect(enChat).not.toHaveProperty("mentalChoiceDescription");
    expect(enChat).not.toHaveProperty("physicalChoiceTitle");
    expect(enChat).not.toHaveProperty("physicalChoiceDescription");
    expect(enChat).not.toHaveProperty("chatHistoryItems");
    expect(enChat).not.toHaveProperty("limitReached");
    expect(enChat).not.toHaveProperty("storageLabel");
    expect(enChat).not.toHaveProperty("storageValue");
    expect(enChat).not.toHaveProperty("modelLabel");
    expect(enChat).not.toHaveProperty("modelValue");
    expect(enChat).not.toHaveProperty("consentProofLabel");
    expect(enChat).not.toHaveProperty("sessionCount");
  });

  it("removes the sidebar status and info component", () => {
    const page = pageSource();
    const client = clientSource();
    const sidebarStart = client.indexOf('data-chat-sidebar="actions"');
    const canvasStart = client.indexOf('data-chat-canvas="conversation"');
    const sidebar = client.slice(sidebarStart, canvasStart);

    expect(page).not.toContain("consentProofValue");
    expect(page).not.toContain("proofLabel");

    expect(client).not.toContain("StatusRow");
    expect(client).not.toContain("StatePill");
    expect(client).not.toContain("patientMessageCount");
    expect(client).not.toContain("initialPatientMessageCount");
    expect(client).not.toContain("consentProofValue");
    expect(client).not.toContain("profilingComplete");

    expect(sidebar).not.toContain("copy.storageLabel");
    expect(sidebar).not.toContain("copy.storageValue");
    expect(sidebar).not.toContain("copy.modelLabel");
    expect(sidebar).not.toContain("copy.modelValue");
    expect(sidebar).not.toContain("copy.consentProofLabel");
    expect(sidebar).not.toContain("copy.sessionCount");
    expect(sidebar).not.toContain("copy.consentAccepted");
    expect(sidebar).not.toContain("copy.profileComplete");
    expect(sidebar).not.toContain("sessionStatus");
    expect(sidebar).not.toContain("mt-auto");
  });

  it("wires sidebar history, new-chat confirmation, and closed-session read-only state", () => {
    const source = clientSource();

    expect(source).toContain('fetch("/api/patient/ai/sessions?');
    expect(source).toContain('fetch("/api/patient/ai/sessions",');
    expect(source).toContain("confirmNewChatOpen");
    expect(source).toContain("closedSessionNotice");
    expect(source).toContain("selectedSessionIsClosed");
    expect(source).not.toContain("copy.chatHistoryItems");
    expect(source).not.toContain("remainingMessages");
  });

  it("keeps finished sessions out of the default active chat while leaving history accessible", () => {
    const source = serviceSource();
    const stateStart = source.indexOf("export async function loadPatientJournalState");
    const dashboardStart = source.indexOf("export async function loadPatientJournalDashboardState");
    const historyStart = source.indexOf("export async function loadPatientChatHistory");
    const sessionStart = source.indexOf("export async function loadPatientChatSession");
    const stateLoader = source.slice(stateStart, dashboardStart);
    const historyLoader = source.slice(historyStart, sessionStart);

    expect(stateLoader).toContain(".is(\"ended_at\", null)");
    expect(stateLoader).toContain("const selectedSession = activeSession;");
    expect(stateLoader).not.toContain("chatHistory[0]");
    expect(stateLoader).not.toContain("loadPatientSessionRow(patientId, chatHistory[0].id)");

    expect(historyLoader).toContain(".from(\"ai_sessions\")");
    expect(historyLoader).toContain(".order(\"created_at\", { ascending: false })");
    expect(historyLoader).not.toContain(".is(\"ended_at\", null)");
  });

  it("replaces the bottom composer with a fixed readonly component for closed sessions", () => {
    const source = clientSource();
    const closedBranchIndex = source.indexOf("selectedSessionIsClosed ? (");
    const readonlyCallIndex = source.indexOf("<ReadonlyClosedSessionComposer copy={copy} />");
    const readonlyComposerIndex = source.indexOf('data-chat-composer="readonly-bottom"');
    const activeComposerIndex = source.indexOf('data-chat-composer="bottom-input"');

    expect(readonlyCallIndex).toBeGreaterThan(-1);
    expect(readonlyComposerIndex).toBeGreaterThan(-1);
    expect(activeComposerIndex).toBeGreaterThan(-1);
    expect(closedBranchIndex).toBeGreaterThan(-1);
    expect(readonlyCallIndex).toBeGreaterThan(closedBranchIndex);
    expect(activeComposerIndex).toBeGreaterThan(readonlyCallIndex);
    expect(source).toContain("copy.closedSessionReadonlyTitle");
    expect(source).toContain("copy.closedSessionReadonlyDescription");
    expect(source).toContain("cursor-not-allowed");

    const readonlyComposer = source.slice(readonlyComposerIndex);
    expect(readonlyComposer).not.toContain("<input");
    expect(readonlyComposer).not.toContain("type=\"submit\"");
  });

  it("renders completed-session summary after the final chat bubble inside the scrollable history", () => {
    const source = clientSource();
    const scrollListIndex = source.indexOf("min-h-0 flex-1 overflow-y-auto");
    const messageMapIndex = source.indexOf("messages.map((message)");
    const summaryIndex = source.indexOf("<SessionSummaryPanel");
    const readonlyComposerIndex = source.indexOf('data-chat-composer="readonly-bottom"');

    expect(scrollListIndex).toBeGreaterThan(-1);
    expect(messageMapIndex).toBeGreaterThan(scrollListIndex);
    expect(summaryIndex).toBeGreaterThan(messageMapIndex);
    expect(readonlyComposerIndex).toBeGreaterThan(summaryIndex);
    expect(source).toContain('data-chat-summary="completed-session"');
    expect(source).toContain('data-chat-summary-divider="completed-session"');
    expect(source).toContain("copy.generalSummaryTitle");
    expect(source).toContain("copy.mentalSummaryTitle");
    expect(source).toContain("copy.physicalSummaryTitle");
    expect(source).not.toContain("<ul");
    expect(source).not.toContain("<li");
  });

  it("renders summary generation and failure states inside only the summary panel", () => {
    const source = clientSource();

    expect(source).toContain("summaryStatus");
    expect(source).toContain("summaryGenerationStatus");
    expect(source).toContain('data-chat-summary-status="generating"');
    expect(source).toContain('data-chat-summary-status="failed"');
    expect(source).toContain("copy.summaryGenerating");
    expect(source).toContain("copy.summaryFailedTitle");
    expect(source).toContain("retryAiSessionSummaryAction");
    expect(source).toContain("summaryStatus === \"generating\"");
    expect(source).toContain("summaryStatus === \"failed\"");
    expect(source).not.toContain("setIsSessionLoading(summaryStatus");
  });

  it("keeps chat bubbles visually connected to the bottom composer while scrolling", () => {
    const source = clientSource();

    expect(source).not.toContain("pb-24");
    expect(source).not.toContain("to-transparent px-5 pb-5 pt-3");
    expect(source).toContain('data-chat-composer="bottom-input"');
    expect(source).toContain('data-chat-composer="readonly-bottom"');
    expect(source).not.toContain("bg-[var(--color-warm-canvas)] px-5 pb-5 md:px-10 md:pb-8");
    expect(source).not.toContain("border-t border-[var(--color-stone-surface)] bg-[var(--color-card)] px-2.5 pb-5 md:px-5 md:pb-8");
    expect(source).toContain("bg-[var(--color-warm-canvas)] px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:px-4 md:px-5 md:pb-8");
  });

  it("keeps the chat input editable while AI is streaming and blocks only send actions", () => {
    const source = clientSource();
    const activeComposerIndex = source.indexOf('data-chat-composer="bottom-input"');
    const activeComposer = source.slice(activeComposerIndex, source.indexOf("</form>", activeComposerIndex));

    expect(activeComposerIndex).toBeGreaterThan(-1);
    expect(source).toContain("LoadingActionButton");
    expect(activeComposer).toContain('id="ai-message"');
    expect(activeComposer).not.toContain("disabled={isStreaming}");
    expect(activeComposer).toContain("if (!canSend) return");
    expect(activeComposer).toContain("if (canSend) void sendMessage()");
    expect(activeComposer).toContain("disabled={!canSend}");
    expect(activeComposer).toContain("isLoading={isStreaming}");
    expect(activeComposer).toContain("loadingLabel={copy.sendDisabledTitle}");
    expect(activeComposer).toContain("isStreaming ? copy.sendDisabledTitle : copy.sendTitle");
    expect(activeComposer).toContain("<ArrowUp size={20} aria-hidden=\"true\" />");
  });

  it("moves chat search from the history sidebar into a centered overlay", () => {
    const source = clientSource();
    const sidebarStart = source.indexOf('data-chat-sidebar="actions"');
    const canvasStart = source.indexOf('data-chat-canvas="conversation"');
    const sidebar = source.slice(sidebarStart, canvasStart);

    expect(source).toContain("isSearchOpen");
    expect(source).toContain("openSearchOverlay");
    expect(source).toContain("closeSearchOverlay");
    expect(source).toContain('data-chat-search-overlay="global"');
    expect(source).toContain('data-chat-search-panel="global"');
    expect(source).toContain('id="chat-search-overlay-input"');
    expect(source).toContain("searchInputRef.current?.focus()");
    expect(source).toContain('event.key === "Escape"');
    expect(source).toContain('onClick={closeSearchOverlay}');
    expect(source).toContain("setSearchQuery(\"\")");
    expect(source).toContain("await loadSelectedSession(item.id)");
    expect(source).toContain("closeSearchOverlay()");

    expect(sidebar).toContain("copy.chatHistoryLabel");
    expect(sidebar).not.toContain('id="chat-history-search"');
    expect(sidebar).not.toContain("copy.searchPlaceholder");
  });

  it("filters only the search overlay results without changing sidebar history", () => {
    const source = clientSource();
    const sidebarStart = source.indexOf('data-chat-sidebar="actions"');
    const canvasStart = source.indexOf('data-chat-canvas="conversation"');
    const sidebar = source.slice(sidebarStart, canvasStart);
    const searchOverlayStart = source.indexOf('data-chat-search-overlay="global"');
    const searchOverlay = source.slice(searchOverlayStart);

    expect(source).toContain("const [history, setHistory]");
    expect(source).toContain("const [searchResults, setSearchResults]");
    expect(source).toContain("const [isSearchHistoryLoading, setIsSearchHistoryLoading]");
    expect(source).toContain("const sidebarHistoryEmptyMessage = copy.noChatHistory");
    expect(source).toContain("const searchResultsEmptyMessage = searchQuery.trim() ? copy.noSearchResults : copy.noChatHistory");
    expect(source).toContain("if (!isSearchOpen) return");
    expect(source).not.toContain("void loadHistory(searchQuery)");

    expect(sidebar).toContain("history.length === 0");
    expect(sidebar).toContain("history.map((item)");
    expect(sidebar).toContain("{sidebarHistoryEmptyMessage}");
    expect(sidebar).not.toContain("searchQuery.trim()");
    expect(sidebar).not.toContain("copy.noSearchResults");

    expect(searchOverlay).toContain("isSearchHistoryLoading");
    expect(searchOverlay).toContain("searchResults.length === 0");
    expect(searchOverlay).toContain("searchResults.map((item)");
    expect(searchOverlay).toContain("{searchResultsEmptyMessage}");
  });

  it("reuses sidebar history for empty search and avoids an empty query request", () => {
    const source = clientSource();

    expect(source).toContain("const trimmedQuery = nextQuery.trim()");
    expect(source).toContain("if (!trimmedQuery)");
    expect(source).toContain("setSearchResults(history)");
    expect(source).toContain("encodeURIComponent(trimmedQuery)");
    expect(source).not.toContain("encodeURIComponent(nextQuery)");
  });

  it("batches streamed assistant text updates before touching React state", () => {
    const source = clientSource();

    expect(source).toContain("appendAssistantContent");
    expect(source).toContain("pendingAssistantContentRef");
    expect(source).toContain("streamFlushFrameRef");
    expect(source).toContain("requestAnimationFrame");
    expect(source).toContain("flushAssistantContent");
    expect(source).toContain("window.cancelAnimationFrame");
  });

  it("moves Finish Session from the sidebar to a fixed main-chat action header", () => {
    const source = clientSource();
    const sidebarStart = source.indexOf('data-chat-sidebar="actions"');
    const canvasStart = source.indexOf('data-chat-canvas="conversation"');
    const sidebar = source.slice(sidebarStart, canvasStart);
    const canvas = source.slice(canvasStart);

    expect(sidebar).not.toContain("copy.finish");
    expect(sidebar).not.toContain("copy.finishTitle");
    expect(sidebar).not.toContain("finishAiSessionAction");

    expect(source).toContain("const showFinishAction = hasMessages && !selectedSessionIsClosed && !isSessionLoading");
    expect(canvas).toContain('data-chat-actions="main-session"');
    expect(canvas).toContain('className="shrink-0 px-3 pt-3 sm:px-5 md:px-10 md:pt-8"');
    expect(canvas).toContain('className="flex w-full justify-start"');
    expect(canvas).not.toContain('className="mx-auto flex w-full max-w-[760px] justify-start"');
    expect(canvas).toContain("disabled={isStreaming}");
    expect(canvas).toContain("isLoading={isFinishing}");
    expect(canvas).toContain("loadingLabel={copy.finish}");
    expect(canvas).toContain("border-[var(--color-error-red)]");
    expect(canvas).toContain("text-[var(--color-error-red)]");
    expect(canvas).toContain("hover:bg-[var(--color-error-surface)]");
    expect(canvas).toContain("void finishCurrentSession()");
    expect(canvas).toContain("{copy.finish}");

    const actionHeaderIndex = canvas.indexOf('data-chat-actions="main-session"');
    const scrollListIndex = canvas.indexOf("min-h-0 flex-1 overflow-y-auto");
    expect(actionHeaderIndex).toBeGreaterThan(-1);
    expect(scrollListIndex).toBeGreaterThan(-1);
    expect(actionHeaderIndex).toBeLessThan(scrollListIndex);
  });

  it("finishes the selected chat in place instead of redirecting into a new chat", () => {
    const client = clientSource();
    const actions = actionSource();
    const actionStart = actions.indexOf("export async function finishAiSessionAction");
    const retryStart = actions.indexOf("export async function retryAiSessionSummaryAction");
    const finishAction = actions.slice(actionStart, retryStart);
    const finishHandlerStart = client.indexOf("function finishCurrentSession");
    const retryHandlerStart = client.indexOf("function retrySummaryGeneration");
    const finishHandler = client.slice(finishHandlerStart, retryHandlerStart);

    expect(finishAction).toContain("finishAiSessionAction(sessionId: string)");
    expect(finishAction).toContain("const detail = await finishPatientChatSession(role, sessionId)");
    expect(finishAction).toContain("return detail");
    expect(finishAction).not.toContain("redirect(");

    expect(finishHandler).toContain("if (!sessionId || isStreaming || selectedSessionIsClosed) return");
    expect(finishHandler).toContain("const detail = await finishAiSessionAction(sessionId)");
    expect(finishHandler).toContain("applySessionDetail(detail)");
    expect(finishHandler).toContain("showSuccessToast(successToast.aiSessionFinished)");
    expect(finishHandler).toContain("void loadHistory()");
    expect(finishHandler).not.toContain("createNewChat");
  });

  it("uses shared top-right success toast for chat lifecycle mutations", () => {
    const source = clientSource();
    const page = pageSource();

    expect(source).toContain('import { AppToast } from "@/components/ui/app-toast";');
    expect(source).toContain("successToast.aiSessionCreated");
    expect(source).toContain("successToast.aiSessionFinished");
    expect(source).toContain("successToast.summaryRetryStarted");
    expect(source).not.toContain("showSuccessToast(successToast.messageSent)");
    expect(page).toContain("successToast={copy.common.successToast}");
  });

  it("renders Markdown only for assistant chat bubbles", () => {
    const source = clientSource();

    expect(source).toContain('import dynamic from "next/dynamic"');
    expect(source).toContain('import("./assistant-markdown")');
    expect(source).toContain("AssistantMarkdownFallback");
    expect(source).toContain("<AssistantMarkdown content={message.content || copy.writing} />");
    expect(source).toContain("{message.content || copy.writing}");
    expect(source).toContain('"max-w-[92%] px-3.5 py-3 text-sm leading-6 sm:max-w-[82%] sm:px-4"');
    expect(source).toContain(
      'message.role === "user" && "whitespace-pre-wrap break-words"',
    );
  });

  it("keeps patient chat text-only without attachment upload affordances", () => {
    const source = clientSource();
    const idChat = dictionary.id.patient.chat;
    const enChat = dictionary.en.patient.chat;

    expect(source).not.toContain("attachmentInputRef");
    expect(source).not.toContain('type="file"');
    expect(source).not.toContain("CHAT_ATTACHMENT_ACCEPT");
    expect(source).not.toContain("handleAttachmentFiles");
    expect(source).not.toContain("event.dataTransfer.files");
    expect(source).not.toContain('data-chat-dropzone="conversation"');
    expect(source).not.toContain('data-chat-drop-overlay="attachment"');
    expect(source).not.toContain('data-chat-attachment-preview="selected"');
    expect(source).not.toContain('data-chat-attachment-remove="selected"');
    expect(source).not.toContain("new FormData()");
    expect(source).not.toContain('body.set("attachment", attachment.file)');
    expect(source).not.toContain("Paperclip");
    expect(source).toContain('body: JSON.stringify({ message: text, sessionId })');

    expect(idChat).not.toHaveProperty("attachTitle");
    expect(idChat).not.toHaveProperty("attachmentDropTitle");
    expect(idChat).not.toHaveProperty("attachmentDropDescription");
    expect(idChat).not.toHaveProperty("attachmentSelectedTitle");
    expect(idChat).not.toHaveProperty("attachmentRemove");
    expect(idChat).not.toHaveProperty("attachmentProcessing");
    expect(idChat).not.toHaveProperty("attachmentReady");
    expect(idChat).not.toHaveProperty("attachmentOnlyMessage");
    expect(idChat).not.toHaveProperty("attachmentFallbackName");
    expect(idChat).not.toHaveProperty("attachmentErrors");

    expect(enChat).not.toHaveProperty("attachTitle");
    expect(enChat).not.toHaveProperty("attachmentDropTitle");
    expect(enChat).not.toHaveProperty("attachmentDropDescription");
    expect(enChat).not.toHaveProperty("attachmentSelectedTitle");
    expect(enChat).not.toHaveProperty("attachmentRemove");
    expect(enChat).not.toHaveProperty("attachmentProcessing");
    expect(enChat).not.toHaveProperty("attachmentReady");
    expect(enChat).not.toHaveProperty("attachmentOnlyMessage");
    expect(enChat).not.toHaveProperty("attachmentFallbackName");
    expect(enChat).not.toHaveProperty("attachmentErrors");
  });
});
