import JSZip from 'jszip';

export type ZipFileNode = {
  title: string;
  markdown?: string;
  tsv?: string;
  children?: ZipFileNode[];
};

// create a zip of files with nested structure. each page that has children should be a new folder, with children pages inside a folder called "children". content is a markdown file and tsv is a tsv file
export function zipFiles(files: ZipFileNode[]) {
  const zip = new JSZip();

  function addFilesToZip(_files: ZipFileNode[], parentFolder: JSZip | null = null) {
    _files.forEach((file) => {
      const currentFolder = parentFolder || zip;

      // Create a folder for pages with children
      if (file.children?.length) {
        const folder = currentFolder.folder(file.title);
        if (folder) {
          // Add content and tsv files to the main folder
          if (file.markdown) {
            folder.file(`${file.title}.md`, file.markdown);
          }
          if (file.tsv) {
            folder.file(`${file.title}.tsv`, file.tsv);
          }

          // Create children folder and add child files
          const childrenFolder = folder.folder('children');
          if (childrenFolder) {
            addFilesToZip(file.children, childrenFolder);
          }
        }
      } else {
        // Add files directly to current folder if no children
        if (file.markdown) {
          currentFolder.file(`${file.title}.md`, file.markdown);
        }
        if (file.tsv) {
          currentFolder.file(`${file.title}.tsv`, file.tsv);
        }
      }
    });
  }

  addFilesToZip(files);

  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
