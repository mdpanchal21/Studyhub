import toast from 'react-hot-toast'

export default function RoomCard({ room, onClick, onLeave }) {
  return (
    <div
      className="surface cursor-pointer rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-teal-400/30"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">{room.name}</h3>
          {room.topic && (
            <span className="badge-soft mt-2 inline-block">
              {room.topic}
            </span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onLeave() }}
          className="text-xs text-slate-400 transition hover:text-rose-300"
        >
          Leave
        </button>
      </div>
      {room.description && (
        <p className="mt-2 line-clamp-2 text-sm text-slate-400">{room.description}</p>
      )}
      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>{room.members?.length || 0} members</span>
        <span className="relative group">
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigator.clipboard.writeText(`${window.location.origin}/join/${room.inviteCode}`)
              toast.success('Invite link copied!')
            }}
            className="font-mono text-slate-400 transition hover:text-teal-300"
          >
            #{room.inviteCode}
          </button>
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-white/10 bg-slate-950 px-2 py-1 text-[10px] text-slate-100 opacity-0 transition pointer-events-none group-hover:opacity-100">
            Copy invite link
          </span>
        </span>
      </div>
    </div>
  )
}
