import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Session } from '@supabase/supabase-js';
import type { ChatMessage, WalletInfo } from '@/types';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  light_points: number;
  created_at: string;
}

interface UserState {
  user: UserProfile | null;
  session: Session | null;
  isAuthenticated: boolean;
  chatHistory: ChatMessage[];
  wallet: WalletInfo;
  setUser: (user: UserProfile | null) => void;
  setSession: (session: Session | null) => void;
  logout: () => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChatHistory: () => void;
  setChatHistory: (messages: ChatMessage[]) => void;
  updateLightPoints: (points: number) => void;
  setWallet: (wallet: Partial<WalletInfo>) => void;
  disconnectWallet: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      chatHistory: [],
      wallet: {
        address: null,
        balance: 0,
        ethBalance: '0',
        chainId: null,
        connected: false,
      },
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setSession: (session) => set({ session, isAuthenticated: !!session }),
      logout: () => set({ 
        user: null, 
        session: null,
        isAuthenticated: false,
        chatHistory: [],
        wallet: { address: null, balance: 0, ethBalance: '0', chainId: null, connected: false }
      }),
      addChatMessage: (message) =>
        set((state) => ({
          chatHistory: [...state.chatHistory, message],
        })),
      clearChatHistory: () => set({ chatHistory: [] }),
      setChatHistory: (messages) => set({ chatHistory: messages }),
      updateLightPoints: (points) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, light_points: points }
            : null,
        })),
      setWallet: (walletUpdate) =>
        set((state) => ({
          wallet: { ...state.wallet, ...walletUpdate },
        })),
      disconnectWallet: () =>
        set({
          wallet: { address: null, balance: 0, ethBalance: '0', chainId: null, connected: false },
        }),
    }),
    {
      name: 'angel-ai-storage',
      partialize: (state) => ({
        wallet: state.wallet,
      }),
    }
  )
);
