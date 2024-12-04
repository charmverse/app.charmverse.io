'use client';

import type { BoxProps } from '@mui/material';
import { Box } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Autoplay, Navigation } from 'swiper/modules';
import type { SwiperProps } from 'swiper/react';
import { Swiper, SwiperSlide } from 'swiper/react';

import { useMdScreen } from '../../../hooks/useMediaScreens';
import { LoadingCards } from '../Loading/LoadingCards';

import { NextArrow, PrevArrow } from './Arrows';

import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/pagination';

export type CarouselProps = {
  children: React.ReactNode[];
  renderBullet?: (index: number, className: string) => string;
  slidesPerView?: number;
  boxProps?: Partial<BoxProps>;
} & Partial<SwiperProps>;

export function Carousel({ children, renderBullet, boxProps, ...swiperProps }: CarouselProps) {
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
    <Box
      width='90svw'
      display='flex'
      alignItems='center'
      justifyContent='center'
      mb={2}
      mx='auto'
      px={{ md: 4 }}
      position='relative'
      {...boxProps}
    >
      <Swiper
        autoplay={
          swiperProps.autoplay
            ? {
                delay: 3000,
                pauseOnMouseEnter: true
              }
            : undefined
        }
        loop
        className='swiper'
        autoHeight={true}
        modules={[Navigation, Autoplay]}
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
        {...swiperProps}
        style={{ width: '100%', ...swiperProps.style }}
      >
        {children.map((child, index) => (
          <SwiperSlide key={`${index.toString()}`}>{child}</SwiperSlide>
        ))}
      </Swiper>
      {isDesktop && swiperProps.slidesPerView && children.length > swiperProps.slidesPerView && (
        <>
          <NextArrow className='swiper-button-next' />
          <PrevArrow className='swiper-button-prev' />
        </>
      )}
    </Box>
  );
}
