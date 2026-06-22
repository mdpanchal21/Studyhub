import jwt from 'jsonwebtoken'
import Room from '../models/Room.js'

const SAMBA_API = 'https://api.digitalsamba.com/api/v1'

const sambaAuth = () => {
  const credentials = `${process.env.DIGITAL_SAMBA_TEAM_ID}:${process.env.DIGITAL_SAMBA_DEV_KEY}`
  return `Basic ${Buffer.from(credentials).toString('base64')}`
}

const sambaFetch = async (path, options = {}) => {
  const res = await fetch(`${SAMBA_API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: sambaAuth(),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Digital Samba API error ${res.status}: ${body}`)
  }
  return res.status === 204 ? null : res.json()
}

const generateSambaUrl = (roomUrl, roomId, user) => {
  if (!roomUrl || !roomId || !user) return roomUrl

  const token = jwt.sign(
    {
      td: process.env.DIGITAL_SAMBA_TEAM_ID,
      rd: roomId,
      ud: user._id.toString(),
      u: user.name,
      avatar: user.avatar || '',
    },
    process.env.DIGITAL_SAMBA_DEV_KEY,
    { algorithm: 'HS256', expiresIn: '24h' }
  )

  return `${roomUrl}?token=${token}`
}

export const startVideoCall = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId)
    if (!room) return res.status(404).json({ message: 'Room not found' })

    const isAdmin = room.members.some(
      (m) => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    )
    if (!isAdmin) return res.status(403).json({ message: 'Only admin can start a video call' })

    if (room.dailyRoomUrl && room.dailyRoomName) {
      sambaFetch(`/rooms/${room.dailyRoomName}`, {
        method: 'PATCH',
        body: JSON.stringify({
          chat_enabled: false,
          private_chat_enabled: false,
          private_group_chat_enabled: false,
          qa_enabled: false,
          polls_enabled: false,
          whiteboard_enabled: false,
          content_library_enabled: false,
          files_panel_enabled: false,
          shared_notes_enabled: false,
          room_reactions_enabled: false,
          recordings_enabled: false,
          screenshare_enabled: false,
          virtual_backgrounds_enabled: false,
          layout_mode_switch_enabled: false,
          language_selection_enabled: false,
          invite_participants_enabled: false,
          raise_hand_enabled: false,
          captions_enabled: false,
          simple_notifications_enabled: false,
          pin_enabled: false,
          full_screen_enabled: false,
          minimize_own_tile_enabled: false,
        }),
      }).catch(() => {})

      const url = generateSambaUrl(room.dailyRoomUrl, room.dailyRoomName, req.user)
      return res.json({ dailyRoomUrl: url })
    }

    const shortId = room._id.toString().slice(-12)
    const data = await sambaFetch('/rooms', {
      method: 'POST',
      body: JSON.stringify({
        privacy: 'public',
        friendly_url: `sh-${shortId}`,
        chat_enabled: false,
        private_chat_enabled: false,
        private_group_chat_enabled: false,
        qa_enabled: false,
        polls_enabled: false,
        whiteboard_enabled: false,
        content_library_enabled: false,
        files_panel_enabled: false,
        shared_notes_enabled: false,
        room_reactions_enabled: false,
        recordings_enabled: false,
        screenshare_enabled: false,
        virtual_backgrounds_enabled: false,
        layout_mode_switch_enabled: false,
        language_selection_enabled: false,
        invite_participants_enabled: false,
        raise_hand_enabled: false,
        captions_enabled: false,
        simple_notifications_enabled: false,
        pin_enabled: false,
        full_screen_enabled: false,
        minimize_own_tile_enabled: false,
      }),
    })

    const baseUrl = `https://${process.env.DIGITAL_SAMBA_TEAM_DOMAIN}.digitalsamba.com/${data.friendly_url}`

    room.dailyRoomUrl = baseUrl
    room.dailyRoomName = data.id
    await room.save()

    const io = req.app.get('io')
    if (io) {
      io.to(room._id.toString()).emit('video-call-started', {
        dailyRoomUrl: baseUrl,
      })
    }

    const url = generateSambaUrl(baseUrl, data.id, req.user)
    res.json({ dailyRoomUrl: url })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const endVideoCall = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId)
    if (!room) return res.status(404).json({ message: 'Room not found' })

    const isAdmin = room.members.some(
      (m) => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    )
    if (!isAdmin) return res.status(403).json({ message: 'Only admin can end a video call' })

    if (!room.dailyRoomUrl) {
      return res.status(400).json({ message: 'No active video call' })
    }

    const sambaRoomId = room.dailyRoomName
    room.dailyRoomUrl = null
    room.dailyRoomName = null
    await room.save()

    if (sambaRoomId) {
      sambaFetch(`/rooms/${sambaRoomId}`, { method: 'DELETE' }).catch(() => {})
    }

    const io = req.app.get('io')
    if (io) {
      io.to(room._id.toString()).emit('video-call-ended')
    }

    res.json({ message: 'Video call ended' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getActiveVideoCall = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId).select('dailyRoomUrl dailyRoomName')
    if (!room) return res.status(404).json({ message: 'Room not found' })

    if (!room.dailyRoomUrl || !room.dailyRoomName) {
      return res.json({ dailyRoomUrl: null })
    }

    const url = generateSambaUrl(room.dailyRoomUrl, room.dailyRoomName, req.user)
    res.json({ dailyRoomUrl: url })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
