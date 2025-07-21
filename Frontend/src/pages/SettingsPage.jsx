import React from 'react'

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  { id: 2, content: "I'm doing great! Just working on some new features.", isSent: true },
];
const SettingsPage = () => {
  const {theme, setTheme}= useThemeStore();
  return (
    <div>
      Settings
    </div>
  )
}

export default SettingsPage
