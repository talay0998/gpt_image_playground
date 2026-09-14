import { useEffect } from 'react'
import { useStore } from '../store'
import { readRuntimeEnv } from '../lib/runtimeEnv'
import { t } from '../lib/i18n'

const NOTICE_KEY = 'docker-api-url-migration-notice-v1'

export function useDockerApiUrlMigrationNotice() {
  const setConfirmDialog = useStore((s) => s.setConfirmDialog)

  useEffect(() => {
    if (readRuntimeEnv(import.meta.env.VITE_DOCKER_DEPLOYMENT) !== 'true') return
    if (readRuntimeEnv(import.meta.env.VITE_DOCKER_LEGACY_API_URL_USED) !== 'true') return
    if (localStorage.getItem(NOTICE_KEY) === 'true') return

    const dismiss = () => {
      localStorage.setItem(NOTICE_KEY, 'true')
    }

    setConfirmDialog({
      title: t('dockerMigrationTitle'),
      message: t('dockerMigrationMsg'),
      confirmText: t('know'),
      showCancel: false,
      icon: 'info',
      minConfirmDelayMs: 3000,
      action: dismiss,
      cancelAction: dismiss,
    })
  }, [setConfirmDialog])
}
