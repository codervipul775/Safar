import { useEditor, EditorContent, Extension } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import CharacterCount from '@tiptap/extension-character-count'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Color from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import FontFamily from '@tiptap/extension-font-family'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
// @ts-ignore
import html2pdf from 'html2pdf.js'

import { 
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Quote, Heading1, Heading2, 
  Table as TableIcon, Code, Minus, Undo, Redo, AlignLeft, AlignCenter, AlignRight, 
  AlignJustify, Link as LinkIcon, Type, Highlighter, Eraser, Printer, PaintRoller, 
  Search, ZoomIn, CheckSquare, IndentIncrease, IndentDecrease, BetweenVerticalStart,
  ChevronDown, Plus, FileDown
} from 'lucide-react'
import { useEffect, useState, useRef } from 'react'

// Custom Font Size Extension
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) return {}
              return { style: `font-size: ${attributes.fontSize}` }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize }).run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run()
      },
    }
  },
})

interface DocEditorProps {
  fileId: string
  content: string
  onContentChange: (id: string, content: string) => void
}

export default function DocEditor({ fileId, content, onContentChange }: DocEditorProps) {
  const [zoom, setZoom] = useState(100)
  const [fontSize, setFontSizeState] = useState(11)
  const pageRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Begin your architectural narrative...',
      }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      FontSize as any,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      CharacterCount,
    ],
    autofocus: 'end',
    content: content,
    onUpdate: ({ editor }) => {
      onContentChange(fileId, editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none doc-content',
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [fileId, editor, content])

  if (!editor) return null

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL:', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const changeFontSize = (delta: number) => {
    const newSize = Math.max(1, fontSize + delta)
    setFontSizeState(newSize)
    editor.chain().focus().setMark('textStyle', { fontSize: `${newSize}pt` }).run()
  }

  const downloadPdf = () => {
    if (!pageRef.current) return
    
    // Select the actual content container within the editor
    const element = pageRef.current.querySelector('.doc-page')
    if (!element) return

    const opt = {
      margin: 0,
      filename: `Safar_Doc_${fileId.slice(0, 5) || 'Studio'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }

    html2pdf().set(opt).from(element).save()
  }

  return (
    <div className="doc-editor-wrapper">
      <div className="doc-toolbar-pro">
        
        {/* Document Actions Group */}
        <div className="toolbar-group">
          <button className="toolbar-btn-pro" title="Search"><Search size={16} /></button>
          <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="toolbar-btn-pro">
            <Undo size={16} />
          </button>
          <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="toolbar-btn-pro">
            <Redo size={16} />
          </button>
          <button onClick={() => window.print()} className="toolbar-btn-pro" title="Print">
            <Printer size={16} />
          </button>
          <button onClick={downloadPdf} className="toolbar-btn-pro" title="Download as PDF">
            <FileDown size={16} />
          </button>
          <button className="toolbar-btn-pro" title="Paint Format">
            <PaintRoller size={16} />
          </button>
        </div>

        <div className="v-sep" />

        {/* Zoom Control */}
        <div className="toolbar-group">
          <div className="dropdown-sim">
            <span>{zoom}%</span>
            <ChevronDown size={12} />
            <select onChange={(e) => setZoom(parseInt(e.target.value))} value={zoom} className="hidden-select">
                <option value="50">50%</option>
                <option value="75">75%</option>
                <option value="100">100%</option>
                <option value="125">125%</option>
                <option value="150">150%</option>
                <option value="200">200%</option>
            </select>
          </div>
        </div>

        <div className="v-sep" />

        {/* Text Style Group */}
        <div className="toolbar-group">
          <div className="dropdown-sim large">
            <span>{editor.isActive('heading', { level: 1 }) ? 'Heading 1' : editor.isActive('heading', { level: 2 }) ? 'Heading 2' : 'Normal text'}</span>
            <ChevronDown size={12} />
            <select 
                onChange={(e) => {
                    const val = e.target.value
                    if (val === '0') editor.chain().focus().setParagraph().run()
                    else editor.chain().focus().toggleHeading({ level: parseInt(val) as any }).run()
                }} 
                className="hidden-select"
            >
                <option value="0">Normal text</option>
                <option value="1">Heading 1</option>
                <option value="2">Heading 2</option>
            </select>
          </div>
        </div>

        <div className="v-sep" />

        {/* Font Family */}
        <div className="toolbar-group">
          <div className="dropdown-sim large">
            <span>Arial</span>
            <ChevronDown size={12} />
            <select 
                onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()} 
                className="hidden-select"
            >
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Courier New">Courier New</option>
            </select>
          </div>
        </div>

        <div className="v-sep" />

        {/* Font Size Group */}
        <div className="toolbar-group font-size-group">
          <button onClick={() => changeFontSize(-1)} className="toolbar-btn-pro"><Minus size={14} /></button>
          <div className="font-size-box">{fontSize}</div>
          <button onClick={() => changeFontSize(1)} className="toolbar-btn-pro"><Plus size={14} /></button>
        </div>

        <div className="v-sep" />

        {/* Character Formatting */}
        <div className="toolbar-group">
          <button 
            onClick={() => editor.chain().focus().toggleBold().run()} 
            className={`toolbar-btn-pro ${editor.isActive('bold') ? 'active' : ''}`}
          >
            <Bold size={16} />
          </button>
          <button 
            onClick={() => editor.chain().focus().toggleItalic().run()} 
            className={`toolbar-btn-pro ${editor.isActive('italic') ? 'active' : ''}`}
          >
            <Italic size={16} />
          </button>
          <button 
            onClick={() => editor.chain().focus().toggleUnderline().run()} 
            className={`toolbar-btn-pro ${editor.isActive('underline') ? 'active' : ''}`}
          >
            <UnderlineIcon size={16} />
          </button>
          <div className="btn-color-wrapper">
            <Type size={16} />
            <input 
              type="color" 
              onInput={e => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
              className="color-input-hidden"
            />
          </div>
          <div className="btn-color-wrapper">
            <Highlighter size={16} />
            <input 
              type="color" 
              onInput={e => editor.chain().focus().setHighlight({ color: (e.target as HTMLInputElement).value }).run()}
              className="color-input-hidden"
            />
          </div>
        </div>

        <div className="v-sep" />

        {/* Tools & Links */}
        <div className="toolbar-group">
           <button onClick={setLink} className={`toolbar-btn-pro ${editor.isActive('link') ? 'active' : ''}`}>
            <LinkIcon size={16} />
          </button>
          <button className="toolbar-btn-pro"><ZoomIn size={16} /></button>
          <button 
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            className="toolbar-btn-pro"
          >
            <TableIcon size={16} />
          </button>
        </div>

        <div className="v-sep" />

        {/* Alignment & Lists Group */}
        <div className="toolbar-group">
          <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`toolbar-btn-pro ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`}>
            <AlignLeft size={16} />
          </button>
          <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`toolbar-btn-pro ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`}>
            <AlignCenter size={16} />
          </button>
          <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`toolbar-btn-pro ${editor.isActive('bulletList') ? 'active' : ''}`}>
            <List size={18} />
          </button>
          <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`toolbar-btn-pro ${editor.isActive('orderedList') ? 'active' : ''}`}>
            <ListOrdered size={18} />
          </button>
          <button onClick={() => editor.chain().focus().toggleTaskList().run()} className={`toolbar-btn-pro ${editor.isActive('taskList') ? 'active' : ''}`}>
            <CheckSquare size={16} />
          </button>
        </div>

        <div className="v-sep" />

        {/* Indent & Spacing */}
        <div className="toolbar-group">
          <button className="toolbar-btn-pro"><IndentDecrease size={16} /></button>
          <button className="toolbar-btn-pro"><IndentIncrease size={16} /></button>
          <button className="toolbar-btn-pro"><BetweenVerticalStart size={16} /></button>
          <button 
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            className="toolbar-btn-pro"
          >
            <Eraser size={16} />
          </button>
        </div>
      </div>

      <div className="doc-page-container fade-in" ref={pageRef}>
        <div className="doc-page-stack" style={{ transform: `scale(${zoom/100})`, transformOrigin: 'top center' }}>
            <EditorContent editor={editor} className="doc-page" />
        </div>
      </div>

      <div className="doc-footer-pro no-print">
        <div className="footer-stat">
          <Type size={12} />
          <span>{editor.storage.characterCount.words()} WORDS</span>
        </div>
        <div className="footer-v-sep" />
        <div className="footer-stat">
          <span>{editor.storage.characterCount.characters()} CHARACTERS</span>
        </div>
      </div>

      <style>{`
        .doc-editor-wrapper {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #f9fbfd;
          font-family: var(--font-ui);
        }

        .doc-toolbar-pro {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 4px 8px;
          background: #edf2fa;
          border-bottom: 1px solid #e1e4e8;
          z-index: 50;
          flex-wrap: wrap;
          margin: 8px 16px;
          border-radius: 100px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          min-height: 40px;
        }

        .v-sep { width: 1px; height: 20px; background: #c7ccd2; margin: 0 6px; }
        .toolbar-group { display: flex; gap: 1px; align-items: center; }
        
        .toolbar-btn-pro {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          color: #444746;
          transition: all 0.2s;
          background: transparent;
          border: none;
          cursor: pointer;
        }
        .toolbar-btn-pro:hover { background: rgba(0,0,0,0.08); }
        .toolbar-btn-pro.active { background: #d3e3fd; color: #041e49; }
        .toolbar-btn-pro:disabled { opacity: 0.3; cursor: not-allowed; }

        /* Dropdown Simulations */
        .dropdown-sim {
            height: 30px;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 0 8px;
            border-radius: 4px;
            font-size: 13px;
            font-weight: 500;
            color: #444746;
            cursor: pointer;
            position: relative;
            background: transparent;
        }
        .dropdown-sim:hover { background: rgba(0,0,0,0.08); }
        .dropdown-sim.large { min-width: 100px; justify-content: space-between; }
        .hidden-select {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
        }

        /* Font Size Control */
        .font-size-group {
            border: 1px solid #c7ccd2;
            border-radius: 4px;
            overflow: hidden;
            background: white;
        }
        .font-size-box {
            width: 32px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: 700;
            border-left: 1px solid #c7ccd2;
            border-right: 1px solid #c7ccd2;
        }

        .btn-color-wrapper {
            position: relative;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
        }
        .btn-color-wrapper:hover { background: rgba(0,0,0,0.08); }

        .doc-page-stack {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            padding: 40px 0 400px 0;
            transition: transform 0.2s ease-out;
        }

        .doc-page {
            width: 850px;
            min-height: 1120px;
            padding: 112px 96px; 
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            color: #1a1a1a;
        }

        /* Task List Styling */
        .doc-content ul[data-type="taskList"] {
            list-style: none;
            padding: 0;
        }
        .doc-content ul[data-type="taskList"] li {
            display: flex;
            gap: 12px;
            align-items: flex-start;
        }
        .doc-content ul[data-type="taskList"] label {
            user-select: none;
            margin-top: 4px;
        }
        .doc-content ul[data-type="taskList"] input[type="checkbox"] {
            cursor: pointer;
        }

        .doc-footer-pro {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 16px;
            padding: 10px 40px;
            background: #fff;
            border-top: 1px solid #e1e4e8;
            font-size: 10px;
            color: #70757a;
        }

        @media print {
            .doc-toolbar-pro, .doc-footer-pro, .no-print { display: none !important; }
            .doc-editor-wrapper { background: white !important; }
            .doc-page-container { padding: 0 !important; overflow: visible !important; }
            .doc-page-stack { padding: 0 !important; transform: none !important; }
            .doc-page { box-shadow: none !important; border: none !important; }
        }
      `}</style>
    </div>
  )
}
