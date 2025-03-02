import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "./ui/button"
import { Code, Save } from "lucide-react"
import Editor, { Monaco } from "@monaco-editor/react"

const EXPRESSION_LANGUAGE_NAME = "simpleExpressionLanguage"

const handleEditorWillMount = (monaco: Monaco) => {
  // Register the language
  monaco.languages.register({ id: EXPRESSION_LANGUAGE_NAME });

  // Define tokenization rules
  monaco.languages.setMonarchTokensProvider(EXPRESSION_LANGUAGE_NAME, {
    tokenizer: {
      root: [
        [/\bBEGIN\b/, 'keyword'],
        [/\bEND\b/, 'keyword'],
        [/\bRETURN\b/, 'keyword'],
        [/\bCASE\b/, 'keyword'],
        [/\bWHEN\b/, 'keyword'],
        [/\bTHEN\b/, 'keyword'],
        [/\bELSE\b/, 'keyword'],
        [/\bAND\b|\bOR\b|\bNOT\b/, 'logicalOperator'], // Logical operators
        [/[a-zA-Z_][a-zA-Z0-9_]*/, 'identifier'], // Variables and function names
        [/[0-9]+/, 'number'], // Numbers
        [/[+-/*^%=<>!]+/, 'operator'], // Mathematical operators
        [/".*?"/, 'string'], // Double-quoted strings
        [/\/\/.*/, 'comment'], // Single-line comments
        [/\/\*[\s\S]*?\*\//, 'comment'], // Multi-line comments
      ],
    },
  })

  // Language configuration (brackets, auto-closing pairs)
  monaco.languages.setLanguageConfiguration(EXPRESSION_LANGUAGE_NAME, {
    brackets: [
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '(', close: ')' },
      { open: '"', close: '"' },
    ],
    surroundingPairs: [
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
  })

  // Auto-completion
  monaco.languages.registerCompletionItemProvider(EXPRESSION_LANGUAGE_NAME, {
    provideCompletionItems: (model, position) => {
      // Get the text up to the cursor
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endLineNumber: position.lineNumber,
        endColumn: word.endColumn,
      };
  
      // Define the suggestions
      const suggestions = [
        {
          label: 'BEGIN',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'BEGIN',
          detail: 'Block Start',
          range,
        },
        {
          label: 'END',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'END',
          detail: 'Block End',
          range,
        },
        {
          label: 'RETURN',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'RETURN ',
          detail: 'Return a value',
          range,
        },
        {
          label: 'CASE',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'CASE ',
          detail: 'Case statement',
          range,
        },
        {
          label: 'WHEN',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'WHEN ',
          detail: 'Case condition',
          range,
        },
        {
          label: 'THEN',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'THEN ',
          detail: 'Case result',
          range,
        },
        {
          label: 'SUM',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'SUM(${1:arg1}, ${2:arg2})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: 'Sum Function',
          documentation: 'Adds two numbers.',
          range,
        },
      ];
  
      return { suggestions };
    },
  })  
}

// const validateCode = (code) => {
//   try {
//     const result = myPeggyParser.parse(code) // Your Peggy parser
//     console.log('Parsed successfully:', result)
//     return [];
//   } catch (error) {
//     console.error('Parse error:', error);
//     return [
//       {
//         startLineNumber: error.location.start.line,
//         startColumn: error.location.start.column,
//         endLineNumber: error.location.end.line,
//         endColumn: error.location.end.column,
//         message: error.message,
//         severity: monaco.MarkerSeverity.Error,
//       },
//     ]
//   }
// }

// const handleEditorChange = (value, event) => {
//   const markers = validateCode(value);
//   monaco.editor.setModelMarkers(editor.getModel(), 'customLanguage', markers);
// }

const ExpressionEditor = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary"><Code /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Expression Editor</DialogTitle>
          <DialogDescription>
            Here, you can add and edit expressions
          </DialogDescription>
        </DialogHeader>
        <div className="h-96">
          <Editor
            theme="vs-dark"
            className="h-full" 
            defaultLanguage={EXPRESSION_LANGUAGE_NAME}
            defaultValue={'BEGIN\n  RETURN 1\nEND'}
            beforeMount={handleEditorWillMount}
          />
        </div>
        <div className="flex justify-end">
          <Button>
            <Save />
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ExpressionEditor