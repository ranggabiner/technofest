import Markdown, { type Components, type UrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

const allowedMarkdownElements = [
  "a",
  "blockquote",
  "br",
  "code",
  "del",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "li",
  "ol",
  "p",
  "pre",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "ul",
];

const markdownComponents: Components = {
  a({ children, href, ...props }) {
    return (
      <a
        {...props}
        href={href}
        target={href ? "_blank" : undefined}
        rel={href ? "noopener noreferrer" : undefined}
        className="break-words font-semibold text-[var(--color-teal-deep)] underline decoration-[color-mix(in_srgb,var(--color-teal-deep)_40%,transparent)] underline-offset-2 hover:text-[var(--color-midnight)]"
      >
        {children}
      </a>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-l-2 border-[var(--color-stone-surface)] pl-3 text-[var(--color-graphite)]">
        {children}
      </blockquote>
    );
  },
  code({ children, className, ...props }) {
    const isBlockCode =
      typeof className === "string" || String(children).includes("\n");

    return (
      <code
        {...props}
        className={cn(
          isBlockCode
            ? "block min-w-max whitespace-pre font-mono text-xs leading-5"
            : "break-words rounded-md bg-[var(--color-stone-surface)] px-1.5 py-0.5 font-mono text-sm text-[var(--color-midnight)]",
          className,
        )}
      >
        {children}
      </code>
    );
  },
  h1({ children }) {
    return <h3 className="text-base font-semibold text-[var(--color-midnight)]">{children}</h3>;
  },
  h2({ children }) {
    return <h3 className="text-base font-semibold text-[var(--color-midnight)]">{children}</h3>;
  },
  h3({ children }) {
    return <h3 className="text-sm font-semibold text-[var(--color-midnight)]">{children}</h3>;
  },
  h4({ children }) {
    return <h4 className="text-sm font-semibold text-[var(--color-midnight)]">{children}</h4>;
  },
  h5({ children }) {
    return <h5 className="text-sm font-semibold text-[var(--color-midnight)]">{children}</h5>;
  },
  h6({ children }) {
    return <h6 className="text-sm font-semibold text-[var(--color-midnight)]">{children}</h6>;
  },
  hr() {
    return <hr className="border-[var(--color-stone-surface)]" />;
  },
  li({ children }) {
    return <li className="pl-1 whitespace-pre-wrap">{children}</li>;
  },
  ol({ children }) {
    return <ol className="ml-5 list-decimal space-y-1">{children}</ol>;
  },
  p({ children }) {
    return <p className="whitespace-pre-wrap">{children}</p>;
  },
  pre({ children }) {
    return (
      <pre className="max-w-full overflow-x-auto rounded-xl bg-[var(--color-stone-surface)] px-3 py-2 text-[var(--color-midnight)]">
        {children}
      </pre>
    );
  },
  table({ children }) {
    return (
      <div className="max-w-full overflow-x-auto">
        <table className="min-w-max border-collapse text-left text-xs">
          {children}
        </table>
      </div>
    );
  },
  td({ children }) {
    return (
      <td className="border border-[var(--color-stone-surface)] px-2 py-1 align-top">
        {children}
      </td>
    );
  },
  th({ children }) {
    return (
      <th className="border border-[var(--color-stone-surface)] px-2 py-1 font-semibold">
        {children}
      </th>
    );
  },
  ul({ children }) {
    return <ul className="ml-5 list-disc space-y-1">{children}</ul>;
  },
};

const safeUrlTransform: UrlTransform = (url, key) => {
  if (key !== "href") return undefined;

  try {
    const parsed = new URL(url);
    return ["http:", "https:", "mailto:"].includes(parsed.protocol) ? url : undefined;
  } catch {
    return undefined;
  }
};

export function AssistantMarkdown({ content }: { content: string }) {
  return (
    <div className="grid min-w-0 gap-2 break-words [overflow-wrap:anywhere]">
      <Markdown
        allowedElements={allowedMarkdownElements}
        components={markdownComponents}
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={safeUrlTransform}
      >
        {content}
      </Markdown>
    </div>
  );
}
