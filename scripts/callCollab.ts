import fetch from 'adapters/http/fetch.server';

const API_KEY = process.env.COLLAB_API_KEY as string;

const aeToken = 'AQICAHhuh8o15jTBiKupSn4nNWgkQFmby0vKwGFSbeVzkjpvbQHDldcj_D1NNFQNgG0k-PVjAAACYzCCAl8GCSqGSIb3DQEHBqCCAlAwggJMAgEAMIICRQYJKoZIhvcNAQcBMB4GCWCGSAFlAwQBLjARBAzyvMbQMGWjH7g632ACARCAggIWDskTxEXYJeK4vN-KyltK7dCZbd2Sdmeyj0r-ovUmR0Qi924x8nIDTDqNC4pK6jU7V7kuhred2Ch9GQyXfraoEnPvUtmXhvKsFl7M74RGuMu2fd-PfmFBoC_F9aH-PJrV29tLrjFO6RQba5Y1SIwj7yjyoJMt3sPq3ShLQ_1KN0w19NxJjQUoF9-drwTuINqRW0pvfTXm4As_3AlW1lR62vFKbDGkyhihfzDYACCnMY9E8a1BO6FOvUXFKILOf8K9NGNZ7cKiH9XHWsU9DB8mU7MmpHuBXNqBGMDLn-JPUtyCe_emfAfKNOSO5Z5UDDKz8i04m5Ytmddv1Bu4Wvp38eO_VV7rgFlilNISsNgiLQF-lwpoELmpmsusUSQFc9iyHAsa78rlMCGhQW_A6HPXEJYv2I14huBmJx2xNaTf8WX7epAaCwvSaNJkq_PW81draKlMmiPZ68VZB-obk_kSD9bxVk9TdwI0SD1-JgzCPy1SVkIixEbYv1BrMYOK160bwJsrAgppsZYGHeBUlAkjLpmpCtxb8OseC8HTrGGdGjYNSMlw07zTidGKvCmQqlDn4Rrigu0qVGh2v-6k_syTbZNJdqJwlkZXsKRv1y4JDAstFivujiKMyNXvUA9D1Ftqu21w-fHLQWFTvtwDiIGCKXE-RYlbB8kHwCQWZzjN_aH7N-zUT85VPl8TbtR-kRebTnYPSftN';

(async () => {

  try {
    const res = await fetch('https://api-qa.collab.land/veramo/vcs', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-API-KEY': API_KEY,
        Authorization: `AE ${aeToken}`,
        'Content-Type': 'application/json'
      }
    });
    // console.log('res', res);
  }
  catch (e) {
    // console.log('e', e);
  }

})();

export {};
