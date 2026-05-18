"use client";
import { useState } from 'react';
import { Link as LinkIcon, Check, MoreHorizontal, MessageCircle, Send, X } from 'lucide-react';

export default function InviteWindow() {
  const [copySuccess, setCopySuccess] = useState(false);
  const inviteLink = "https://welikechess.com/invite/user_elite_77";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="chess-panel max-w-md mx-auto !bg-black/60 [.light_&]:!bg-white">
      <div className="chess-title-group mb-10">
        <p>Reclutamiento de Élite</p>
        <h2 className="!text-3xl">Invitar Amigos</h2>
      </div>

      <div className="space-y-8">
        <div className="chess-form-group">
          <label className="chess-label">Link de Afiliado <div className="chess-label-dot"/></label>
          <div className="flex gap-2">
            <div className="chess-input !py-3 flex-grow font-mono truncate opacity-60">
              {inviteLink}
            </div>
            <button 
              onClick={copyToClipboard}
              className={`w-14 rounded-2xl flex items-center justify-center transition-all ${
                copySuccess ? 'bg-emerald-500 text-white' : 'bg-gold text-black'
              }`}
            >
              {copySuccess ? <Check size={18} /> : <LinkIcon size={18} />}
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 [.light_&]:border-gray-100">
          <p className="chess-label !justify-center mb-6 opacity-40">Desplegar en Redes</p>
          <div className="grid grid-cols-4 gap-4">
            <SocialBtn icon={<MessageCircle size={18} />} color="hover:text-emerald-400" />
            <SocialBtn icon={<Send size={18} />} color="hover:text-blue-400" />
            <SocialBtn icon={<X size={18} />} color="hover:text-white" />
            <SocialBtn icon={<MoreHorizontal size={18} />} color="hover:text-gold" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialBtn({ icon, color }: any) {
  return (
    <button className={`w-full aspect-square flex items-center justify-center rounded-2xl bg-white/[0.03] [.light_&]:bg-gray-50 border border-white/5 [.light_&]:border-gray-200 transition-all ${color} hover:border-current hover:bg-current/5`}>
      {icon}
    </button>
  );
}