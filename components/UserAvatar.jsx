"use client";

import React from 'react';
import Image from 'next/image';

const UserAvatar = ({ src, alt = 'User', size = 'md', text }) => {
  const sizeClass = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  if (src) {
    return (
      <div className={`relative rounded-full overflow-hidden ${sizeClass[size]}`}>
        <Image 
          src={src} 
          alt={alt} 
          width={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
          height={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
          className="rounded-full"
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClass[size]} flex items-center justify-center rounded-full bg-gray-300 text-gray-600`}>
      {text ? getInitials(text) : alt[0].toUpperCase()}
    </div>
  );
};

export default UserAvatar;