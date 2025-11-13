import React, { useState, useEffect } from 'react'

const HackathonTimer = ({ toDate = '2026-03-15T00:00:00+05:30' }) => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(new Date(toDate).getTime()))

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(new Date(toDate).getTime()))
    }, 1000)
    return () => clearInterval(timer)
  }, [toDate])

  function getTimeRemaining(target) {
    const now = Date.now()
    const diff = Math.max(0, target - now)
    const seconds = Math.floor((diff / 1000) % 60)
    const minutes = Math.floor((diff / 1000 / 60) % 60)
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    return { days, hours, minutes, seconds }
  }

  const getDigitBlockStyle = () => {
    if (windowWidth >= 1024) {
      return { width: 72, height: 96, fontSize: 32 }
    } else if (windowWidth >= 640) {
      return { width: 60, height: 78, fontSize: 24 }
    }
    return { width: 48, height: 58, fontSize: 18 }
  }

  const getLabelStyle = () => {
    if (windowWidth >= 1024) return { fontSize: 16 }
    if (windowWidth >= 640) return { fontSize: 14 }
    return { fontSize: 12 }
  }

  const blockStyle = getDigitBlockStyle()
  const labelStyle = getLabelStyle()

  const Digit = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div
        className="flex items-center justify-center rounded-md bg-gray-100 text-[#0B2A4A] font-semibold"
        style={{ width: blockStyle.width, height: blockStyle.height, fontSize: blockStyle.fontSize }}
      >
        {String(value).padStart(2, '0')}
      </div>
      <div className="mt-2 text-gray-600" style={labelStyle}>{label}</div>
    </div>
  )

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex items-center gap-4">
        <Digit value={timeLeft.days} label="Days" />
        <Digit value={timeLeft.hours} label="Hours" />
        <Digit value={timeLeft.minutes} label="Minutes" />
        <Digit value={timeLeft.seconds} label="Seconds" />
      </div>
    </div>
  )
}

export default HackathonTimer
