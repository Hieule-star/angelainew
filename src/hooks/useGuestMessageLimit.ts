import { useState, useEffect } from 'react';

const GUEST_MESSAGE_KEY = 'angel-ai-guest-messages';
const GUEST_MESSAGE_LIMIT = 5;

export function useGuestMessageLimit() {
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem(GUEST_MESSAGE_KEY);
    if (stored) {
      setMessageCount(parseInt(stored, 10) || 0);
    }
  }, []);

  const incrementMessageCount = () => {
    const newCount = messageCount + 1;
    setMessageCount(newCount);
    localStorage.setItem(GUEST_MESSAGE_KEY, newCount.toString());
    return newCount;
  };

  const resetMessageCount = () => {
    setMessageCount(0);
    localStorage.removeItem(GUEST_MESSAGE_KEY);
  };

  const canSendMessage = messageCount < GUEST_MESSAGE_LIMIT;
  const remainingMessages = Math.max(0, GUEST_MESSAGE_LIMIT - messageCount);

  return {
    messageCount,
    canSendMessage,
    remainingMessages,
    limit: GUEST_MESSAGE_LIMIT,
    incrementMessageCount,
    resetMessageCount,
  };
}
