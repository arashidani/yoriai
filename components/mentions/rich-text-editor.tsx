'use client'

import type { Editor } from '@tiptap/react'
import { EditorContent, useEditor } from '@tiptap/react'
import { AtSign, Bold, Code, Italic, Link2, List, ListOrdered, Quote } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef, useState } from 'react'
import type { MentionSelection } from '@/components/mentions/mention-candidate'
import { MentionListbox } from '@/components/mentions/mention-listbox'
import { useRichTextMentions } from '@/components/mentions/use-rich-text-mentions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { createRichTextExtensions } from '@/lib/tiptap/rich-text-extensions'
import { markdownProseClassName } from '@/lib/text/markdown-prose-class'
import { cn } from '@/lib/utils'

export type RichTextEditorMentions = MentionSelection

type RichTextEditorProps = {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  onSubmit?: () => void
  placeholder?: string
  id?: string
  disabled?: boolean
  ariaInvalid?: boolean
  ariaLabel?: string
  labelledBy?: string
  className?: string
  editorClassName?: string
  boxed?: boolean
  /** 箇条書き・番号付きリスト・引用のツールバーを表示する */
  toolbarBlocks?: boolean
  mentions?: MentionSelection
}

function isModEnter(event: KeyboardEvent) {
  return event.key === 'Enter' && (event.metaKey || event.ctrlKey) && !event.isComposing
}

function toSafeHttpUrl(raw: string): string | null {
  try {
    const url = new URL(raw)
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.href
  } catch {
    // ignore
  }
  return null
}

function clearStoredLinkMark(editor: Editor) {
  const linkMark = editor.schema.marks.link
  if (!linkMark) return
  editor.view.dispatch(editor.state.tr.removeStoredMark(linkMark))
}

function toggleBulletList(editor: Editor) {
  const chain = editor.chain().focus()
  if (editor.isActive('orderedList')) chain.toggleOrderedList()
  if (editor.isActive('blockquote')) chain.lift('blockquote')
  chain.toggleBulletList().run()
}

function toggleOrderedList(editor: Editor) {
  const chain = editor.chain().focus()
  if (editor.isActive('bulletList')) chain.toggleBulletList()
  if (editor.isActive('blockquote')) chain.lift('blockquote')
  chain.toggleOrderedList().run()
}

function toggleBlockquote(editor: Editor) {
  const chain = editor.chain().focus()
  if (editor.isActive('bulletList')) chain.toggleBulletList()
  if (editor.isActive('orderedList')) chain.toggleOrderedList()
  chain.toggleBlockquote().run()
}

function ToolbarButton({
  label,
  pressed,
  disabled,
  onClick,
  children,
}: {
  label: string
  pressed?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<button type="button" />}
        aria-label={label}
        aria-pressed={pressed}
        disabled={disabled}
        delay={0}
        className={cn(
          'flex size-8 cursor-pointer items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors',
          'hover:border-border hover:bg-accent hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          pressed && 'border-primary/40 bg-primary text-primary-foreground shadow-sm',
          disabled && 'pointer-events-none opacity-30',
        )}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onClick}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent className="px-2 py-1 text-caption font-bold">{label}</TooltipContent>
    </Tooltip>
  )
}

