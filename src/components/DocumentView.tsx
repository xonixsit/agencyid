import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface DocumentViewProps {
  content: string;
  className?: string;
  /** compact = inline previews inside cards */
  variant?: "document" | "compact";
}

/**
 * Renders agent output as a structured document:
 * numbered section headings, ruled tables, callout blockquotes,
 * proper list indentation — instead of a wall of paragraphs.
 */
export function DocumentView({ content, className, variant = "document" }: DocumentViewProps) {
  const doc = variant === "document";
  return (
    <div
      className={cn(
        "doc-view text-secondary-foreground",
        doc ? "text-sm leading-relaxed" : "text-xs leading-relaxed",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-8 first:mt-0 mb-4 pb-2 border-b border-border text-lg font-semibold tracking-tight text-foreground">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-7 first:mt-0 mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
              <span className="h-4 w-1 rounded-full bg-primary" />
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-5 mb-2 font-mono text-[11px] uppercase tracking-widest text-primary">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-4 mb-1.5 text-sm font-semibold text-foreground">{children}</h4>
          ),
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-3 ml-1 space-y-1.5 [&>li]:relative [&>li]:pl-4 [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:top-[0.55em] [&>li]:before:h-1 [&>li]:before:w-1 [&>li]:before:rounded-full [&>li]:before:bg-primary/70">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 ml-5 list-decimal space-y-1.5 marker:font-mono marker:text-primary/80">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="text-foreground/90">{children}</em>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
              {children}
            </a>
          ),
          hr: () => <hr className="my-6 border-border" />,
          blockquote: ({ children }) => (
            <blockquote className="my-4 rounded-r-md border-l-2 border-primary bg-primary/5 px-4 py-2 text-foreground/90">
              {children}
            </blockquote>
          ),
          code: ({ className: c, children }) =>
            c?.includes("language-") ? (
              <code className="block">{children}</code>
            ) : (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
                {children}
              </code>
            ),
          pre: ({ children }) => (
            <pre className="mb-4 overflow-x-auto rounded-md border border-border bg-muted/50 p-3 font-mono text-xs text-foreground">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="mb-4 overflow-x-auto rounded-md border border-border">
              <table className="w-full border-collapse text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
          th: ({ children }) => (
            <th className="border-b border-border px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border/60 px-3 py-2 align-top">{children}</td>
          ),
          tr: ({ children }) => <tr className="even:bg-muted/20">{children}</tr>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default DocumentView;
