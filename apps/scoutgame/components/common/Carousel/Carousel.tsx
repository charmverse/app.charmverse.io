'use client';

import type { Scout } from '@charmverse/core/prisma-client';
import { Box } from '@mui/material';
import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { useLgScreen, useMdScreen } from 'hooks/useMediaScreens';
import type { TopBuilder } from 'lib/builders/getTopBuilders';

import { UserCard } from '../Card/UserCard';

import { NextArrow, PrevArrow } from './Arrows';

import 'swiper/css';

export function Carousel({ items, scout }: { items: TopBuilder[]; scout?: Scout | null }) {
  const isDesktop = useMdScreen();
  const isLarge = useLgScreen();
  const slidesPerView = isDesktop ? 5 : isLarge ? 6 : 2.2;

  return (
    <Box display='flex' alignItems='center' justifyContent='center' mb={2}>
      <Box width='95svw' px={isDesktop ? 4 : 0} position='relative'>
        <Swiper
          className='mySwiper'
          slidesPerView={slidesPerView}
          spaceBetween={isDesktop ? 15 : 5}
          autoHeight={true}
          modules={[Navigation]}
          navigation={{
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev'
          }}
        >
          {items.map((_user) => (
            <SwiperSlide key={_user.username}>
              <UserCard withDetails user={_user} scout={scout} variant='big' />
            </SwiperSlide>
          ))}
        </Swiper>
        {isDesktop && items.length > slidesPerView && (
          <>
            <NextArrow className='swiper-button-next' />
            <PrevArrow className='swiper-button-prev' />
          </>
        )}
      </Box>
    </Box>
  );
}
