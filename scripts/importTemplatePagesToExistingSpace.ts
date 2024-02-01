import { PageType } from "@charmverse/core/dist/cjs/prisma-client";
import { StaticSpaceTemplateType } from "lib/spaces/config";
import { getSpace } from "lib/spaces/getSpace";
import { ExportedPage } from "lib/templates/exportWorkspacePages";
import { getImportData } from "lib/templates/getImportData";
import { importWorkspacePages } from "lib/templates/importWorkspacePages";



const importablePageTypes: PageType[] = ['page', 'card', 'card_template', 'board', 'inline_board', 'inline_linked_board'];

async function importTemplatePagesToExistingSpace({spaceDomainOrId, template}: {spaceDomainOrId: string; template: StaticSpaceTemplateType}){
  const space = await getSpace(spaceDomainOrId);


  const data = await getImportData({exportName: template});


  const pagesToImport = data.pages?.filter(p => !p.title.match('About this template')).map((p) => filterChildren(p, [])).flat()


  console.log('Importing ', pagesToImport?.length, 'pages')

  await importWorkspacePages({
    targetSpaceIdOrDomain: space.id,
    exportData: {
      pages: pagesToImport
    }
  })
}

function filterChildren(node: ExportedPage, results: ExportedPage[]) {
  
  if (importablePageTypes.includes(node.type)) {

    results.push(node as ExportedPage)

    for (const child of node.children) {
      filterChildren(child, results)
    }
  }

  return results;
}

importTemplatePagesToExistingSpace({spaceDomainOrId: 'internal-chocolate-muskox', template: 'templateHackathon'}).then(() => console.log('Done'))