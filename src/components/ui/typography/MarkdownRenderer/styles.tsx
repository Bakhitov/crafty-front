'use client'

import React, { FC, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

import type {
  UnorderedListProps,
  OrderedListProps,
  EmphasizedTextProps,
  ItalicTextProps,
  StrongTextProps,
  BoldTextProps,
  DeletedTextProps,
  UnderlinedTextProps,
  HorizontalRuleProps,
  BlockquoteProps,
  AnchorLinkProps,
  HeadingProps,
  ImgProps,
  ParagraphProps,
  TableHeaderCellProps,
  TableProps,
  TableHeaderProps,
  TableBodyProps,
  TableRowProps,
  TableCellProps
} from './types'

import { HEADING_SIZES } from '../Heading/constants'
import { PARAGRAPH_SIZES } from '../Paragraph/constants'

const filterProps = (props: object) => {
  const newProps = { ...props }

  if ('node' in newProps) {
    delete newProps.node
  }

  return newProps
}

const UnorderedList = ({ className, ...props }: UnorderedListProps) => (
  <ul
    className={cn(
      className,
      PARAGRAPH_SIZES.body,
      'my-1 flex list-disc flex-col pl-10'
    )}
    {...filterProps(props)}
  />
)

const OrderedList = ({ className, ...props }: OrderedListProps) => (
  <ol
    className={cn(
      className,
      PARAGRAPH_SIZES.body,
      'my-1 flex list-decimal flex-col pl-10'
    )}
    {...filterProps(props)}
  />
)

const Paragraph = ({ className, ...props }: ParagraphProps) => (
  <div
    className={cn(className, PARAGRAPH_SIZES.body, 'mb-2')}
    {...filterProps(props)}
  />
)

const EmphasizedText = ({ className, ...props }: EmphasizedTextProps) => (
  <em
    className={cn(className, 'text-sm font-semibold')}
    {...filterProps(props)}
  />
)

const ItalicText = ({ className, ...props }: ItalicTextProps) => (
  <i
    className={cn(className, 'italic', PARAGRAPH_SIZES.body)}
    {...filterProps(props)}
  />
)

const StrongText = ({ className, ...props }: StrongTextProps) => (
  <strong
    className={cn(className, 'text-sm font-semibold')}
    {...filterProps(props)}
  />
)

const BoldText = ({ className, ...props }: BoldTextProps) => (
  <b
    className={cn(className, 'text-sm font-semibold')}
    {...filterProps(props)}
  />
)

const UnderlinedText = ({ className, ...props }: UnderlinedTextProps) => (
  <u
    className={cn(className, 'underline', PARAGRAPH_SIZES.body)}
    {...filterProps(props)}
  />
)

const DeletedText = ({ className, ...props }: DeletedTextProps) => (
  <del
    className={cn(className, 'text-muted line-through', PARAGRAPH_SIZES.body)}
    {...filterProps(props)}
  />
)

const HorizontalRule = ({ className, ...props }: HorizontalRuleProps) => (
  <hr
    className={cn(className, 'border-border mx-auto w-48 border-b')}
    {...filterProps(props)}
  />
)

const InlineCode: FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <code className="bg-background-secondary/60 text-foreground border-border/10 relative whitespace-pre-wrap rounded-md border px-2 py-1 text-sm font-medium">
      {children}
    </code>
  )
}

const CodeBlock: FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className
}) => {
  const language = className?.replace('language-', '') || 'text'

  // Extract text content from children
  let code = ''
  if (typeof children === 'string') {
    code = children
  } else if (React.isValidElement(children)) {
    const element = children as React.ReactElement<{ children?: string }>
    code =
      typeof element.props.children === 'string' ? element.props.children : ''
  }

  return (
    <div className="border-border/10 bg-background-secondary/20 my-3 w-full max-w-full overflow-hidden rounded-lg border shadow-sm">
      {/* Header with language label */}
      {language && language !== 'text' && (
        <div className="border-border/10 bg-background-secondary/30 flex items-center justify-between border-b px-4 py-2.5">
          <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            {language}
          </span>
          <div className="flex space-x-1">
            <div className="h-2 w-2 rounded-full bg-red-500/40"></div>
            <div className="h-2 w-2 rounded-full bg-yellow-500/40"></div>
            <div className="h-2 w-2 rounded-full bg-green-500/40"></div>
          </div>
        </div>
      )}

      <div className="relative">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1.25rem',
            backgroundColor: 'hsl(var(--background))',
            fontSize: '0.875rem',
            lineHeight: '1.6',
            fontFamily:
              '"Fira Code", "JetBrains Mono", "Cascadia Code", "SF Mono", Consolas, monospace',
            borderRadius: '0 0 0.5rem 0.5rem'
          }}
          showLineNumbers={code.split('\n').length > 3}
          lineNumberStyle={{
            color: 'hsl(var(--muted-foreground))',
            fontSize: '0.75rem',
            paddingRight: '1rem',
            userSelect: 'none',
            opacity: 0.6
          }}
          wrapLines
          wrapLongLines
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

