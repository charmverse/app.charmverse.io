'use client';

import { Box } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { useMdScreen } from '../../../hooks/useMediaScreens';
import { LoadingCards } from '../Loading/LoadingCards';

import { NextArrow, PrevArrow } from './Arrows';

import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/pagination';

export type CarouselProps = {
  children: React.ReactNode[];
  slidesPerView: number;
  renderBullet?: (index: number, className: string) => string;
  height?: number;
};

export function Carousel({ children, renderBullet, slidesPerView, height }: CarouselProps) {
  const isDesktop = useMdScreen();
  // Use state and effect to skip pre-rendering
  const [isClientSide, setIsClientSide] = useState(false);

  useEffect(() => {
    setIsClientSide(true);
  }, []);

  if (!isClientSide) {
    return <LoadingCards />;
  }

  return (
    <Box display='flex' alignItems='center' justifyContent='center' height='100%'>
      <Box width={isDesktop ? '95%' : '100%'} px={isDesktop ? 4 : 0} position='relative' height='100%'>
        <Swiper
          autoplay={{
            delay: 3000,
            pauseOnMouseEnter: true
          }}
          loop
          style={{ height }}
          className='swiper'
          slidesPerView={slidesPerView}
          modules={[Navigation, Autoplay, ...(renderBullet ? [Pagination] : [])]}
          navigation={{
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev'
          }}
          pagination={
            renderBullet
              ? {
                  clickable: true,
                  renderBullet
                }
              : undefined
          }
        >
          {children.map((child, index) => (
            <SwiperSlide key={`${index.toString()}`}>{child}</SwiperSlide>
          ))}
        </Swiper>
        {isDesktop && children.length > slidesPerView && (
          <>
            <NextArrow className='swiper-button-next' />
            <PrevArrow className='swiper-button-prev' />
          </>
        )}
      </Box>
    </Box>
  );
}
