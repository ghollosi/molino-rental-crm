"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import { Download, Eye, Expand } from 'lucide-react';

interface ImageGridProps {
  images: string[];
  title?: string;
  showDownload?: boolean;
  showExpand?: boolean;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function ImageGrid({ 
  images, 
  title, 
  showDownload = true, 
  showExpand = true,
  columns = 3,
  className = ""
}: ImageGridProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <Eye className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p>Nincsenek képek</p>
      </div>
    );
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleDownload = (imageUrl: string, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `image-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const gridColsClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
  };

  return (
    <div className={className}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">{title}</h3>
          <span className="text-sm text-gray-500">
            {images.length} kép
          </span>
        </div>
      )}

      <div className={`grid ${gridColsClass[columns]} gap-3`}>
        {images.map((image, index) => (
          <div
            key={index}
            className="relative aspect-square group cursor-pointer"
            onClick={() => openLightbox(index)}
          >
            <img
              src={image}
              alt={`${title || 'Kép'} ${index + 1}`}
              className="w-full h-full object-cover rounded-lg border border-gray-200 transition-transform group-hover:scale-105"
              onError={(e) => {
                console.error('Image failed to load:', image);
                e.currentTarget.src = '/placeholder-image.jpg';
              }}
            />
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center rounded-lg">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                {showExpand && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      openLightbox(index);
                    }}
                  >
                    <Expand className="w-4 h-4" />
                  </Button>
                )}
                {showDownload && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 rounded-full"
                    onClick={(e) => handleDownload(image, index, e)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Image number indicator */}
            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              {index + 1}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <ImageLightbox
        images={images}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        initialIndex={lightboxIndex}
      />
    </div>
  );
}

// Profile image component for smaller use cases
interface ProfileImageProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  clickable?: boolean;
}

export function ProfileImage({ 
  src, 
  alt, 
  size = 'md', 
  className = "",
  clickable = true 
}: ProfileImageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16', 
    lg: 'w-24 h-24'
  };

  const imageElement = (
    <img
      src={src}
      alt={alt}
      className={`${sizeClasses[size]} rounded-full object-cover border border-gray-200 ${
        clickable ? 'cursor-pointer hover:scale-110 transition-transform' : ''
      } ${className}`}
      onClick={clickable ? () => setLightboxOpen(true) : undefined}
      onError={(e) => {
        console.error('Profile image failed to load:', src);
        e.currentTarget.src = '/placeholder-avatar.jpg';
      }}
    />
  );

  return (
    <>
      {imageElement}
      {clickable && (
        <ImageLightbox
          images={[src]}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}