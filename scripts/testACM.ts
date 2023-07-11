import {  getCertificateARNByDomain, getCertificateDetails, requestCertificateForDomain } from "lib/aws/ACM";
import { addCertificateToListener, getListenerCertificates, hasCertificateAdded } from "lib/aws/ELB";
import { verifyCustomDomainConfig } from "lib/spaces/verifyCustomDomainConfig";

export async function testACM() {
  const res = await verifyCustomDomainConfig('asd')
  console.log('🔥', res);
}

testACM();
