// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Block} from './block'

interface ArchiveHeader {
    version: number
    date: number
}

interface ArchiveLine {
    type: string,
    data: unknown,
}

// This schema allows the expansion of additional line types in the future
interface BlockArchiveLine extends ArchiveLine {
    type: 'block',
    data: Block
}

class ArchiveUtils {
    static buildBlockArchive(blocks: readonly Block[]): string {
        const header: ArchiveHeader = {
            version: 1,
            date: Date.now(),
        }

        const headerString = JSON.stringify(header)
        let content = headerString + '\n'
        for (const block of blocks) {
            const line: BlockArchiveLine = {
                type: 'block',
                data: block,
            }
            const lineString = JSON.stringify(line)
            content += lineString
            content += '\n'
        }

        return content
    }

    static parseBlockArchive(contents: string): Block[] {
        const blocks: Block[] = []
        const allLineStrings = contents.split('\n')
        if (allLineStrings.length >= 2) {
            const headerString = allLineStrings[0]
            const header = JSON.parse(headerString) as ArchiveHeader
            if (header.date && header.version >= 1) {
                const lineStrings = allLineStrings.slice(1)
                let lineNum = 2
                for (const lineString of lineStrings) {
                    if (!lineString) {
                        // Ignore empty lines, e.g. last line
                        continue
                    }
                    const line = JSON.parse(lineString) as ArchiveLine
                    if (!line || !line.type || !line.data) {
                        throw new Error(`ERROR parsing line ${lineNum}`)
                    }
                    switch (line.type) {
                    case 'block': {
                        const blockLine = line as BlockArchiveLine
                        const block = blockLine.data
                        blocks.push(block)
                        break
                    }
                    }

                    lineNum += 1
                }
            } else {
                throw new Error('ERROR parsing header')
            }
        }

        return blocks
    }
}

export {ArchiveHeader, ArchiveLine, BlockArchiveLine, ArchiveUtils}
