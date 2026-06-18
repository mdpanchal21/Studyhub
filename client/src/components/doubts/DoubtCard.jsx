export default function DoubtCard({ doubt, onResolve }) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
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
          {doubt.aiAnswer && (
            <div className="mt-3 bg-indigo-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-indigo-600 mb-1">AI Answer</p>
              <p className="text-sm text-gray-700">{doubt.aiAnswer}</p>
            </div>
          )}
        </div>
        {doubt.status !== 'resolved' && (
          <button
            onClick={() => onResolve?.(doubt._id)}
            className="text-xs text-green-600 hover:text-green-800 ml-2 whitespace-nowrap"
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
