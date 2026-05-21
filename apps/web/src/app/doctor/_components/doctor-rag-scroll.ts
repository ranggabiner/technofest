export const doctorRagAutoScrollThresholdPx = 96;
const answerStartPaddingPx = 12;
const answerStartComfortZonePx = 96;

type ScrollContainerMetrics = {
  clientHeight: number;
  scrollHeight: number;
  scrollTop: number;
};

type DoctorRagScrollIntentInput = {
  hasAnswer: boolean;
  isFirstAnswer: boolean;
  isLoading: boolean;
  shouldRevealAnswerStart: boolean;
  shouldStickToBottom: boolean;
};

export type DoctorRagScrollIntent =
  | "none"
  | "reveal-answer-start"
  | "scroll-bottom";

type DoctorRagScrollStateAfterPanelScrollInput = {
  isAutoScrolling: boolean;
  isNearBottom: boolean;
  nextScrollHeight: number;
  previousScrollHeight: number;
  shouldRevealAnswerStart: boolean;
};

export function isScrollContainerNearBottom(
  container: ScrollContainerMetrics,
  thresholdPx = doctorRagAutoScrollThresholdPx,
) {
  return container.scrollHeight - container.scrollTop - container.clientHeight <= thresholdPx;
}

export function getDoctorRagScrollIntent({
  hasAnswer,
  isFirstAnswer,
  isLoading,
  shouldRevealAnswerStart,
  shouldStickToBottom,
}: DoctorRagScrollIntentInput): DoctorRagScrollIntent {
  if (hasAnswer && isFirstAnswer && shouldRevealAnswerStart) return "reveal-answer-start";
  if ((isLoading || hasAnswer) && shouldStickToBottom) return "scroll-bottom";
  return "none";
}

export function getDoctorRagScrollStateAfterPanelScroll({
  isAutoScrolling,
  isNearBottom,
  nextScrollHeight,
  previousScrollHeight,
  shouldRevealAnswerStart,
}: DoctorRagScrollStateAfterPanelScrollInput) {
  if (isAutoScrolling || nextScrollHeight !== previousScrollHeight) return null;

  return {
    shouldRevealAnswerStart: isNearBottom ? shouldRevealAnswerStart : false,
    shouldStickToBottom: isNearBottom,
  };
}

export function getPanelScrollTopToRevealChildStart({
  childTop,
  panelBottom,
  panelScrollTop,
  panelTop,
}: {
  childTop: number;
  panelBottom: number;
  panelScrollTop: number;
  panelTop: number;
}) {
  const paddedPanelTop = panelTop + answerStartPaddingPx;
  const comfortablePanelTop = Math.min(
    panelTop + answerStartComfortZonePx,
    panelBottom - answerStartPaddingPx,
  );

  if (childTop >= paddedPanelTop && childTop <= comfortablePanelTop) return null;

  return Math.max(0, panelScrollTop + childTop - panelTop - answerStartPaddingPx);
}
