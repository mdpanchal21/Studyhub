export default function MemberList({ members }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Members</h4>
      <div className="space-y-2">
        {members?.map((m) => (
          <div key={m.user?._id} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold">
              {m.user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium">{m.user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{m.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
