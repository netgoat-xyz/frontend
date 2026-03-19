'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'motion/react'

interface CounterProps {
  from?: number
  to: number
  duration?: number
  className?: string
  suffix?: string
  prefix?: string
}

export function Counter({ 
  from = 0, 
  to, 
  duration = 2, 
  className = '',
  suffix = '',
  prefix = ''
}: CounterProps) {
  const [count, setCount] = useState(from)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!isInView || hasAnimated.current) return
    
    hasAnimated.current = true
    const startTime = Date.now()
    const endTime = startTime + duration * 1000
    
    const timer = setInterval(() => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / (endTime - startTime), 1)
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentCount = Math.floor(from + (to - from) * easeOut)
      
      setCount(currentCount)
      
      if (progress === 1) {
        clearInterval(timer)
        setCount(to)
      }
    }, 16) // ~60fps
    
    return () => clearInterval(timer)
  }, [isInView, from, to, duration])

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
    }
    return num.toString()
  }

  return (
    <div ref={ref} className={className}>
      {prefix}{formatNumber(count)}{suffix}
    </div>
  )
}
