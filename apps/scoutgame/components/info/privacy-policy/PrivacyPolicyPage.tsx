import { Typography } from '@mui/material';

import { InfoCard } from 'components/common/DocumentPageContainer/components/InfoCard';
import { DocumentPageContainer } from 'components/common/DocumentPageContainer/DocumentPageContainer';
import { List, ListItem } from 'components/common/List';

import { InfoPageContainer } from '../components/InfoPageContainer';

export function PrivacyPolicyPage() {
  return (
    <InfoPageContainer data-test='privacy-page' title='Privacy Policy'>
      <DocumentPageContainer>
        <Document />
      </DocumentPageContainer>
    </InfoPageContainer>
  );
}

function Document() {
  return (
    <>
      <InfoCard title='Plain English Version of Our Privacy Policy'>
        <Typography>
          Plain English Version of Our Privacy Policy We keep your electronic wallet address, Farcaster ID, and email so
          you can use our system. We place cookies on your browser to make our system faster. We may use your email to
          send you information about our system. Please keep your personal information up to date. We do not and will
          not sell Your Data, individually or in aggregated form. You may stop receiving information from us at any
          time. You may access your personal data at any time. You are responsible for maintaining the privacy of the
          data you enter into our system. You may delete your data in our system at any time. We keep your data private
          on our cloud providers. At present, we use AWS. Scout Game, wholly owned by CharmVerse Inc., is a U.S.
          company. We follow the laws of all the countries where we operate. More information is below.
        </Typography>
        <Typography component='em'>Effective Date: 09/30/2024</Typography>
      </InfoCard>
      <InfoCard title='About This Privacy Policy'>
        <Typography>
          This Privacy Policy (the “Policy”) applies to the website https://scoutgame.xyz and various related services
          (collectively, the “Sites”, “Services”, “we”, “us”, or “our”). Scout Game “Users” are the people who have
          created a Scout Game account. A Scout Game “Viewer” is a person who visits the Scout Game Sites but may or may
          not be a Scout Game User. This Policy describes how we collect, use and disclose information, and what choices
          you have with respect to the information. This Policy should be read in conjunction with our Terms of Service.
        </Typography>
        <Typography>
          We understand that by choosing Scout Game, you are placing some of your important data in our hands. We are
          only in business if you trust us, so your privacy means everything to us! Here are the key things you should
          know:
        </Typography>
        <Typography>
          Any terms defined in the Terms of Use and Data Processing Addendum and not otherwise defined in this Privacy
          Notice are hereby adopted by reference in this Privacy Notice.
        </Typography>
      </InfoCard>
      <InfoCard title='Information We Collect and Receive​'>
        <Typography>
          Our primary goals in collecting information are to provide and improve our Services, to administer your use of
          the Services, and to enable you to enjoy and easily navigate our Services. We collect and use this information
          to provide, improve, and protect our Services.
        </Typography>
        <Typography variant='h6'>A. Information Related to Your Account and Interaction with Scout Game</Typography>
        <Typography>
          Registration and Contact Information. We collect certain "Personally Identifiable Information" from you when
          you sign up for our Services that can be used to identify you, such as your email address, electronic wallet
          address, and any other information that we deem relevant for the purpose of providing you with our Services or
          which you provided to us voluntarily. This category also includes information tied to your identity that you
          provide us through other means, such as emails to our support service.
        </Typography>
        <Typography>
          Technical, Usage, and Location Information. Whenever you visit our Site, we may collect "Non-identifying
          Information" from you, such as your referring URL, browser, operating system, cookie information, and Internet
          Service Provider. Without a subpoena, voluntary compliance on the part of your Internet Service Provider, or
          additional records from a third party, this information alone cannot usually be used to identify you.
        </Typography>
        <Typography>
          Other Information. We receive additional information provided to us when submitted to our Sites or if you
          participate in a focus group, contest, activity, or event, apply for a job, or otherwise communicate with
          Scout Game.
        </Typography>
        <Typography variant='h6'>B. Information Related to Our Service</Typography>
        <Typography>
          Farcaster: We retrieve information from your Farcaster account to perform the Services-related identities and
          related social graph.
        </Typography>
        <Typography variant='h6'>C. Cookies</Typography>
        <Typography>
          Depending on how you're accessing our services and subject to your opt-out preferences, we may use "Cookies"
          (a small text file sent by your computer each time you visit our Website, unique to your Scout Game account or
          your browser) or similar technologies to record log data. When we use Cookies, we may use 'session' Cookies
          (that last until you close your browser) or 'persistent' Cookies (that last until you or your browser deletes
          them). We DO NOT use any third-party cookies. For example, we may use Cookies to keep you logged into Scout
          Game. Some of the Cookies we use are associated with your Scout Game account (including personal information
          about you, such as the email address you gave us), and other Cookies are not. Scout Game provides a
          centralized cookie management service across the entire Scout Game application. You can set your browser to
          refuse cookies from websites or to remove cookies from your hard drive, but this may limit your ability to use
          the Services.
        </Typography>
        <Typography variant='h5' color='secondary'>
          How We Use the Information We Collect
        </Typography>
        <Typography>We use your information in the following ways:</Typography>
        <List>
          <ListItem>
            To provide, update, maintain, improve and protect our Services, including operating certain features and
            functionality of the Services, preventing or addressing service errors, security or technical issues,
            analyzing and monitoring usage, trends, and other activities.
          </ListItem>
          <ListItem>
            For billing, account management, and other administrative matters, we share and use Payment Information as
            described in Section Payment Information.
          </ListItem>
          <ListItem>To respond to your support requests, comments, and questions.</ListItem>
          <ListItem>
            To control unauthorized use or abuse of the Services, if we have a good faith belief, or have received a
            complaint alleging that Your Data is in violation of our Acceptable Use Guidelines.
          </ListItem>
          <ListItem>
            To communicate directly with you, including by sending you newsletters, promotions, and special offers or
            information about new products and services. You may, at any time, request to opt-out of receiving future
            emails or notifications from us, by contacting us.
          </ListItem>
        </List>
        <Typography variant='h5' color='secondary'>
          How We Share And Disclose Information
        </Typography>
        <Typography>
          We do not and will not sell Your Data, individually or in aggregated form. We may share or transfer your
          personal information to third parties only in the following limited circumstances:
        </Typography>
        <Typography>
          We will display your Account information on your https://scoutgame.xyz page and elsewhere through the Services
          in accordance with the preferences you set in your Account. You can review and revise your Account information
          at any time.
        </Typography>
        <Typography>
          We will display Your Data within the Services as directed by you. If you elect to use a third-party
          application through the Services, then we may share or disclose Your Data with that third-party application as
          directed by you. Please remember that we are not responsible for the privacy practices of such third parties
          so you should make sure you trust the application and that it has a privacy policy acceptable to you.
        </Typography>
        <Typography>
          With Trusted Service Providers and Business Partners. We may utilize trusted third-party service providers to
          assist us in delivering, improving, protecting, and promoting the Services. For example, we may use third
          parties to help host our Services, send out email updates, perform analyses related to the operation of the
          Services, or process payments. These third-party service providers may have access to Your Data for the
          limited purpose of providing the service we have contracted with them to provide. They are required to have a
          privacy policy and security standards in place that are at least as protective of your information as this
          Privacy Policy.
        </Typography>
        <Typography>
          In Connection With a Sale or Change of Control. If the ownership of all or substantially all of our business
          changes, we may transfer your information to the new owner so that the Services can continue to operate. In
          such case, your information would remain subject to the promises and commitments contained in this Privacy
          Policy until such time as this Privacy Policy is updated or amended by the acquiring party upon notice to you.
        </Typography>
        <Typography variant='h5' color='secondary'>
          Other Access to or Disclosure of Your Information
        </Typography>
        <Typography>
          We restrict access to any data and content you transmit to Scout Game or is otherwise made available via the
          Services to Scout Game employees, payment processors, contractors, and agents who need to know that
          information in order to perform the Services. All of these individuals are subjected to strict contractual
          confidentiality obligations and may be disciplined or terminated if they fail to meet these obligations.
        </Typography>

        <Typography variant='h5' color='secondary'>
          Security and Information Protection
        </Typography>
        <Typography>
          We take security seriously. We take various steps to protect the information you provide to us from loss,
          misuse, and unauthorized access or disclosure. These steps take into account the sensitivity of the
          information we collect, process, and store, and the current state of technology. We use commercially
          reasonable and industry-standard physical, managerial, and technical safeguards to preserve the integrity and
          security of your information.
        </Typography>

        <Typography variant='h5' color='secondary'>
          Payment Information
        </Typography>
        <Typography>
          For digital asset purchases, we use decent.xyz to facilitate onchain transactions with your blockchain
          wallet(s).
        </Typography>

        <Typography variant='h5' color='secondary'>
          Your Controls and Choices
        </Typography>
        <Typography>
          Opt-Outs. Scout Game provides you with the opportunity to choose (opt-out) whether your personal information
          is to be disclosed to a third party or to be used for a purpose that is incompatible with the purpose(s) for
          which it was originally collected or subsequently authorized. You may exercise your choice by contacting us at
          gamemaker@scoutgame.xyz. If you decide to opt-out, we may not be able to provide certain features of the
          Services to you.
        </Typography>
        <Typography>
          Account. In order to keep your Personal Data accurate and complete, you can log in to review and update your
          account information, including contact and billing information, via your account settings page. You may also
          contact us to request information about the personal data we have collected from you and to request the
          correction, modification or deletion of such Personal Data. We will do our best to honor your requests subject
          to any legal and contractual obligations. If you would like to make a request, cancel your account or request
          we delete or no longer use your account information to provide you our Website, contact us at
          gamemaker@scoutgame.xyz or the address set forth at the end of this Notice. Subject to applicable law, we will
          retain and use your account information only as necessary to comply with our legal obligations, resolve
          disputes, and enforce our agreements.
        </Typography>
        <Typography>
          Communication Preferences. If you receive commercial emails from us, you may unsubscribe at any time by
          following the instructions contained within the email. You may also opt-out from receiving commercial e-mail
          from us, and any other promotional communications that we may send to you from time to time by sending your
          request to us by e-mail at gamemaker@scoutgame.xyz. Additionally, we may allow you to view and modify settings
          relating to the nature and frequency of promotional communications that you receive from us.
        </Typography>
        <Typography>
          Please be aware that if you opt-out of receiving commercial e-mail from us, it may take up to ten business
          days for us to process your opt-out request, and you may receive commercial e-mail from us during that period.
          Additionally, even after you opt-out from receiving commercial messages from us, you will continue to receive
          administrative messages from us regarding our Service.
        </Typography>
        <Typography>
          Blocking Cookies. You can remove or block certain cookies using your browser's settings, but the Offerings may
          cease to function properly if you do so. You may also change or withdraw your cookie consent from this Privacy
          Policy.
        </Typography>

        <Typography variant='h5' color='secondary'>
          Users Outside the USA
        </Typography>
        <Typography>Our application and database servers are located here in the United States.</Typography>
        <Typography>
          If you are an individual located in the European Economic Area, the United Kingdom, Canada or another
          jurisdiction outside of the United States with laws and regulations governing personal data collection, use,
          and disclosure that differ from United States laws, please be aware that information we collect (including
          through the use of methods such as Cookies and other web technologies) will be processed and stored in the
          United States or in other countries where we or our third-party Service Providers have operations. By
          submitting your personal data to Scout Game and using Scout Game, you expressly consent to have your personal
          data transferred to, processed, and stored in the United States or another jurisdiction which may not offer
          the same level of privacy protection as those in the country where you reside or are a citizen.
        </Typography>
        <Typography>
          In connection with the operation of its Website, Scout Game may transfer your personal data to various
          locations, which may include locations both inside and outside of the European Economic Area. We process
          personal data submitted relating to individuals in Europe via the Standard Contractual Clauses.
        </Typography>

        <Typography variant='h5' color='secondary'>
          Do Not Track
        </Typography>
        <Typography>
          We do not currently recognize or respond to browser-initiated Do Not Track signals as there is no consistent
          industry standard for compliance.
        </Typography>

        <Typography variant='h5' color='secondary'>
          Changes to the Privacy Policy
        </Typography>
        <Typography component='em'>
          We reserve the right to change our Privacy Policy at any time. If we make changes, we will post them and will
          indicate on this page the policy's new effective date. If we make material changes to this policy, we will
          notify you via our Discord server and/or a notice on the Services.
        </Typography>

        <Typography variant='h5' color='secondary'>
          No Children Under Age 13
        </Typography>
        <Typography>
          The Services are not intended for use by anyone under the age of 13, nor does Scout Game knowingly collect or
          solicit personal information from anyone under the age of 13. If you are under 13, you may not attempt to
          register for the Services or send any information about yourself to us, including your name, address,
          telephone number, or email address. In the event that we confirm that we have collected personal information
          from someone under the age of 13 without verification of parental consent, we will delete that information
          promptly. If you are a parent or legal guardian of a child under 13 and believe that we might have any
          information from or about such a child, please contact us at the email address provided at the end of this
          Privacy Policy.
        </Typography>

        <Typography variant='h5' color='secondary'>
          Contact Us
        </Typography>
        <Typography component='em'>
          If you have questions or need to contact us about this Privacy Policy, please email us at
          gamemaker@scoutgame.xyz.
        </Typography>

        <Typography variant='h5' color='secondary'>
          Privacy Notice for California Residents
        </Typography>
        <Typography component='em'>Effective September 30, 2024</Typography>
        <Typography component='em'>
          This Privacy Notice for California Residents ("California Notice") supplements the Scout Game Privacy Notice.
          It applies solely to Scout Game Users and Viewers who live in the State of California ("California
          Residents"). Scout Game adopts this notice to comply with the California Consumer Privacy Act of 2019 and any
          subsequent amendments ("CCPA"). All terms used in this California Notice have the same meaning as when used in
          the CCPA.
        </Typography>

        <Typography variant='h5' color='secondary'>
          Information Scout Game May Collect Regarding California Residents
        </Typography>
        <Typography>
          Scout Game collects information that identifies, relates to, describes, references, is capable of being
          associated with, or could reasonably be linked, directly or indirectly, with a particular consumer or device
          ("Personal Information"). In particular, our Website may have collected the following categories of Personal
          Information from California Resident Users and Viewers within the last twelve months, for the purpose of
          establishing, maintaining, and supporting the services that we provide through our Website:
        </Typography>
        <Typography>
          A. Identifiers: real name; alias; email address; crypto wallet addresses; internet protocol address.
        </Typography>
        <Typography>
          B. Personal Information categories listed in Cal. Civ. Code Sec. 1798.80(e): Real name; phone number.
        </Typography>
        <Typography>C. Commercial information: Purchase records regarding Scout Game products.</Typography>
        <Typography>
          D. Internet or other similar network activity: Data on Viewers' interaction with the Scout Game Website.
        </Typography>

        <Typography>
          Scout Game Obtains the Categories of Personal Information Listed Above from the Following Categories of
          Sources
        </Typography>
        <List>
          <ListItem>Directly from our Users.</ListItem>
          <ListItem> Indirectly from our Users.</ListItem>
          <ListItem> Directly and indirectly from activity on our Website. </ListItem>
          <ListItem>From third parties that interact with us in connection with the services we perform.</ListItem>
        </List>

        <Typography variant='h5' color='secondary'>
          How California Resident Personal Information May Be Used
        </Typography>
        <Typography component='em'>
          We may use or disclose the Personal Information we collect for one or more of the following business purposes:
        </Typography>
        <List>
          <ListItem>To fulfill or meet the reason for which the information is provided.</ListItem>
          <ListItem>To provide you with information or services that you request from us.</ListItem>
          <ListItem>
            To provide you with email alerts and other notices concerning our services, or news that may be of interest
            to you.
          </ListItem>
          <ListItem>
            To carry out our obligations and enforce our rights arising from any contracts entered into between you and
            us, including for billing and collections.
          </ListItem>
          <ListItem>To improve our Website.</ListItem>
          <ListItem>For testing, research, analysis and service development.</ListItem>
          <ListItem>As necessary or appropriate to protect Scout Game and our Users.</ListItem>
          <ListItem>
            To respond to law enforcement requests and as required by applicable law, court order, or governmental
            regulations.
          </ListItem>
          <ListItem>
            As described to you when your Personal Information was collected, or as otherwise set forth in the CCPA.
          </ListItem>
          <ListItem>
            To evaluate or conduct a merger, divestiture, restructuring, reorganization, dissolution, or other sale or
            transfer of some or all of our assets, whether as a going concern or as part of bankruptcy, liquidation, or
            similar proceeding, in which Personal Information held by Scout Game is among the assets transferred.
          </ListItem>
          <ListItem>
            Scout Game will not collect additional categories of Personal Information or use the Personal Information we
            collect for materially different, unrelated, or incompatible purposes without providing you notice.
          </ListItem>
        </List>

        <Typography variant='h5' color='secondary'>
          Sharing Personal Information
        </Typography>
        <Typography component='em'>
          We may disclose your Personal Information to a third-party for a business purpose. When we disclose Personal
          Information for a business purpose, we enter a contract that describes the purpose and requires the recipient
          to both keep that Personal Information confidential and not use it for any purpose except performing your
          contract.
        </Typography>
        <Typography>
          We disclose your Personal Information for a business purpose to the following categories of third parties:
        </Typography>
        <List>
          <ListItem>Service Providers.</ListItem>
          <ListItem>
            Third parties to whom you or your agents authorize us to disclose your Personal Information in connection
            with the services we provide to you.
          </ListItem>
          <ListItem>Government representatives as required by law.</ListItem>
        </List>
        <Typography>In the preceding twelve (12) months, we have not sold any Personal Information.</Typography>

        <Typography variant='h5' color='secondary'>
          Access to Specific Information and Data Portability Rights
        </Typography>
        <Typography component='em'>
          You have the right to request that we disclose certain information to you about our collection and use of your
          Personal Information over the past 12 months. Once we receive and confirm your verifiable consumer request, we
          will disclose to you:
        </Typography>
        <List>
          <ListItem>The categories of Personal Information we collected about you.</ListItem>
          <ListItem>The categories of sources for the Personal Information we collected about you.</ListItem>
          <ListItem>Our business or commercial purpose for collecting or selling that Personal Information.</ListItem>
          <ListItem>The categories of third parties with whom we share that Personal Information.</ListItem>
          <ListItem>The specific pieces of Personal Information that we have collected about you.</ListItem>
        </List>

        <Typography variant='h5' color='secondary'>
          Deletion Request Rights
        </Typography>
        <Typography component='em'>
          You have the right to request that we delete any of your Personal Information that we have collected from you
          and retained, subject to certain exceptions. All deletion requests will be managed in accordance with Scout
          Game Deletion Procedures. Deletion requests should be sent to gamemaker@scoutgame.xyz. Once we receive and
          confirm your verifiable request, we will delete (and direct our Service Providers to delete) your Personal
          Information from our records, unless an exception applies.
        </Typography>
        <Typography>
          We may deny your deletion request if retaining the information is necessary for us or our service providers
          to:
        </Typography>
        <List>
          <ListItem>
            Complete the transaction for which we collected the Personal Information, provide a service that you
            requested, take actions reasonably anticipated within the context of our ongoing business relationship with
            you, or otherwise perform our contract with you.
          </ListItem>
          <ListItem>
            Detect security incidents, protect against malicious, deceptive, fraudulent, or illegal activity, or
            prosecute those responsible for such activities.
          </ListItem>
          <ListItem>Debug software to identify and repair errors that impair existing intended functionality.</ListItem>
          <ListItem>Comply with the California Electronic Communications Privacy Act.</ListItem>
          <ListItem>
            Enable solely internal uses that are reasonably aligned with consumer expectations based on your
            relationship with us.
          </ListItem>
          <ListItem>Comply with a legal obligation.</ListItem>
          <ListItem>
            Otherwise lawfully use that information in compatibility with the context in which you provided it.
          </ListItem>
        </List>

        <Typography variant='h5' color='secondary'>
          Exercising Access, Data Portability, and Deletion Rights
        </Typography>
        <Typography component='em'>
          To exercise the access, data portability, and deletion rights described above, please submit a verifiable
          consumer request to us by reaching out to gamemaker@scoutgame.xyz.
        </Typography>
        <Typography>
          Only you or a person registered with the California Secretary of State that you authorize to act on your
          behalf may make a verifiable consumer request related to your Personal Information. You may also make a
          verifiable consumer request on behalf of your minor child. You may only make a verifiable California Resident
          request for access or data portability twice within a 12-month period.
        </Typography>
        <Typography>The request must:</Typography>
        <List>
          <ListItem>
            Provide sufficiently detailed information to allow Scout Game to reasonably verify that you are the person
            to whom the requested Personal Information pertains or their authorized representative.
          </ListItem>
          <ListItem>
            Include sufficient detail to allow us to properly understand, evaluate, and respond to it.
          </ListItem>
          <ListItem>
            We cannot respond to your request or provide you with Personal information if we cannot verify your identity
            or authority to make the request and confirm the Personal Information relates to you.
          </ListItem>
          <ListItem>Making a verifiable consumer request does not require you to create an account with us.</ListItem>
          <ListItem>
            Scout Game will only use Personal Information provided in a verifiable consumer request to verify the
            requestor's identity or authority to make the request.
          </ListItem>
        </List>

        <Typography variant='h5' color='secondary'>
          Response Timing and Format
        </Typography>
        <Typography>
          We will attempt to respond to California Resident requests in as timely a fashion as possible. In the event of
          delays over 60 days, we will inform you of the reason and extension period in writing. If you have an account
          with us, we will deliver our written response to that account. Any disclosures we provide will only cover the
          12-month period preceding the verifiable receipt of a California Resident's request. The response we provide
          will explain the reasons we cannot comply with a request, if applicable.
        </Typography>
        <Typography>
          We do not charge a fee to process or respond to your verifiable consumer request unless it is excessive,
          repetitive, or manifestly unfounded. If we determine that the request warrants a fee, we will tell you why we
          made that decision and provide you with a cost estimate before fulfilling your request.
        </Typography>
      </InfoCard>
    </>
  );
}
