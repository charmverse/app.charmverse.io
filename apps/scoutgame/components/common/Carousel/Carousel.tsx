'use client';

import { Box, useMediaQuery } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { NextArrow, PrevArrow } from './Arrows';

import 'swiper/css';

export type CarouselProps<Item extends { id: string }> = {
  items: Item[];
  children: (item: Item) => React.ReactNode;
};

export function Carousel<Item extends { id: string }>({ items, children }: CarouselProps<Item>) {
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  const isLarge = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));
  const slidesPerView = isMobile ? 2.2 : isLarge ? 6 : 5;

  return (
    <Box display='flex' alignItems='center' justifyContent='center' mb={2}>
      <Box width='95svw' px={isMobile ? 0 : 4} position='relative'>
        <Swiper
          className='swiper'
          slidesPerView={slidesPerView}
          spaceBetween={isMobile ? 5 : 15}
          autoHeight={true}
          modules={[Navigation]}
          navigation={{
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev'
          }}
        >
          {items.map((item) => (
            <SwiperSlide key={item.id}>{children(item)}</SwiperSlide>
          ))}
        </Swiper>
        {!isMobile && items.length > slidesPerView && (
          <>
            <NextArrow className='swiper-button-next' />
            <PrevArrow className='swiper-button-prev' />
          </>
        )}
      </Box>
    </Box>
  );
}
