import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./markdown.css";

type MarkdownContentProps = {
  content: string;
  className?: string;
};

// Only absolute web links are navigable; other schemes and relative URLs stay text.
function safeUrl(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}

export default function MarkdownContent({ content, className }: MarkdownContentProps) {
  return <div className={["markdown-content", className].filter(Boolean).join(" ")}>
    <Markdown remarkPlugins={[remarkGfm]} skipHtml urlTransform={safeUrl} components={{
      a: ({ href, children }) => href
        ? <a href={href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">{children}</a>
        : <span>{children}</span>,
      img: ({ alt }) => <span className="markdown-image">[이미지 자동 로딩 안 함{alt ? `: ${alt}` : ""}]</span>,
      table: ({ children }) => <div className="markdown-table-scroll" role="region" aria-label="Markdown 표" tabIndex={0}><table>{children}</table></div>,
      pre: ({ children }) => <pre tabIndex={0} aria-label="코드 블록">{children}</pre>,
    }}>{content}</Markdown>
  </div>;
}
