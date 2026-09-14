import type { AppSettings } from '../../types'
import Select from '../Select'
import { t, useUiLang } from '../../lib/i18n'

interface GeneralSettingsTabProps {
  draft: AppSettings
  zipDownloadRouteSummary: string
  commitSettings: (nextDraft: AppSettings) => void
  onOpenZipDownloadRouteManager: () => void
  toggleTaskCompletionNotification: () => Promise<void>
}

export default function GeneralSettingsTab({
  draft,
  zipDownloadRouteSummary,
  commitSettings,
  onOpenZipDownloadRouteManager,
  toggleTaskCompletionNotification,
}: GeneralSettingsTabProps) {
  useUiLang()
  const isMac = navigator.userAgent.includes('Mac')
  return (
    <div className="space-y-4">
      <div className="hidden sm:block">
        <div className="mb-1 flex items-center justify-between">
          <span className="block text-sm text-gray-600 dark:text-gray-300">{t('submitMethod')}</span>
          <div className="w-28 shrink-0">
            <Select
              value={draft.enterSubmit ? 'enter' : 'ctrl-enter'}
              onChange={(val) => commitSettings({ ...draft, enterSubmit: val === 'enter' })}
              options={[
                { label: isMac ? '⌘ + Enter' : 'Ctrl + Enter', value: 'ctrl-enter' },
                { label: 'Enter', value: 'enter' }
              ]}
              className="w-full px-3 py-1.5 rounded-xl border border-gray-200/60 dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.06] text-xs transition-all duration-200 shadow-sm text-gray-700 dark:text-gray-200 outline-none"
            />
          </div>
        </div>
        <div data-selectable-text className="text-xs text-gray-500 dark:text-gray-500">
          {t('submitMethodDescDesktop', { key: isMac ? '⌘ + Enter' : 'Ctrl + Enter' })}
        </div>
      </div>
      <div className="sm:hidden">
        <div className="mb-1 flex items-center justify-between gap-3">
          <span className="block text-sm text-gray-600 dark:text-gray-300">{t('submitMethod')}</span>
          <div className="w-28 shrink-0">
            <Select
              value={draft.enterSubmit ? 'enter' : 'button'}
              onChange={(val) => commitSettings({ ...draft, enterSubmit: val === 'enter' })}
              options={[
                { label: t('sendButton'), value: 'button' },
                { label: t('enterSendButton'), value: 'enter' }
              ]}
              className="w-full px-3 py-1.5 rounded-xl border border-gray-200/60 dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.06] text-xs transition-all duration-200 shadow-sm text-gray-700 dark:text-gray-200 outline-none"
            />
          </div>
        </div>
        <div data-selectable-text className="text-xs text-gray-500 dark:text-gray-500">
          {t('submitMethodDescMobile')}
        </div>
      </div>
      <div className="block">
        <div className="mb-1 flex items-center justify-between">
          <span className="block text-sm text-gray-600 dark:text-gray-300">{t('clearInputAfterSubmit')}</span>
          <button
            type="button"
            onClick={() => commitSettings({ ...draft, clearInputAfterSubmit: !draft.clearInputAfterSubmit })}
            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${draft.clearInputAfterSubmit ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            role="switch"
            aria-checked={draft.clearInputAfterSubmit}
            aria-label="{t('clearInputAfterSubmit')}"
          >
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${draft.clearInputAfterSubmit ? 'translate-x-[14px]' : 'translate-x-[2px]'}`} />
          </button>
        </div>
        <div data-selectable-text className="text-xs text-gray-500 dark:text-gray-500">
          {t('clearInputAfterSubmitDesc')}
        </div>
      </div>
      <div className="block">
        <div className="mb-1 flex items-center justify-between gap-3">
          <span className="block text-sm text-gray-600 dark:text-gray-300">{t('zipDownloadRoutes')}</span>
          <button
            type="button"
            onClick={onOpenZipDownloadRouteManager}
            className="shrink-0 rounded-xl border border-gray-200/80 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.08] dark:hover:text-white"
          >
            {t('manage')}
          </button>
        </div>
        <div data-selectable-text className="text-xs text-gray-500 dark:text-gray-500">
          {zipDownloadRouteSummary}
        </div>
      </div>
      <div className="block">
        <div className="mb-1 flex items-center justify-between">
          <span className="block text-sm text-gray-600 dark:text-gray-300">{t('persistInputOnRestart')}</span>
          <button
            type="button"
            onClick={() => commitSettings({ ...draft, persistInputOnRestart: !draft.persistInputOnRestart })}
            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${draft.persistInputOnRestart ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            role="switch"
            aria-checked={draft.persistInputOnRestart}
            aria-label="{t('persistInputOnRestart')}"
          >
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${draft.persistInputOnRestart ? 'translate-x-[14px]' : 'translate-x-[2px]'}`} />
          </button>
        </div>
        <div data-selectable-text className="text-xs text-gray-500 dark:text-gray-500">
          {t('persistInputOnRestartDesc')}
        </div>
      </div>
      <div className="block">
        <div className="mb-1 flex items-center justify-between">
          <span className="block text-sm text-gray-600 dark:text-gray-300">{t('reuseTaskApiProfile')}</span>
          <button
            type="button"
            onClick={() => commitSettings({ ...draft, reuseTaskApiProfileTemporarily: !draft.reuseTaskApiProfileTemporarily })}
            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${draft.reuseTaskApiProfileTemporarily ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            role="switch"
            aria-checked={draft.reuseTaskApiProfileTemporarily}
            aria-label="{t('reuseTaskApiProfile')}"
          >
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${draft.reuseTaskApiProfileTemporarily ? 'translate-x-[14px]' : 'translate-x-[2px]'}`} />
          </button>
        </div>
        <div data-selectable-text className="text-xs text-gray-500 dark:text-gray-500">
          {t('reuseTaskApiProfileDesc')}
        </div>
      </div>
      <div className="block">
        <div className="mb-1 flex items-center justify-between">
          <span className="block text-sm text-gray-600 dark:text-gray-300">{t('alwaysShowRetryButton')}</span>
          <button
            type="button"
            onClick={() => commitSettings({ ...draft, alwaysShowRetryButton: !draft.alwaysShowRetryButton })}
            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${draft.alwaysShowRetryButton ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            role="switch"
            aria-checked={draft.alwaysShowRetryButton}
            aria-label="{t('alwaysShowRetryButton')}"
          >
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${draft.alwaysShowRetryButton ? 'translate-x-[14px]' : 'translate-x-[2px]'}`} />
          </button>
        </div>
        <div data-selectable-text className="text-xs text-gray-500 dark:text-gray-500">
          {t('alwaysShowRetryButtonDesc')}
        </div>
      </div>
      <div className="block">
        <div className="mb-1 flex items-center justify-between">
          <span className="block text-sm text-gray-600 dark:text-gray-300">{t('allowPromptRewrite')}</span>
          <button
            type="button"
            onClick={() => commitSettings({ ...draft, allowPromptRewrite: !draft.allowPromptRewrite })}
            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${draft.allowPromptRewrite ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            role="switch"
            aria-checked={draft.allowPromptRewrite}
            aria-label="{t('allowPromptRewrite')}"
          >
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${draft.allowPromptRewrite ? 'translate-x-[14px]' : 'translate-x-[2px]'}`} />
          </button>
        </div>
        <div data-selectable-text className="text-xs text-gray-500 dark:text-gray-500">
          {t('allowPromptRewriteDesc')}
        </div>
      </div>
      <div className="block">
        <div className="mb-1 flex items-center justify-between">
          <span className="block text-sm text-gray-600 dark:text-gray-300">{t('taskCompletionNotification')}</span>
          <button
            type="button"
            onClick={() => { void toggleTaskCompletionNotification() }}
            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${draft.taskCompletionNotification ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            role="switch"
            aria-checked={draft.taskCompletionNotification}
            aria-label="{t('taskCompletionNotification')}"
          >
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${draft.taskCompletionNotification ? 'translate-x-[14px]' : 'translate-x-[2px]'}`} />
          </button>
        </div>
        <div data-selectable-text className="text-xs text-gray-500 dark:text-gray-500">
          {t('taskCompletionNotificationDesc')}
        </div>
      </div>
      <div className="block">
        <div className="mb-1 flex items-center justify-between">
          <span className="block text-sm text-gray-600 dark:text-gray-300">{t('agentScrollToBottom')}</span>
          <button
            type="button"
            onClick={() => commitSettings({ ...draft, agentScrollToBottomAfterSubmit: !draft.agentScrollToBottomAfterSubmit })}
            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${draft.agentScrollToBottomAfterSubmit ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            role="switch"
            aria-checked={draft.agentScrollToBottomAfterSubmit}
            aria-label="{t('agentScrollToBottom')}"
          >
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${draft.agentScrollToBottomAfterSubmit ? 'translate-x-[14px]' : 'translate-x-[2px]'}`} />
          </button>
        </div>
        <div data-selectable-text className="text-xs text-gray-500 dark:text-gray-500">
          {t('agentScrollToBottomDesc')}
        </div>
      </div>
      <div className="block">
        <div className="mb-1 flex items-center justify-between">
          <span className="block text-sm text-gray-600 dark:text-gray-300">{t('mathFormatting')}</span>
          <button
            type="button"
            onClick={() => commitSettings({ ...draft, agentMathFormattingPrompt: !draft.agentMathFormattingPrompt })}
            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${draft.agentMathFormattingPrompt ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            role="switch"
            aria-checked={draft.agentMathFormattingPrompt}
            aria-label="{t('mathFormatting')}"
          >
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${draft.agentMathFormattingPrompt ? 'translate-x-[14px]' : 'translate-x-[2px]'}`} />
          </button>
        </div>
        <div data-selectable-text className="text-xs text-gray-500 dark:text-gray-500">
          {t('mathFormattingDescLead')} <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.9em] text-gray-700 dark:bg-white/10 dark:text-gray-200">$...$</code> {t('mathFormattingDescMid')} <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.9em] text-gray-700 dark:bg-white/10 dark:text-gray-200">$$...$$</code> {t('mathFormattingDescTail')}
        </div>
      </div>
    </div>
  )
}
