'use client';

import { Box } from '@mui/material';
import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { useMdScreen, useLgScreen } from 'hooks/useMediaScreens';

import { NextArrow, PrevArrow } from './Arrows';

import 'swiper/css';

export type CarouselProps = {
  children: React.ReactNode[];
};

export function Carousel({ children }: CarouselProps) {
  const isDesktop = useMdScreen();
  const isLarge = useLgScreen();
  const slidesPerView = isDesktop ? 5 : isLarge ? 6 : 2.2;

  return (
    <Box display='flex' alignItems='center' justifyContent='center' mb={2}>
      <Box width='95svw' px={isDesktop ? 4 : 0} position='relative'>
        <Swiper
          className='swiper'
          slidesPerView={slidesPerView}
          spaceBetween={isDesktop ? 15 : 5}
          autoHeight={true}
          modules={[Navigation]}
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
