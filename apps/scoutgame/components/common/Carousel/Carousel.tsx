'use client';

import type { Scout } from '@charmverse/core/prisma-client';
import { Box, useMediaQuery } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { useState } from 'react';
import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { NFTPurchaseDialog } from 'components/nft/NFTPurchaseDialog';
import type { TopBuilder } from 'lib/builders/getTopBuilders';

import { UserCard } from '../Card/UserCard';

import { NextArrow, PrevArrow } from './Arrows';

import 'swiper/css';

export function Carousel({ items, scout }: { items: TopBuilder[]; scout?: Scout | null }) {
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  return (
    <Box display='flex' alignItems='center' justifyContent='center' mb={2}>
      <Box width='95svw' px={isMobile ? 0 : 4} position='relative'>
        <Swiper
          className='mySwiper'
          slidesPerView={isMobile ? 2 : 5}
          spaceBetween={5}
          autoHeight={true}
          modules={[Navigation]}
          navigation={{
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev'
          }}
        >
          {items.map((_user) => (
            <SwiperSlide key={_user.username}>
              <UserCard withDetails user={_user} scout={scout} />
            </SwiperSlide>
          ))}
        </Swiper>
        {!isMobile && (
          <>
            <NextArrow className='swiper-button-next' />
            <PrevArrow className='swiper-button-prev' />
          </>
        )}
      </Box>
    </Box>
  );
}
