import DoubtCard from './DoubtCard'

export default function DoubtList({
  doubts,
  onResolve,
  onRetry,
  currentPage,
  totalPages,
  total,
  onPageChange,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  userFilter,
  onUserFilterChange,
  members,
  currentUserId,
  loading,
}) {
  const getPageNumbers = () => {
    const pages = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      if (start > 2) pages.push('...')
      for (let i = start; i <= end; i++) pages.push(i)
      if (end < totalPages - 1) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="space-y-3">
      {/* Search + Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search doubts..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        >
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="ai_answered">Answered</option>
          <option value="failed">Failed</option>
          <option value="resolved">Resolved</option>
        </select>
        <select
          value={userFilter}
          onChange={(e) => onUserFilterChange(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        >
          <option value="">All Users</option>
          {members.map((m) => (
            <option key={m.user?._id} value={m.user?._id}>
              {m.user?._id === currentUserId ? 'Show mine' : m.user?.name}
            </option>
          ))}
        </select>
      </div>

      {/* Doubts list */}
      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>
      ) : doubts.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          {search || statusFilter || userFilter ? 'No doubts match your filters.' : 'No doubts yet. Ask something!'}
        </div>
      ) : (
        <div className="space-y-3">
          {doubts.map((d) => (
            <DoubtCard key={d._id} doubt={d} onResolve={onResolve} onRetry={onRetry} />
          ))}
        </div>
      )}

      {/* Pagination at bottom */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          Showing {doubts.length} of {total}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ◀
          </button>
          {getPageNumbers().map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-1 text-xs text-gray-400">...</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`px-2.5 py-1 text-xs rounded font-medium ${
                  p === currentPage
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  )
}