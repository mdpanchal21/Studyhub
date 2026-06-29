import { Router } from 'express'
import crypto from 'crypto'
import User from '../models/User.js'
import { generateToken } from '../utils/token.js'

const CLIENT_URL = process.env.CLIENT_URL?.split(',')[0].trim() || 'http://localhost:5173'
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000'

const router = Router()

router.get('/google', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex')
  const redirectUri = `${SERVER_URL}/api/auth/google/callback`

  res.cookie('oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60 * 1000,
  })

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
  })

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
})

router.get('/google/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query

    if (error || !code) {
      console.error('Google OAuth denied or missing code:', error)
      return res.redirect(`${CLIENT_URL}/auth`)
    }

    const storedState = req.cookies?.oauth_state
    if (!storedState || storedState !== state) {
      console.error('OAuth state mismatch - possible CSRF')
      return res.redirect(`${CLIENT_URL}/auth`)
    }
    res.clearCookie('oauth_state')

    const redirectUri = `${SERVER_URL}/api/auth/google/callback`
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text()
      console.error('Google token exchange failed:', tokenRes.status, errBody)
      return res.redirect(`${CLIENT_URL}/auth`)
    }

    const tokens = await tokenRes.json()
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!profileRes.ok) {
      console.error('Google profile fetch failed:', await profileRes.text())
      return res.redirect(`${CLIENT_URL}/auth`)
    }

    const profile = await profileRes.json()

    const googleId = String(profile.id)
    const email = (profile.email || '').toLowerCase().trim()
    const name = (profile.name || '').trim().slice(0, 100)
    const avatar = profile.picture || ''

    let user = await User.findOne({ googleId })

    if (!user) {
      user = await User.findOne({ email })
      if (user) {
        user.googleId = googleId
        if (!user.avatar) user.avatar = avatar
        await user.save()
      } else {
        user = await User.create({ name, email, googleId, avatar })
      }
    }

    const token = generateToken(user._id)
    res.redirect(`${CLIENT_URL}/auth?token=${token}`)
  } catch (error) {
    console.error('Google OAuth error:', error)
    res.redirect(`${CLIENT_URL}/auth`)
  }
})

export default router
