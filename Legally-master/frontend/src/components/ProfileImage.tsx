import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProfileImageProps {
  className?: string;
}

const ProfileImage: React.FC<ProfileImageProps> = ({ className }) => {
  const { user } = useAuth();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [fallback, setFallback] = useState<string>('');
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    if (user) {
      const { user_metadata } = user;
      const avatar = user_metadata?.avatar_url || user_metadata?.picture || user_metadata?.photoURL;
      setImageUrl(avatar);
      setErrorCount(0); // Reset error count on user change

      const initial = user_metadata?.full_name?.charAt(0)?.toUpperCase() ||
                      user_metadata?.name?.charAt(0)?.toUpperCase() ||
                      user_metadata?.given_name?.charAt(0)?.toUpperCase() ||
                      user.email?.charAt(0)?.toUpperCase() || 'U';
      setFallback(initial);
    }
  }, [user]);

  const handleError = () => {
    if (errorCount === 0 && imageUrl && imageUrl.includes('googleusercontent.com')) {
      const newUrl = imageUrl.replace(/s\d+-c/, 's200-c');
      if (newUrl !== imageUrl) {
        setErrorCount(prev => prev + 1);
        setImageUrl(newUrl);
        return;
      }
    }
    setImageUrl(null); // Fallback to initials
  };

  return (
    <div className={`rounded-full overflow-hidden border-2 border-primary bg-gray-100 flex items-center justify-center ${className}`}>
      {imageUrl && !errorCount ? (
        <img
          src={imageUrl}
          alt="Profile"
          className="w-full h-full object-cover"
          crossOrigin="anonymous"
          onError={handleError}
        />
      ) : (
        <div className="w-full h-full bg-primary flex items-center justify-center text-white font-bold text-sm">
          {fallback}
        </div>
      )}
    </div>
  );
};

export default ProfileImage;
