import { useState } from 'react'

export default function VideoCall({ roomId, roomName }) {
  const [showJitsi, setShowJitsi] = useState(false)

  const isInsecureHttp =
    location.protocol === 'http:' &&
    location.hostname !== 'localhost' &&
    location.hostname !== '127.0.0.1'

  return (
    <div>
      {!showJitsi ? (
        <div>
          <button
            onClick={() => setShowJitsi(true)}
            className="w-full py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
          >
            Start Video Call
          </button>
          {isInsecureHttp && (
            <p className="text-xs text-amber-600 mt-2">
              Camera requires HTTPS. For video calls, access via{' '}
              <code className="bg-gray-100 px-1 rounded">http://localhost:5173</code>{' '}
              instead of your IP, or{' '}
              <a href="https://localhost:5173" className="underline">try HTTPS</a>.
              Screen share works in Jitsi once connected.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-green-600">Video Call Active</p>
            <button
              onClick={() => setShowJitsi(false)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              End Call
            </button>
          </div>
          <iframe
            src={`https://meet.jit.si/StudyHub_${roomId}#config.startWithAudioMuted=true&config.startWithVideoMuted=true`}
            allow="camera; microphone; fullscreen; display-capture"
            className="w-full h-80 rounded-xl border"
            title={`Video call - ${roomName}`}
          />
        </div>
      )}
    </div>
  )
}
