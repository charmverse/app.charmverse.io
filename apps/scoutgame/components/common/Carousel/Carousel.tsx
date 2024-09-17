'use client';

import type { Theme } from '@mui/material';
import { Box, useMediaQuery } from '@mui/material';
import type { Settings } from 'react-slick';
import Slider from 'react-slick';

import { UserCard } from '../Card/UserCard';

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { NextArrow, PrevArrow } from './Arrows';

const settings: Settings = {
  dots: false,
  infinite: false,
  speed: 500,
  slidesToShow: 6,
  slidesToScroll: 1,
  initialSlide: 0,
  arrows: true,
  responsive: [
    {
      breakpoint: 600,
      settings: {
        slidesToShow: 2,
        arrows: false
      }
    }
  ]
};

export function Carousel({ items }: { items: any[] }) {
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  return (
    <Box display='flex' alignItems='center' justifyContent='center'>
      <Box width='95svw' px={isMobile ? 0 : 4} className='slider-container'>
        <Slider {...settings} prevArrow={<PrevArrow />} nextArrow={<NextArrow />}>
          {items.map((_user) => (
            <div key={_user.username}>
              <UserCard withDetails user={_user} />
            </div>
          ))}
        </Slider>
      </Box>
    </Box>
  );
}
