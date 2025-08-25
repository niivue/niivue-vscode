import { NiiVueSettings, defaultSettings } from '@niivue/react'

export function getSettings(): NiiVueSettings {
  const savedSettings = localStorage.getItem('userSettings')
  if (savedSettings) {
    return JSON.parse(savedSettings)
  }
  return defaultSettings
}
