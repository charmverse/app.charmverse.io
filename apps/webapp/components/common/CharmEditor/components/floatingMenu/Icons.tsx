import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
// Source css.gg

export function BoldIcon() {
  return <LetterIcon letter='B' sx={{ fontWeight: 800 }} />;
}

export function CodeIcon(props: any) {
  return (
    <svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' {...props}>
      <path d='M9.95263 16.9123L8.59323 18.3608L2.03082 12.2016L8.18994 5.63922L9.64826 7.00791L4.85783 12.112L9.95212 16.8932L9.95263 16.9123Z' />
      <path d='M14.0474 16.9123L15.4068 18.3608L21.9692 12.2016L15.8101 5.63922L14.3517 7.00791L19.1422 12.112L14.0479 16.8932L14.0474 16.9123Z' />
    </svg>
  );
}
export function BlockquoteIcon(props: any) {
  return (
    <svg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      <path d='M9.13456 9H12.1346L10 14.6075H7L9.13456 9Z' />
      <path d='M14.1346 9H17.1346L15 14.6075H12L14.1346 9Z' />
    </svg>
  );
}

export function ItalicIcon() {
  return (
    <svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' style={{ marginTop: '1px' }}>
      <path d='M11.4903 5.45801H17.4903L16.7788 7.32716H14.7788L11.2212 16.6729H13.2212L12.5097 18.5421H6.5097L7.22122 16.6729H9.22122L12.7788 7.32716H10.7788L11.4903 5.45801Z' />
    </svg>
  );
}

export function UndoIcon(props: any) {
  return (
    <svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' {...props}>
      <path
        d='M5.33929 4.46777H7.33929V7.02487C8.52931 6.08978 10.0299 5.53207 11.6607 5.53207C15.5267 5.53207 18.6607 8.66608 18.6607 12.5321C18.6607 16.3981 15.5267 19.5321 11.6607 19.5321C9.51025 19.5321 7.58625 18.5623 6.30219 17.0363L7.92151 15.8515C8.83741 16.8825 10.1732 17.5321 11.6607 17.5321C14.4222 17.5321 16.6607 15.2935 16.6607 12.5321C16.6607 9.77065 14.4222 7.53207 11.6607 7.53207C10.5739 7.53207 9.56805 7.87884 8.74779 8.46777L11.3393 8.46777V10.4678H5.33929V4.46777Z'
        fill='currentColor'
      />
    </svg>
  );
}

export function HeadingIcon({ level }: { level: number }) {
  return <LetterIcon letter={`H${level}`} />;
}

export function ParagraphIcon() {
  return <LetterIcon letter='P' />;
}

export function LinkIcon(props: any) {
  return (
    <svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' {...props}>
      <path d='M14.8284 12L16.2426 13.4142L19.071 10.5858C20.6331 9.02365 20.6331 6.49099 19.071 4.9289C17.509 3.3668 14.9763 3.3668 13.4142 4.9289L10.5858 7.75732L12 9.17154L14.8284 6.34311C15.6095 5.56206 16.8758 5.56206 17.6568 6.34311C18.4379 7.12416 18.4379 8.39049 17.6568 9.17154L14.8284 12Z' />
      <path d='M12 14.8285L13.4142 16.2427L10.5858 19.0711C9.02372 20.6332 6.49106 20.6332 4.92896 19.0711C3.36686 17.509 3.36686 14.9764 4.92896 13.4143L7.75739 10.5858L9.1716 12L6.34317 14.8285C5.56212 15.6095 5.56212 16.8758 6.34317 17.6569C7.12422 18.4379 8.39055 18.4379 9.1716 17.6569L12 14.8285Z' />
      <path d='M14.8285 10.5857C15.219 10.1952 15.219 9.56199 14.8285 9.17147C14.4379 8.78094 13.8048 8.78094 13.4142 9.17147L9.1716 13.4141C8.78107 13.8046 8.78107 14.4378 9.1716 14.8283C9.56212 15.2188 10.1953 15.2188 10.5858 14.8283L14.8285 10.5857Z' />
    </svg>
  );
}

export function DoneIcon(props: any) {
  return (
    <svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' {...props}>
      <path d='M10.2426 16.3137L6 12.071L7.41421 10.6568L10.2426 13.4853L15.8995 7.8284L17.3137 9.24262L10.2426 16.3137Z' />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12ZM12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21Z'
      />
    </svg>
  );
}

export function ExternalIcon(props: any) {
  return (
    <svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' style={{ transform: 'scale(1.1, 1.1)' }} {...props}>
      <path d='M15.6396 7.02527H12.0181V5.02527H19.0181V12.0253H17.0181V8.47528L12.1042 13.3892L10.6899 11.975L15.6396 7.02527Z' />
      <path d='M10.9819 6.97473H4.98193V18.9747H16.9819V12.9747H14.9819V16.9747H6.98193V8.97473H10.9819V6.97473Z' />
    </svg>
  );
}

export function CloseIcon(props: any) {
  return (
    <svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' {...props}>
      <path d='M16.34 9.32a1 1 0 10-1.36-1.46l-2.93 2.73-2.73-2.93a1 1 0 00-1.46 1.36l2.73 2.93-2.93 2.73a1 1 0 101.36 1.46l2.93-2.73 2.73 2.93a1 1 0 101.46-1.36l-2.73-2.93 2.93-2.73z' />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M1 12a11 11 0 1122 0 11 11 0 01-22 0zm11 9a9 9 0 110-18 9 9 0 010 18z'
      />
    </svg>
  );
}

export function ChevronDown(props: any) {
  return (
    <svg
      viewBox='0 0 24 24'
      style={{ transform: 'scale(0.8, 0.8)' }}
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <path d='M6.34317 7.75732L4.92896 9.17154L12 16.2426L19.0711 9.17157L17.6569 7.75735L12 13.4142L6.34317 7.75732Z' />
    </svg>
  );
}

export function ChevronUp(props: any) {
  return (
    <svg
      viewBox='0 0 24 24'
      style={{ transform: 'scale(0.8, 0.8)' }}
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <path d='M17.6569 16.2427L19.0711 14.8285L12.0001 7.75739L4.92896 14.8285L6.34317 16.2427L12.0001 10.5858L17.6569 16.2427Z' />
    </svg>
  );
}

export function TextColorIcon() {
  return <LetterIcon letter='A' />;
}

export function UnderlineIcon() {
  return <LetterIcon letter='U' sx={{ textDecoration: 'underline' }} />;
}

export function StrikeThroughIcon() {
  return <LetterIcon letter='S' sx={{ textDecoration: 'line-through' }} />; // <span style={{ textDecoration: 'line-through', fontSize: 18, marginLeft: 5, marginRight: 5 }}>S</span>
}

export function ComponentIcon({ children }: { children: ReactNode }) {
  return (
    <Box width={20} height={20} display='flex' alignItems='center' justifyContent='center'>
      {children}
    </Box>
  );
}

function LetterIcon({ sx, letter }: { sx?: any; letter: string }) {
  const singeLetter = letter.length === 1;
  return (
    <Box width={20} height={20} display='flex' alignItems='center' justifyContent='center'>
      <Typography fontWeight={600} fontSize={singeLetter ? 15 : 13} sx={sx}>
        {letter}
      </Typography>
    </Box>
  );
}
