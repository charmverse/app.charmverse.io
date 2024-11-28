'use client';

import { Box } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Autoplay, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { useMdScreen } from '../../../hooks/useMediaScreens';
import { LoadingCards } from '../Loading/LoadingCards';

import { NextArrow, PrevArrow } from './Arrows';

import 'swiper/css';
import 'swiper/css/autoplay';

export type CarouselProps = {
  children: React.ReactNode[];
  slidesPerView: number;
};

export function Carousel({ children, slidesPerView }: CarouselProps) {
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
    <Box display='flex' alignItems='center' justifyContent='center' mb={2}>
      <Box width='95%' px={isDesktop ? 4 : 0} position='relative'>
        <Swiper
          autoplay={{
            delay: 3000,
            pauseOnMouseEnter: true
          }}
          loop
          className='swiper'
          slidesPerView={slidesPerView}
          autoHeight={true}
          modules={[Navigation, Autoplay]}
          navigation={{
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev'
          }}
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
