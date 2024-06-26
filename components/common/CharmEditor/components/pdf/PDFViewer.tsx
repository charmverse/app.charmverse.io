import { Document, Page, pdfjs } from 'react-pdf';

import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/cjs/Page/AnnotationLayer.css';

// https://github.com/wojtekmaj/react-pdf/issues/321#issuecomment-451291757
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.mjs`;

interface Props {
  pageNumber: number;
  width: number;
  url: string;
  onLoadSuccess: (props: { numPages: number }) => void;
}

export default function PDFViewer({ url, onLoadSuccess, pageNumber, width }: Props) {
  return (
    <Document file={{ url }} onLoadSuccess={onLoadSuccess}>
      <Page pageNumber={pageNumber} width={width} />
    </Document>
  );
}
