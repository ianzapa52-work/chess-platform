"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ModalFrame from './ModalFrame';
import SettingsForm from '../settings/SettingsForm';
import LoginForm from '../auth/LoginForm';
import RegisterForm from '../auth/RegisterForm';
import HistoryForm from '../history/HistoryForm';

const AvatarWindow = dynamic(() => import('../views/AvatarWindow'), { ssr: false });
const InviteWindow = dynamic(() => import('../views/InviteWindow'), { ssr: false });

export default function ModalManager() {
  const [activeModal, setActiveModal] = useState<'settings' | 'login' | 'register' | 'elo-info' | 'history' | 'avatar' | 'invite' | null>(null);

  const closeModal = () => setActiveModal(null);

  useEffect(() => {
    const handleOpen = (type: typeof activeModal) => () => setActiveModal(type);
    
    const events = {
      'open-settings': handleOpen('settings'),
      'open-login': handleOpen('login'),
      'open-register': handleOpen('register'),
      'open-elo-info': handleOpen('elo-info'),
      'open-history': handleOpen('history'),
      'open-avatar': handleOpen('avatar'),
      'open-invite': handleOpen('invite'),
      'close-modals': closeModal
    };

    Object.entries(events).forEach(([name, handler]) => {
      window.addEventListener(name, handler as any);
    });

    return () => {
      Object.entries(events).forEach(([name, handler]) => {
        window.removeEventListener(name, handler as any);
      });
    };
  }, []);

  return (
    <>
      <ModalFrame isOpen={activeModal === 'settings'} onClose={closeModal} size="max-w-6xl">
        <SettingsForm onClose={closeModal} />
      </ModalFrame>

      <ModalFrame isOpen={activeModal === 'login'} onClose={closeModal} size="max-w-lg">
        <LoginForm onSwitchToRegister={() => setActiveModal('register')} />
      </ModalFrame>

      <ModalFrame isOpen={activeModal === 'register'} onClose={closeModal} size="max-w-lg">
        <RegisterForm onSwitchToLogin={() => setActiveModal('login')} />
      </ModalFrame>

      <ModalFrame isOpen={activeModal === 'history'} onClose={closeModal} size="max-w-4xl">
        <HistoryForm onClose={closeModal} />
      </ModalFrame>

      <ModalFrame isOpen={activeModal === 'avatar'} onClose={closeModal} size="max-w-7xl">
        <AvatarWindow />
      </ModalFrame>

      <ModalFrame isOpen={activeModal === 'invite'} onClose={closeModal} size="max-w-lg">
        <InviteWindow />
      </ModalFrame>
    </>
  );
}