export default function RoomCard({ room, onClick, onLeave }) {
  return (
    <div
      className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md cursor-pointer transition"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-lg">{room.name}</h3>
          {room.topic && (
            <span className="inline-block bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded mt-1">
              {room.topic}
            </span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onLeave() }}
          className="text-xs text-gray-400 hover:text-red-500"
        >
          Leave
        </button>
      </div>
      {room.description && (
        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{room.description}</p>
      )}
      <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
        <span>{room.members?.length || 0} members</span>
        <span className="font-mono">#{room.inviteCode}</span>
      </div>
    </div>
  )
}
