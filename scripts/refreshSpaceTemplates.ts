import { staticSpaceTemplates } from "lib/spaces/config";
import { exportSpaceData } from "lib/templates/exportSpaceData";






async function refreshSpaceTemplates(selectedTemplates?: Array<(typeof staticSpaceTemplates)[number]['id']>) {
  for (const template of staticSpaceTemplates) {

    if (!selectedTemplates || selectedTemplates.includes(template.id)) {
      await exportSpaceData({spaceIdOrDomain: template.spaceId, filename: `${template.id}.json`})
      console.log('Template updated: ', template.name)
    }
  }
}

// refreshSpaceTemplates(['templateNounishDAO']).then(() => console.log('Done'))