export function RichTextEditor({
  value,
  onChange,
  onBlur,
  onSubmit,
  placeholder,
  id,
  disabled = false,
  ariaInvalid = false,
  ariaLabel,
  labelledBy,
  className,
  editorClassName,
  boxed = true,
  toolbarBlocks = false,
  mentions,
}: RichTextEditorProps) {
  const defaultId = useId()
  const editorId = id ?? defaultId
  const lastEmittedRef = useRef(value)
  const applyingExternalRef = useRef(false)
  const onChangeRef = useRef(onChange)
  const onSubmitRef = useRef(onSubmit)
  const disabledRef = useRef(disabled)
  const mentionUiRef = useRef<ReturnType<typeof useRichTextMentions> | null>(null)
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [linkInputValue, setLinkInputValue] = useState('https://')

  onChangeRef.current = onChange
  onSubmitRef.current = onSubmit
  disabledRef.current = disabled

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    content: value,
    contentType: 'markdown',
    editable: !disabled,
    extensions: createRichTextExtensions({
      placeholder,
      blockInputRules: toolbarBlocks,
    }),
    editorProps: {
      attributes: {
        id: editorId,
        class: cn(
          'tiptap min-h-full px-3 py-3 outline-none',
          markdownProseClassName,
          editorClassName,
        ),
        role: mentions ? 'combobox' : 'textbox',
        'aria-multiline': 'true',
        ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
        ...(labelledBy ? { 'aria-labelledby': labelledBy } : {}),
      },
      handleDOMEvents: {
        keydown(_view, event) {
          if (!editor) return false
          const mentionHandled = mentionUiRef.current?.handleKeyDownRef.current(event) ?? false
          if (mentionHandled) return true
          if (
            event.key === ' ' &&
            !event.shiftKey &&
            !event.altKey &&
            !event.metaKey &&
            !event.ctrlKey &&
            !event.isComposing &&
            editor.state.selection.empty &&
            editor.isActive('link')
          ) {
            event.preventDefault()
            editor.chain().focus().unsetMark('link').insertContent(' ').run()
            clearStoredLinkMark(editor)
            return true
          }
          if (isModEnter(event)) {
            event.preventDefault()
            if (!disabledRef.current) onSubmitRef.current?.()
            return true
          }
          if (
            event.key === 'Enter' &&
            !event.shiftKey &&
            !event.altKey &&
            !event.metaKey &&
            !event.ctrlKey &&
            !event.isComposing
          ) {
            event.preventDefault()
            editor.commands.enter()
            return true
          }
          return false
        },
      },
    },
    onUpdate: ({ editor: next }) => {
      const markdown = next.isEmpty ? '' : next.getMarkdown()
      if (applyingExternalRef.current || markdown === lastEmittedRef.current) {
        lastEmittedRef.current = markdown
        mentionUiRef.current?.onDocumentChangeRef.current(markdown)
        return
      }
      lastEmittedRef.current = markdown
      onChangeRef.current(markdown)
      mentionUiRef.current?.onDocumentChangeRef.current(markdown)
    },
    onBlur,
  })

  const mentionUi = useRichTextMentions({ editor, mentions })
  mentionUiRef.current = mentionUi

  useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled)
    editor.view.dom.setAttribute('aria-disabled', String(disabled))
    if (ariaInvalid) {
      editor.view.dom.setAttribute('aria-invalid', 'true')
    } else {
      editor.view.dom.removeAttribute('aria-invalid')
    }
  }, [ariaInvalid, disabled, editor])

  useEffect(() => {
    if (!editor) return
    if (value === lastEmittedRef.current) return
    applyingExternalRef.current = true
    try {
      if (value) {
        editor.commands.setContent(value, { contentType: 'markdown' })
      } else {
        editor.commands.clearContent()
      }
      lastEmittedRef.current = value
    } finally {
      applyingExternalRef.current = false
    }
  }, [editor, value])

  function openLinkDialog() {
    if (!editor) return
    const previous = (editor.getAttributes('link').href as string | undefined) ?? 'https://'
    setLinkInputValue(previous)
    setIsLinkDialogOpen(true)
  }

  function applyLink() {
    if (!editor) return
    const trimmed = linkInputValue.trim()
    if (!trimmed) {
      editor.chain().focus().unsetLink().run()
      setIsLinkDialogOpen(false)
      return
    }
    const href = toSafeHttpUrl(trimmed)
    if (!href) return
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent(href).run()
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
    clearStoredLinkMark(editor)
    setIsLinkDialogOpen(false)
  }

  function removeLink() {
    if (!editor) return
    editor.chain().focus().unsetLink().run()
    setIsLinkDialogOpen(false)
  }

  return (
    <div
      className={cn(
        'relative',
        boxed &&
          'overflow-hidden rounded-lg border-2 border-input bg-card text-paragraph-small font-medium text-foreground transition-colors focus-within:border-border-4 focus-within:ring-3 focus-within:ring-ring',
        boxed && ariaInvalid && 'border-destructive-border ring-3 ring-ring-error',
        disabled && 'opacity-30',
        className,
      )}
      aria-invalid={ariaInvalid || undefined}
    >
      <div className="flex flex-wrap gap-0.5 border-b border-border px-1 py-1">
        <ToolbarButton
          label="太字"
          pressed={editor?.isActive('bold')}
          disabled={disabled || !editor}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="斜体"
          pressed={editor?.isActive('italic')}
          disabled={disabled || !editor}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolbarButton>
        {toolbarBlocks && (
          <>
            <ToolbarButton
              label="箇条書き"
              pressed={editor?.isActive('bulletList')}
              disabled={disabled || !editor}
              onClick={() => editor && toggleBulletList(editor)}
            >
              <List className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              label="番号付きリスト"
              pressed={editor?.isActive('orderedList')}
              disabled={disabled || !editor}
              onClick={() => editor && toggleOrderedList(editor)}
            >
              <ListOrdered className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              label="引用"
              pressed={editor?.isActive('blockquote')}
              disabled={disabled || !editor}
              onClick={() => editor && toggleBlockquote(editor)}
            >
              <Quote className="size-4" />
            </ToolbarButton>
          </>
        )}
        <ToolbarButton
          label="インラインコード"
          pressed={editor?.isActive('code')}
          disabled={disabled || !editor}
          onClick={() => editor?.chain().focus().toggleCode().run()}
        >
          <Code className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="リンク"
          pressed={editor?.isActive('link')}
          disabled={disabled || !editor}
          onClick={openLinkDialog}
        >
          <Link2 className="size-4" />
        </ToolbarButton>
        {mentions && (
          <ToolbarButton
            label="メンション"
            disabled={disabled || !editor}
            onClick={mentionUi.insertTrigger}
          >
            <AtSign className="size-4" />
          </ToolbarButton>
        )}
      </div>
      {editor ? (
        <EditorContent editor={editor} />
      ) : (
        <div className={cn('min-h-16 px-3 py-3', editorClassName)} />
      )}
      {mentionUi.isOpen && (
        <MentionListbox
          listboxId={mentionUi.listboxId}
          matches={mentionUi.matches}
          selectedIndex={mentionUi.selectedIndex}
          onSelect={mentionUi.selectCandidate}
          onHover={mentionUi.setActiveIndex}
          position={mentionUi.popupPosition}
        />
      )}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>リンクを挿入</DialogTitle>
            <DialogDescription>https:// から始まるURLを入力してください。</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={linkInputValue}
              onChange={(event) => setLinkInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return
                event.preventDefault()
                event.stopPropagation()
                applyLink()
              }}
              placeholder="https://example.com"
              autoFocus
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                キャンセル
              </Button>
              <Button type="button" variant="ghost" onClick={removeLink}>
                リンク解除
              </Button>
              <Button type="button" onClick={applyLink}>
                適用
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
