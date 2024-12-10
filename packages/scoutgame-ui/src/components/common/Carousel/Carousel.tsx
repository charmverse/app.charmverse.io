'use client';

import type { BoxProps } from '@mui/material';
import { Box } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import type { SwiperProps } from 'swiper/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { NavigationOptions } from 'swiper/types';

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
  mobileMinHeight?: string;
  showMobileNavigationArrows?: boolean;
} & Partial<SwiperProps>;

export function Carousel({
  children,
  renderBullet,
  boxProps,
  mobileMinHeight,
  autoplay,
  showMobileNavigationArrows,
  ...swiperProps
}: CarouselProps) {
  const isDesktop = useMdScreen();
  // Use state and effect to skip pre-rendering
  const [isClientSide, setIsClientSide] = useState(false);

  useEffect(() => {
    setIsClientSide(true);
  }, []);

  const prevButtonId =
    ((swiperProps.navigation as NavigationOptions)?.prevEl as string | undefined) ?? '.swiper-button-prev';
  const nextButtonId = (swiperProps.navigation as NavigationOptions)?.nextEl ?? '.swiper-button-next';

  if (!isClientSide) {
    return <LoadingCards />;
  }

  return (
    <Box
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
          typeof autoplay === 'boolean'
            ? {
                delay: 3000,
                pauseOnMouseEnter: true
              }
            : autoplay || undefined
        }
        loop
        className='swiper'
        autoHeight={true}
        modules={[Navigation, Autoplay, ...(renderBullet ? [Pagination] : [])]}
        navigation={{
          nextEl: nextButtonId,
          prevEl: prevButtonId
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
        style={{
          width: '100%',
          ...swiperProps.style,
          minHeight: isDesktop ? undefined : mobileMinHeight,
          zIndex: 'initial'
        }}
      >
        {children.map((child, index) => (
          <SwiperSlide key={`${index.toString()}`}>{child}</SwiperSlide>
        ))}
      </Swiper>
      {isDesktop && swiperProps.slidesPerView && children.length > swiperProps.slidesPerView && (
        <>
          <NextArrow className={(nextButtonId as string).replace('.', '')} />
          <PrevArrow className={(prevButtonId as string).replace('.', '')} />
        </>
      )}
      {!isDesktop &&
        showMobileNavigationArrows &&
        swiperProps.slidesPerView &&
        children.length > swiperProps.slidesPerView && (
          <>
            <NextArrow className={(nextButtonId as string).replace('.', '')} style={{ zIndex: 1, height: '100px' }} />
            <PrevArrow className={(prevButtonId as string).replace('.', '')} style={{ zIndex: 1, height: '100px' }} />
          </>
        )}
    </Box>
  );
}
