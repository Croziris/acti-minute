import React from 'react';

interface RichText {
  text: string;
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
  href?: string | null;
}

interface NotionBlock {
  id: string;
  type: string;
  rich_text?: RichText[];
  image?: {
    url?: string;
    caption?: string;
  };
}

interface NotionRendererProps {
  blocks?: NotionBlock[];
}

const RichTextRenderer: React.FC<{ richText: RichText[] }> = ({ richText }) => {
  return (
    <>
      {richText.map((rt, idx) => {
        let element = rt.text;
        let className = '';
        
        if (rt.annotations.bold) className += ' font-bold';
        if (rt.annotations.italic) className += ' italic';
        if (rt.annotations.strikethrough) className += ' line-through';
        if (rt.annotations.underline) className += ' underline';
        if (rt.annotations.code) {
          return (
            <code key={idx} className="px-1.5 py-0.5 rounded bg-muted font-mono text-sm">
              {rt.text}
            </code>
          );
        }

        const textElement = (
          <span key={idx} className={className.trim()}>
            {rt.text}
          </span>
        );

        if (rt.href) {
          return (
            <a
              key={idx}
              href={rt.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {textElement}
            </a>
          );
        }

        return textElement;
      })}
    </>
  );
};

export const NotionRenderer: React.FC<NotionRendererProps> = ({ blocks = [] }) => {
  if (!blocks || blocks.length === 0) {
    return <p className="text-muted-foreground">Aucun contenu disponible.</p>;
  }

  return (
    <div className="notion-content space-y-4">
      {blocks.map((block) => {
        switch (block.type) {
          case 'heading_1':
            return (
              <h1 key={block.id} className="text-3xl font-bold mt-8 mb-4">
                {block.rich_text && <RichTextRenderer richText={block.rich_text} />}
              </h1>
            );

          case 'heading_2':
            return (
              <h2 key={block.id} className="text-2xl font-bold mt-6 mb-3">
                {block.rich_text && <RichTextRenderer richText={block.rich_text} />}
              </h2>
            );

          case 'heading_3':
            return (
              <h3 key={block.id} className="text-xl font-bold mt-4 mb-2">
                {block.rich_text && <RichTextRenderer richText={block.rich_text} />}
              </h3>
            );

          case 'paragraph':
            return (
              <p key={block.id} className="text-foreground leading-relaxed mb-4">
                {block.rich_text && <RichTextRenderer richText={block.rich_text} />}
              </p>
            );

          case 'bulleted_list_item':
            return (
              <li key={block.id} className="ml-6 list-disc text-foreground leading-relaxed">
                {block.rich_text && <RichTextRenderer richText={block.rich_text} />}
              </li>
            );

          case 'numbered_list_item':
            return (
              <li key={block.id} className="ml-6 list-decimal text-foreground leading-relaxed">
                {block.rich_text && <RichTextRenderer richText={block.rich_text} />}
              </li>
            );

          case 'quote':
            return (
              <blockquote key={block.id} className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">
                {block.rich_text && <RichTextRenderer richText={block.rich_text} />}
              </blockquote>
            );

          case 'callout':
            return (
              <div key={block.id} className="bg-muted rounded-lg p-4 my-4">
                {block.rich_text && <RichTextRenderer richText={block.rich_text} />}
              </div>
            );

          case 'code':
            return (
              <pre key={block.id} className="bg-muted rounded-lg p-4 overflow-x-auto my-4">
                <code className="font-mono text-sm">
                  {block.rich_text?.map(rt => rt.text).join('')}
                </code>
              </pre>
            );

          case 'divider':
            return <hr key={block.id} className="my-8 border-border" />;

          case 'image':
            if (!block.image?.url) return null;
            return (
              <figure key={block.id} className="my-6">
                <img
                  src={block.image.url}
                  alt={block.image.caption || ''}
                  className="w-full rounded-lg"
                />
                {block.image.caption && (
                  <figcaption className="text-sm text-muted-foreground text-center mt-2">
                    {block.image.caption}
                  </figcaption>
                )}
              </figure>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};
