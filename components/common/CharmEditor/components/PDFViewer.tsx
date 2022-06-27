import dynamic from 'next/dynamic';

const PDFViewer = dynamic(() => import('./ResizablePDF'), {
  ssr: false
});

export default function (props: any) {
  return <PDFViewer {...props} />;
}
