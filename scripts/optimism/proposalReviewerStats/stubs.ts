import { prisma } from "@charmverse/core/prisma-client";
import { prettyPrint } from "@root/lib/utils/strings";


export type PageWithReviewer = {
  id: string;
  title: string;
  path: string;
  pagesWithView: {pagePath: string; viewId: string}[]
  user: {
    id: string;
    username: string;
    path: string;
    email: string;
  }
}

export const pagesWithReviewer: PageWithReviewer[] = [
  {
    "id": "7970327f-4a12-4c7d-833f-7cafef4c531c",
    "title": "MattL",
    "path": "mattl-81252415585556",
    pagesWithView: [{
      pagePath: "page-75926001693401",
      viewId: "b3a3a667-1757-4df1-be88-a3135f438eb6"
    }, {
      pagePath: "page-75926001693401",
      viewId: "bc9b6129-6415-446c-b18a-3c397992f47f"
    }, {
      pagePath: "page-75926001693401",
      viewId: "e24c9f91-85ea-4017-a0b5-6bc1b4457a80"
    }, {
      pagePath: "page-75926001693401",
      viewId: "1c40c3c3-c67c-40b7-a6a8-8d075b611b4e"
    }],
    "user": {
      "id": "6f48e403-bfbd-4be2-849d-42cb4242fd33",
      "username": "mattlosquadro",
      "path": "ynk8q29q",
      "email": "mattdefi@protonmail.com"
    }
  },
  {
    "id": "01755a9e-a77f-4043-a960-030e8db3ee78",
    "title": "Sov",
    "path": "sov-5125617403561835",
    pagesWithView: [{
      pagePath: "sov-5125617403561835",
      viewId: "4374de48-fa13-4231-993b-481dc933c23b"
    }, {
      pagePath: "sov-5125617403561835",
      viewId: "4f5fd333-da7d-447c-99e9-4aca0e5d4f27"
    }],
    "user": {
      "id": "9cfc7767-92cf-4cf6-95ac-41f254579507",
      "username": "sov",
      "path": "33mnwee0",
      "email": "sov@sovereignsignal.com"
    }
  },
  {
    "id": "3eb1d9c6-0f2e-4094-9abd-d9c9011962b6",
    "title": "Brichis",
    "path": "brichis-2914102293677765",
    pagesWithView: [{
      pagePath: "brichis-2914102293677765",
      viewId: "97d6e3a9-32ea-46f2-8eab-f38caf53d7c3"
    }],
    "user": {
      "id": "8e7a423f-a5f6-4782-82e5-9106195792b4",
      "username": "brichis",
      "path": "brichis.eth",
      "email": "briciaguzman@gmail.com"
    }
  },
  {
    "id": "40ed7351-57a0-453b-a0bf-d8f1e3b3fb99",
    "title": "Michael",
    "path": "michael-9127468949241369",
    pagesWithView: [{
      pagePath: "michael-9127468949241369",
      viewId: "f8441cb7-b326-4ed5-a43b-9ae9a313dd86"
    }, {
      pagePath: "michael-9127468949241369",
      viewId: "05f9a522-c833-47d3-841b-5e2102e35dc7"
    }],
    "user": {
      "id": "90863f67-3406-4dbc-a4c9-66ed4965c002",
      "username": "vandermeiden",
      "path": "x4du6ipb",
      "email": "michaelvandermeiden@gmail.com"
    }
  },
  {
    "id": "6eed1978-cd59-4517-bac6-3068a9759c73",
    "title": "Boardroom",
    "path": "boardroom-5408251039674079",
    pagesWithView: [{
      pagePath: "page-935419854632269",
      viewId: "05346344-aff1-412f-ad53-682dac024422"
    }, {
      pagePath: "page-935419854632269",
      viewId: "b9f942bd-9203-4ae6-b759-2b21a2a5c785"
    }],
    "user": {
      "id": "e3f40c4b-25f0-4818-a180-0ba76de325f0",
      "username": "kevin@boardroom.info",
      "path": "qzwktprz",
      "email": "kevin@boardroom.info"
    }
  },
  {
    "id": "792de20f-cccc-4212-8cfa-4cff80c713ce",
    "title": "Mojo",
    "path": "mojo-5004976963571366",
    pagesWithView: [{
      pagePath: "mojo-5004976963571366",
      viewId: "693f46f0-fdb1-4ae3-8a56-13272f7ab4d3"
    }, {
      pagePath: "mojo-5004976963571366",
      viewId: "9fe03ca3-a9ab-4d26-a973-e89ec9b1105f"
    }],
    "user": {
      "id": "3ba64f30-0f96-4179-8986-2979fddcd21b",
      "username": "mastermojo.eth@gmail.com",
      "path": "1tcd6h8v",
      "email": "Mastermojo.eth@gmail.com"
    }
  },
  {
    "id": "7d16bf5b-6c76-47c3-b93e-127ab7dd9f08",
    "title": "Katie",
    "path": "katie-6578787555181951",
    pagesWithView: [{
      pagePath: "katie-6578787555181951",
      viewId: "5534608c-1294-44a6-bf69-4f9edd24a9ab"
    }, {
      pagePath: "katie-6578787555181951",
      viewId: "dcf61892-194f-4393-a93f-072126e2e1b3"
    }],
    "user": {
      "id": "f7722eb2-afda-4c1b-ad4e-85a2495456d6",
      "username": "katiegarcia.eth",
      "path": "0x7553-3ee5",
      "email": "katie@udhc.finance"
    }
  },
  {
    "id": "a6eb26be-58c5-4a5e-876e-414e72a15340",
    "title": "Jack",
    "path": "jack-7101600001636725",
    pagesWithView: [{
      pagePath: "jack-7101600001636725",
      viewId: "0b4d0ac9-733a-4315-ba80-1c3b28af9764"
    }, {
      pagePath: "jack-7101600001636725",
      viewId: "7c6605ce-3a9f-429f-871c-d89e0591f285"
    }, {
      pagePath: "jack-7101600001636725",
      viewId: "57764b21-3c2a-4948-ac2e-df7022847eef"
    }],
    "user": {
      "id": "211bc625-328b-4749-a07b-7fdea02cfa88",
      "username": "jackanorak.eth",
      "path": "0x4f41-bf66",
      "email": "jackanorak@gmail.com"
    }
  },
  {
    "id": "c390bf73-5803-43eb-93c3-0c4a9caf09fe",
    "title": "Sugma",
    "path": "sugma-9765561754209511",
    pagesWithView: [{
      pagePath: "sugma-9765561754209511",
      viewId: "3e57134e-621a-4ea0-bbc3-29a25c660257"
    }, {
      pagePath: "sugma-9765561754209511",
      viewId: "d928c062-518e-479d-88ec-393d2ba2bfc6"
    }],
    "user": {
      "id": "d34012f3-f1e8-4846-b3ee-b665a5801d0e",
      "username": "sugma.eth",
      "path": "0xd231-e452",
      "email": "moneymandug@gmail.com"
    }
  },
  {
    "id": "e4a64e90-ddf6-45d7-ad2c-a51b40f2bf66",
    "title": "Tané",
    "path": "tan-39336578693558444",
    pagesWithView: [{
      pagePath: "tan-39336578693558444",
      viewId: "6eea8678-6ce1-4122-bd2b-d1f42354913f"
    }, {
      pagePath: "tan-39336578693558444",
      viewId: "1a230537-0288-4f4a-85f3-8c52f1f286cc"
    }],
    "user": {
      "id": "645c652e-d646-413c-9ccb-fa864bf79529",
      "username": "tanegov.eth",
      "path": "xm4us979",
      "email": "takeshi@tanelabs.com"
    }
  },
  {
    "id": "f3456a4d-2100-4046-b36f-f9d8ccf18255",
    "title": "Jrocki",
    "path": "jrocki-8559119615798567",
    pagesWithView: [{pagePath: 'page-4083136983227258', viewId: 'a6415a25-d2d8-481c-a3e0-d02fd4538d53'}, {pagePath: 'page-7631824581243101', viewId: '328dcbd0-f7a7-4718-ac9e-89a65e18b145'}],
    "user": {
      "id": "ed48ef7a-6aa2-4223-b604-d3b16c8d9758",
      "username": "Jesse - Jrocki",
      "path": "cclhopqq",
      "email": "Jesse.p.nawrocki@gmail.com"
    }
  }
]

async function validateReviewers() {
  for (const reviewer of pagesWithReviewer) {

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        id: reviewer.user.id
      },
      select: {
        id: true,
        username: true,
        path: true
      }
    });

    const page = await prisma.page.findUniqueOrThrow({
      where: {
        id: reviewer.id
      },
      select: {
        id: true,
        title: true,
        path: true
      }
    });

    prettyPrint({
      userFromDb: user,
      pageFromDb: page
    })
  }
}
