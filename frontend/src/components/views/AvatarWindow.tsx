"use client";
import React, { useState, useEffect } from 'react';

const AVATARS = [
  "b_king_avatar.png", "b_queen_avatar.png", "b_bishop_avatar.png", 
  "b_horse_avatar.png", "b_rook_avatar.png", "b_pawn_avatar.png",
  "w_king_avatar.png", "w_queen_avatar.png", "w_bishop_avatar.png", 
  "w_horse_avatar.png", "w_rook_avatar.png", "w_pawn_avatar.png"
];

export default function AvatarWindow() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const selectAvatar = async (imgName: string) => {
    const token = localStorage.getItem("access_token");
    const avatarPath = `/avatars/${imgName}`;

    try {
      // LLAMADA CORREGIDA: ahora apunta a /me/
      const response = await fetch('http://localhost:8000/api/users/me/', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ avatar: avatarPath })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        // Actualizamos el usuario en el storage local con la respuesta del servidor
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        // Disparamos eventos para cerrar el modal y refrescar la UI
        window.dispatchEvent(new Event('user-updated'));
        window.dispatchEvent(new Event('close-modals'));
      }
    } catch (error) {
      console.error("Error sincronizando avatar:", error);
    }
  };

  if (!mounted) return null;

  return (
    <div className="p-8 md:p-12 w-full max-w-7xl mx-auto min-h-[60vh]">
      <div className="chess-title-group mb-16 text-center">
        <p className="text-gold/50 text-[10px] tracking-[0.8em] font-black uppercase mb-3">Protocolo Estético</p>
        <h2 className="text-white [.light_&]:text-gray-900 font-cinzel text-4xl font-black uppercase tracking-widest">Identidad Visual</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8">
        {AVATARS.map((img) => (
          <button 
            key={img} 
            onClick={() => selectAvatar(img)} 
            className="group relative aspect-square transition-all duration-300 active:scale-95 cursor-pointer"
          >
            <div className="w-full h-full rounded-[2rem] border border-white/10 [.light_&]:border-gray-200 bg-white/[0.03] [.light_&]:bg-gray-50 group-hover:bg-gold/10 group-hover:border-gold/50 group-hover:shadow-[0_0_40px_rgba(212,175,55,0.2)] overflow-hidden flex items-center justify-center p-5">
              <img 
                src={`/avatars/${img}`} 
                className="w-full h-full object-contain transition-all duration-500 scale-100 group-hover:scale-110 drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]" 
                alt="Avatar Piece" 
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}