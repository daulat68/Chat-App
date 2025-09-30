import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const VerifyOtpPage = () => {
  const navigate = useNavigate()
  const { pendingEmail, verifyOtp, resendOtp, isVerifyingOtp, isResendingOtp } = useAuthStore()
  const [otp, setOtp] = useState('')
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (!pendingEmail) navigate('/signup')
  }, [pendingEmail, navigate])

  useEffect(() => {
    let timer
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(c => c - 1), 1000)
    }
    return () => clearInterval(timer)
  }, [cooldown])

  const handleVerify = async (e) => {
    e.preventDefault()
    if (otp.trim().length !== 6) return toast.error('Enter 6 digit code')
    try {
      await verifyOtp({ email: pendingEmail, otp })
      navigate('/')
    } catch (err) {
      // error handled in store
    }
  }

  const handleResend = async () => {
    try {
      await resendOtp(pendingEmail)
      setCooldown(30) // disable for 30s
    } catch (err) {
      // error handled in store
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-base-100 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Verify your email</h2>
        <p className="mb-4">We sent a 6-digit code to <strong>{pendingEmail}</strong></p>
        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            className="input input-bordered w-full text-center text-lg tracking-widest"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
          />
          <div className="flex items-center justify-between">
            <button className="btn btn-primary" type="submit" disabled={isVerifyingOtp}>{isVerifyingOtp? 'Verifying...' : 'Verify'}</button>
            <button type="button" className="btn" onClick={handleResend} disabled={cooldown>0 || isResendingOtp}>{cooldown>0? `Resend in ${cooldown}s` : 'Resend'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VerifyOtpPage
