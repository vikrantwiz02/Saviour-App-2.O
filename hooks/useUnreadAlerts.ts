"use client"

import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db, auth } from "../firebase"

export const useUnreadAlerts = () => {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = auth.currentUser
    if (!user) {
      setLoading(false)
      return () => {}
    }

    const userAlertsCollection = collection(db, `users/${user.uid}/alerts`)
    const unreadQuery = query(userAlertsCollection, where("isRead", "==", false))

    const unsubscribe = onSnapshot(
      unreadQuery,
      (snapshot) => {
        setUnreadCount(snapshot.docs.length)
        setLoading(false)
      },
      (error) => {
        console.error("Error getting unread alerts:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  return { unreadCount, loading }
}