const Blockquote = ({ className, ...props }: BlockquoteProps) => (
  <blockquote
    className={cn(
      className,
      'border-primary/30 bg-background-secondary/30 text-muted-foreground my-2 rounded-r-md border-l-4 py-2 pl-4 italic',
      PARAGRAPH_SIZES.body
    )}
    {...filterProps(props)}
  />
)

const AnchorLink = ({ className, ...props }: AnchorLinkProps) => (
  <a
    className={cn(className, 'cursor-pointer text-xs underline')}
    target="_blank"
    rel="noopener noreferrer"
    {...filterProps(props)}
  />
)

const Heading1 = ({ className, ...props }: HeadingProps) => (
  <h1
    className={cn(className, HEADING_SIZES[3], 'mb-2 mt-6 first:mt-0')}
    {...filterProps(props)}
  />
)

const Heading2 = ({ className, ...props }: HeadingProps) => (
  <h2
    className={cn(className, HEADING_SIZES[3], 'mb-2 mt-6 first:mt-0')}
    {...filterProps(props)}
  />
)

const Heading3 = ({ className, ...props }: HeadingProps) => (
  <h3
    className={cn(className, PARAGRAPH_SIZES.lead, 'mb-1.5 mt-5 first:mt-0')}
    {...filterProps(props)}
  />
)

const Heading4 = ({ className, ...props }: HeadingProps) => (
  <h4
    className={cn(className, PARAGRAPH_SIZES.lead, 'mb-1.5 mt-5 first:mt-0')}
    {...filterProps(props)}
  />
)

const Heading5 = ({ className, ...props }: HeadingProps) => (
  <h5
    className={cn(className, PARAGRAPH_SIZES.title, 'mb-1 mt-4 first:mt-0')}
    {...filterProps(props)}
  />
)

const Heading6 = ({ className, ...props }: HeadingProps) => (
  <h6
    className={cn(className, PARAGRAPH_SIZES.title, 'mb-1 mt-4 first:mt-0')}
    {...filterProps(props)}
  />
)

const Img = ({ src, alt }: ImgProps) => {
  const [error, setError] = useState(false)

  if (!src || typeof src !== 'string') return null

  return (
    <div className="w-full max-w-xl">
      {error ? (
        <div className="bg-secondary/50 text-muted flex h-40 flex-col items-center justify-center gap-2 rounded-md">
          <Paragraph className="text-primary">Image unavailable</Paragraph>
          <Link
            href={src}
            target="_blank"
            className="max-w-md truncate underline"
          >
            {src}
          </Link>
        </div>
      ) : (
        <Image
          src={src}
          width={1280}
          height={720}
          alt={alt ?? 'Rendered image'}
          className="size-full rounded-md object-cover"
          onError={() => setError(true)}
          unoptimized
        />
      )}
    </div>
  )
}

const Table = ({ className, ...props }: TableProps) => (
  <div className="border-border w-full max-w-[560px] overflow-hidden rounded-md border">
    <div className="w-full overflow-x-auto">
      <table className={cn(className, 'w-full')} {...filterProps(props)} />
    </div>
  </div>
)

const TableHead = ({ className, ...props }: TableHeaderProps) => (
  <thead
    className={cn(
      className,
      'border-border rounded-md border-b bg-transparent p-2 text-left text-sm font-[600]'
    )}
    {...filterProps(props)}
  />
)

const TableHeadCell = ({ className, ...props }: TableHeaderCellProps) => (
  <th
    className={cn(className, 'p-2 text-sm font-[600]')}
    {...filterProps(props)}
  />
)

const TableBody = ({ className, ...props }: TableBodyProps) => (
  <tbody className={cn(className, 'text-xs')} {...filterProps(props)} />
)

const TableRow = ({ className, ...props }: TableRowProps) => (
  <tr
    className={cn(className, 'border-border border-b last:border-b-0')}
    {...filterProps(props)}
  />
)

const TableCell = ({ className, ...props }: TableCellProps) => (
  <td
    className={cn(className, 'whitespace-nowrap p-2 font-[400]')}
    {...filterProps(props)}
  />
)

export const components = {
  h1: Heading1,
  h2: Heading2,
  h3: Heading3,
  h4: Heading4,
  h5: Heading5,
  h6: Heading6,
  ul: UnorderedList,
  ol: OrderedList,
  em: EmphasizedText,
  i: ItalicText,
  strong: StrongText,
  b: BoldText,
  u: UnderlinedText,
  del: DeletedText,
  hr: HorizontalRule,
  blockquote: Blockquote,
  code: InlineCode,
  pre: CodeBlock,
  a: AnchorLink,
  img: Img,
  p: Paragraph,
  table: Table,
  thead: TableHead,
  th: TableHeadCell,
  tbody: TableBody,
  tr: TableRow,
  td: TableCell
}
