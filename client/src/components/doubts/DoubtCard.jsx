import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

export default function DoubtCard({ doubt, onResolve }) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">{doubt.title}</h4>
            <span className={`text-xs px-2 py-0.5 rounded ${
              doubt.status === 'resolved' ? 'bg-green-100 text-green-700' :
              doubt.status === 'ai_answered' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {doubt.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{doubt.description}</p>
          {doubt.aiAnswer ? (
            <div className="mt-3 bg-indigo-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-indigo-600 mb-1">AI Answer</p>
              <div className="text-sm text-gray-700 leading-relaxed break-words">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    p: ({ children }) => (
                      <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-3 list-disc pl-5 space-y-1">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-3 list-decimal pl-5 space-y-1">{children}</ol>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-lg font-bold mb-2 mt-4">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-base font-bold mb-2 mt-3">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm font-bold mb-1 mt-3">{children}</h3>
                    ),
                    h4: ({ children }) => (
                      <h4 className="text-sm font-semibold mb-1 mt-2">{children}</h4>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="mb-3 pl-4 border-l-4 border-indigo-300 text-gray-600 italic">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children, className, inline, ...props }) => {
                      if (inline) {
                        return (
                          <code className="bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded text-xs font-mono">
                            {children}
                          </code>
                        )
                      }
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      )
                    },
                    pre: ({ children }) => (
                      <pre className="mb-3 bg-gray-950 rounded-lg p-3 overflow-x-auto text-sm text-gray-100">
                        {children}
                      </pre>
                    ),
                    a: ({ children, href }) => (
                      <a
                        href={href}
                        className="text-indigo-600 underline hover:text-indigo-800"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),
                    hr: () => <hr className="my-4 border-gray-300" />,
                    table: ({ children }) => (
                      <div className="mb-3 overflow-x-auto">
                        <table className="min-w-full border-collapse border border-gray-300 text-sm">
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-gray-300 px-3 py-1.5 bg-gray-100 font-semibold text-left">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-gray-300 px-3 py-1.5">{children}</td>
                    ),
                  }}
                >
                  {doubt.aiAnswer}
                </ReactMarkdown>
                {doubt.status === 'open' && (
                  <span className="inline-block w-[2px] h-4 bg-indigo-500 animate-pulse ml-0.5 align-middle" />
                )}
              </div>
            </div>
          ) : doubt.status === 'open' ? (
            <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-dashed border-gray-200">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                <p className="text-xs text-indigo-500 font-medium">AI is thinking...</p>
              </div>
            </div>
          ) : null}
        </div>
        {doubt.status !== 'resolved' && (
          <button
            onClick={() => onResolve?.(doubt._id)}
            className="text-xs text-green-600 hover:text-green-800 ml-2 whitespace-nowrap shrink-0"
          >
            Resolve
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Asked by {doubt.user?.name} · {new Date(doubt.createdAt).toLocaleDateString()}
      </p>
    </div>
  )
}
