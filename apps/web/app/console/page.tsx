'use client'

import { ChatConsole } from '@/components/console/ChatConsole'

// Full-height chat console (claude.ai / chatgpt style): a per-wallet history
// sidebar + the chat. Sits below the fixed ConsoleNavbar (~76px), filling the
// rest of the viewport, and is width-aligned to the navbar / agents page
// (centered at --container-wrap with matching horizontal padding).
export default function ConsoleHome() {
  return (
    <div className="fixed inset-x-0 bottom-0 top-[76px]">
      <div className="mx-auto h-full w-full max-w-[var(--container-wrap)] px-6 sm:px-8">
        <ChatConsole />
      </div>
    </div>
  )
}
