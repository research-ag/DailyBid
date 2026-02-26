import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useToast } from '@chakra-ui/react'
import { ActorSubclass } from '@icp-sdk/core/agent'
import icWebPush from '@research-ag/ic-web-push'
import i18next from 'i18next'
import { useSelector } from 'react-redux'

import type { _SERVICE as AuctionService } from '../../declarations/icrc1_auction/icrc1_auction.did'
import { RootState } from '../store'
import { getActor, getAuctionCanisterId } from '../utils/canisterUtils'
import { getSimpleToastDescription } from '../utils/uiUtils'

export type NotificationState = {
  isLibSubscribed: boolean | null
  isCanisterEnabled: boolean | null
  isSubscribed: boolean
  loading: boolean
  disabling: boolean
  enabling: boolean
  error: string | null
  canUse: boolean
  refresh: () => Promise<void>
  enable: () => Promise<void>
  disable: () => Promise<void>
}

export default function useWebPushNotifications(): NotificationState {
  const { isAuthenticated, userAgent, userPrincipal } = useSelector(
    (state: RootState) => state.auth,
  )
  const libRef = useRef<any>(icWebPush || null)
  const toast = useToast({
    duration: 10000,
    position: 'top-right',
    isClosable: true,
  })

  const lastInitAgentRef = useRef<any | null>(null)
  const lastInitAppIdRef = useRef<string | null>(null)

  const [isLibSubscribed, setIsLibSubscribed] = useState<boolean | null>(null)
  const [isCanisterEnabled, setIsCanisterEnabled] = useState<boolean | null>(
    null,
  )
  const [loading, setLoading] = useState(false)
  const [enabling, setEnabling] = useState(false)
  const [disabling, setDisabling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [auctionCanisterId, setAuctionCanisterId] = useState<string | null>(
    null,
  )

  const canUse = isAuthenticated

  useEffect(() => {
    const current = getAuctionCanisterId()
    setAuctionCanisterId(current)

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'auctionCanisterId') {
        const next = getAuctionCanisterId()
        setAuctionCanisterId(next)
      }
    }
    const onLocalChange = () => {
      const next = getAuctionCanisterId()
      setAuctionCanisterId(next)
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener(
      'auctionCanisterIdChanged',
      onLocalChange as EventListener,
    )
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(
        'auctionCanisterIdChanged',
        onLocalChange as EventListener,
      )
    }
  }, [])

  const ensureInitialized = useCallback(async () => {
    const lib = libRef.current
    if (!lib || !lib.init) return
    if (!userAgent || !auctionCanisterId) return

    const needsInit =
      lastInitAgentRef.current !== userAgent ||
      lastInitAppIdRef.current !== auctionCanisterId

    if (!needsInit) return

    try {
      await lib.init({
        agent: userAgent,
        applicationCanisterId: auctionCanisterId,
      })
      await lib.registerServiceWorker?.()
      lastInitAgentRef.current = userAgent
      lastInitAppIdRef.current = auctionCanisterId
    } catch (e) {
      console.warn('[WebPush] init/registerServiceWorker failed:', e)
    }
  }, [userAgent, auctionCanisterId])

  const refresh = useCallback(async () => {
    setError(null)
    if (!isAuthenticated) {
      setIsLibSubscribed(null)
      setIsCanisterEnabled(null)
      return
    }

    setLoading(true)
    try {
      await ensureInitialized()
      if (libRef.current?.isSubscribed) {
        try {
          const v = await libRef.current.isSubscribed()
          setIsLibSubscribed(!!v)
        } catch (e) {
          console.warn('[WebPush] isSubscribed failed:', e)
          setIsLibSubscribed(false)
        }
      } else {
        setIsLibSubscribed(false)
      }
      if (userAgent && auctionCanisterId) {
        try {
          const actor = getActor(
            userAgent,
            auctionCanisterId,
          ) as ActorSubclass<AuctionService>
          const settings = await actor.getUserSettings()
          setIsCanisterEnabled(settings.pushNotificationsEnabled)
        } catch (e: any) {
          setIsCanisterEnabled(false)
        }
      } else {
        setIsCanisterEnabled(false)
      }
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, userAgent, auctionCanisterId, ensureInitialized])

  useEffect(() => {
    refresh().then()
  }, [userPrincipal, auctionCanisterId, userAgent])

  const enable = useCallback(async () => {
    if (!canUse) return
    setError(null)
    setEnabling(true)

    const startTime = Date.now()
    const pendingTitle = i18next.t('Enable notifications pending')
    const pendingDesc = i18next.t('Please wait...')
    const toastId = toast({
      title: pendingTitle,
      description: pendingDesc,
      status: 'loading',
      duration: null,
      isClosable: true,
      position: 'top-right',
    })

    try {
      await ensureInitialized()
      let ok = true
      if (libRef.current?.ensureSubscribed) {
        await libRef.current.ensureSubscribed({
          requestPermissionIfNeeded: true,
        })
        ok = true
      } else if (libRef.current?.subscribe) {
        ok = !!(await libRef.current.subscribe({
          requestPermissionIfNeeded: true,
        }))
      }
      if (!ok) {
        throw new Error('Failed to enable browser notifications')
      }
      if (userAgent && auctionCanisterId) {
        try {
          const actor = getActor(
            userAgent,
            auctionCanisterId,
          ) as unknown as import('@icp-sdk/core/agent').ActorSubclass<AuctionService>
          await actor.updateUserSettings({ pushNotificationsEnabled: [true] })
        } catch (e: any) {
          libRef.current?.unsubscribe?.()
          throw e
        }
      }
      await refresh()

      const durationInSeconds = (Date.now() - startTime) / 1000
      if (toastId) {
        toast.update(toastId, {
          title: i18next.t('Success'),
          description: getSimpleToastDescription(
            i18next.t('Notifications enabled'),
            durationInSeconds,
          ),
          status: 'success',
          isClosable: true,
        })
      }
    } catch (e: any) {
      const message = e?.message || i18next.t('Failed to enable notifications')
      setError(message)
      const durationInSeconds = (Date.now() - startTime) / 1000
      if (toastId) {
        toast.update(toastId, {
          title: i18next.t('Enable notifications rejected'),
          description: getSimpleToastDescription(message, durationInSeconds),
          status: 'error',
          isClosable: true,
        })
      }
    } finally {
      setEnabling(false)
    }
  }, [canUse, userAgent, auctionCanisterId, refresh, ensureInitialized, toast])

  const disable = useCallback(async () => {
    if (!canUse) return
    setError(null)
    setDisabling(true)

    const startTime = Date.now()
    const pendingTitle = i18next.t('Disable notifications pending')
    const pendingDesc = i18next.t('Please wait...')
    const toastId = toast({
      title: pendingTitle,
      description: pendingDesc,
      status: 'loading',
      duration: null,
      isClosable: true,
      position: 'top-right',
    })

    try {
      await ensureInitialized()
      if (libRef.current?.unsubscribe) {
        await libRef.current.unsubscribe()
      }
      if (userAgent && auctionCanisterId) {
        try {
          const actor = getActor(
            userAgent,
            auctionCanisterId,
          ) as unknown as import('@icp-sdk/core/agent').ActorSubclass<AuctionService>
          await actor.updateUserSettings({ pushNotificationsEnabled: [false] })
        } catch (e: any) {
          try {
            if (libRef.current?.ensureSubscribed) {
              await libRef.current.ensureSubscribed({
                requestPermissionIfNeeded: false,
              })
            } else {
              const ok = await libRef.current?.subscribe?.()
              if (!ok) throw new Error('Resubscribe failed')
            }
          } catch {
            // pass
          }
          throw e
        }
      }
      await refresh()

      const durationInSeconds = (Date.now() - startTime) / 1000
      if (toastId) {
        toast.update(toastId, {
          title: i18next.t('Success'),
          description: getSimpleToastDescription(
            i18next.t('Notifications disabled'),
            durationInSeconds,
          ),
          status: 'success',
          isClosable: true,
        })
      }
    } catch (e: any) {
      console.error('[WebPush] disable failed:', e)
      const message = e?.message || i18next.t('Failed to disable notifications')
      setError(message)
      const durationInSeconds = (Date.now() - startTime) / 1000
      if (toastId) {
        toast.update(toastId, {
          title: i18next.t('Disable notifications rejected'),
          description: getSimpleToastDescription(message, durationInSeconds),
          status: 'error',
          isClosable: true,
        })
      }
    } finally {
      setDisabling(false)
    }
  }, [canUse, userAgent, auctionCanisterId, refresh, ensureInitialized, toast])

  const isSubscribed = useMemo(() => {
    return !!(isLibSubscribed && isCanisterEnabled)
  }, [isLibSubscribed, isCanisterEnabled])

  return {
    isLibSubscribed,
    isCanisterEnabled,
    isSubscribed,
    loading,
    enabling,
    disabling,
    error,
    canUse,
    refresh,
    enable,
    disable,
  }
}
