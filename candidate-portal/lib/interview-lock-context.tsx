"use client"

import React, { createContext, useCallback, useContext, useState } from "react"

interface InterviewLockContextValue {
  /** True while a mock interview is actively running. */
  isLocked: boolean
  /** Called by MockInterviewClient to enter / leave the lock. */
  setLocked: (locked: boolean) => void
}

const InterviewLockContext = createContext<InterviewLockContextValue>({
  isLocked: false,
  setLocked: () => {},
})

export function InterviewLockProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false)

  const setLocked = useCallback((locked: boolean) => {
    setIsLocked(locked)
  }, [])

  return (
    <InterviewLockContext.Provider value={{ isLocked, setLocked }}>
      {children}
    </InterviewLockContext.Provider>
  )
}

export function useInterviewLock() {
  return useContext(InterviewLockContext)
}
