import { describe, expect, it } from "vitest";

import {
  getDoctorRagScrollIntent,
  getDoctorRagScrollStateAfterPanelScroll,
  getPanelScrollTopToRevealChildStart,
  isScrollContainerNearBottom,
} from "./_components/doctor-rag-scroll";

describe("doctor RAG modal scroll behavior", () => {
  it("treats positions within the bottom threshold as sticky", () => {
    expect(
      isScrollContainerNearBottom({
        clientHeight: 500,
        scrollHeight: 1200,
        scrollTop: 620,
      }),
    ).toBe(true);

    expect(
      isScrollContainerNearBottom({
        clientHeight: 500,
        scrollHeight: 1200,
        scrollTop: 450,
      }),
    ).toBe(false);
  });

  it("reveals the opening of the first answer instead of jumping to the bottom", () => {
    expect(
      getDoctorRagScrollIntent({
        hasAnswer: true,
        isFirstAnswer: true,
        isLoading: false,
        shouldRevealAnswerStart: true,
        shouldStickToBottom: true,
      }),
    ).toBe("reveal-answer-start");

    expect(
      getDoctorRagScrollIntent({
        hasAnswer: true,
        isFirstAnswer: true,
        isLoading: false,
        shouldRevealAnswerStart: true,
        shouldStickToBottom: false,
      }),
    ).toBe("reveal-answer-start");

    expect(
      getDoctorRagScrollIntent({
        hasAnswer: true,
        isFirstAnswer: true,
        isLoading: false,
        shouldRevealAnswerStart: false,
        shouldStickToBottom: false,
      }),
    ).toBe("none");
  });

  it("auto-scrolls continuing output only while the user remains near the bottom", () => {
    expect(
      getDoctorRagScrollIntent({
        hasAnswer: true,
        isFirstAnswer: false,
        isLoading: false,
        shouldRevealAnswerStart: false,
        shouldStickToBottom: true,
      }),
    ).toBe("scroll-bottom");

    expect(
      getDoctorRagScrollIntent({
        hasAnswer: true,
        isFirstAnswer: false,
        isLoading: false,
        shouldRevealAnswerStart: false,
        shouldStickToBottom: false,
      }),
    ).toBe("none");
  });

  it("does not treat content height changes as manual upward scrolling", () => {
    expect(
      getDoctorRagScrollStateAfterPanelScroll({
        isAutoScrolling: false,
        isNearBottom: false,
        nextScrollHeight: 2400,
        previousScrollHeight: 900,
        shouldRevealAnswerStart: true,
      }),
    ).toBeNull();
  });

  it("cancels answer reveal only when user scrolling leaves the bottom zone", () => {
    expect(
      getDoctorRagScrollStateAfterPanelScroll({
        isAutoScrolling: false,
        isNearBottom: false,
        nextScrollHeight: 1200,
        previousScrollHeight: 1200,
        shouldRevealAnswerStart: true,
      }),
    ).toEqual({
      shouldRevealAnswerStart: false,
      shouldStickToBottom: false,
    });
  });

  it("calculates a panel-local scroll position that keeps the answer opening visible", () => {
    expect(
      getPanelScrollTopToRevealChildStart({
        childTop: 560,
        panelBottom: 600,
        panelScrollTop: 320,
        panelTop: 100,
      }),
    ).toBe(768);

    expect(
      getPanelScrollTopToRevealChildStart({
        childTop: 760,
        panelBottom: 600,
        panelScrollTop: 320,
        panelTop: 100,
      }),
    ).toBe(968);

    expect(
      getPanelScrollTopToRevealChildStart({
        childTop: 180,
        panelBottom: 600,
        panelScrollTop: 320,
        panelTop: 100,
      }),
    ).toBeNull();
  });
});
