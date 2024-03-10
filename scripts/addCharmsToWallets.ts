import { log } from '@charmverse/core/log'
import { prisma } from '@charmverse/core/prisma-client'
import { addCharms } from 'lib/charms/addCharms'

const charms = [
  { username: "JinSakai", amount: 20 },
  { username: "0xcf63…e049", amount: 20 },
  { username: "0xbaa1…23f3", amount: 20 },
  { username: "0xd6ad…07d1", amount: 20 },
  { username: "kryptoshrimp.eth", amount: 20 },
  { username: "0xacee…c18c", amount: 20 },
  { username: "0x3e90…fc03", amount: 20 },
  { username: "gabimena2@gmail.com", amount: 20 },
  { username: "thisthatjosh.eth", amount: 1000 },
  { username: "0x7af1…7857", amount: 20 },
  { username: "0x17a7…f0c5", amount: 20 },
  { username: "0xb4df…19d6", amount: 20 },
  { username: "Jeffery Bawa", amount: 20 },
  { username: "changethegame.eth", amount: 20 }
]

export async function addCharmsToWallets() {
  for (const { amount, username } of charms) {
    try {
      const user = await prisma.user.findFirstOrThrow({ where: { username } })
      await addCharms({
        amount,
        recipient: { userId: user.id },
      })
      log.info(`Added ${amount} charms to ${username}`)
    } catch (e) {
      log.error(`Failed to add ${amount} charms to ${username}`, e)
    }
  }
}

addCharmsToWallets().then(() => {
  console.log("Done")
})