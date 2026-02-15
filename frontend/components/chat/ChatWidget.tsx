/**
 * Chat Widget with Task Sync
 * Manages chat state and automatically syncs tasks with main page
 */

'use client';

import React, { useState, useEffect } from 'react';
import { FloatingChatIcon } from '@/components/chat/FloatingChatIcon';
import { ChatModal } from '@/components/chat/ChatModal';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  // Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+K (Windows/Linux) or Cmd+K (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        toggleChat();
      }

      // ESC to close
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <FloatingChatIcon isOpen={isOpen} onClick={toggleChat} />
      <ChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
