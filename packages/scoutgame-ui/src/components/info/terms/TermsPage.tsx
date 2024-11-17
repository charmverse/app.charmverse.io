import { Typography } from '@mui/material';

import { InfoCard } from '../../common/DocumentPageContainer/components/InfoCard';
import { DocumentPageContainer } from '../../common/DocumentPageContainer/DocumentPageContainer';
import { List, ListItem } from '../../common/List';
import { InfoPageContainer } from '../components/InfoPageContainer';

export function TermsPage() {
  return (
    <InfoPageContainer data-test='terms-page' title='Terms'>
      <DocumentPageContainer>
        <Document />
      </DocumentPageContainer>
    </InfoPageContainer>
  );
}

function Document() {
  return (
    <InfoCard>
      <Typography component='em'>Last modified: September 30, 2024</Typography>
      <Typography>
        Scout Game, fully owned by CharmVerse Inc. (“Us” or “We”) provides the scoutgame.xyz site and various related
        services (collectively, the “Site”) to you (“You”), the user (“User”), subject to your compliance with all the
        terms, conditions, and notices contained or referenced herein (the “Terms of Service” or “TOS”), as well as any
        other written agreement between us and you. In addition, when using particular services or materials on or
        related to this Site, users shall be subject to any posted rules applicable to such services or materials that
        may contain terms and conditions in addition to those in these Terms of Service. All such guidelines or rules
        are hereby incorporated by reference into these Terms of Service. BY USING THIS SITE, YOU AGREE TO BE BOUND BY
        THESE TERMS OF SERVICE. IF YOU DO NOT WISH TO BE BOUND BY THE THESE TERMS OF SERVICE, PLEASE EXIT THE SITE NOW.
        YOUR REMEDY FOR DISSATISFACTION WITH THIS SITE, OR ANY PRODUCTS, SERVICES, CONTENT, OR OTHER INFORMATION
        AVAILABLE ON OR THROUGH THIS SITE, IS TO STOP USING THE SITE AND/OR THOSE PARTICULAR PRODUCTS OR SERVICES. YOUR
        AGREEMENT WITH US REGARDING COMPLIANCE WITH THESE TERMS OF SERVICE BECOMES EFFECTIVE IMMEDIATELY UPON
        COMMENCEMENT OF YOUR USE OF THIS SITE. These Terms of Service are effective as of the “Last Modified” date
        identified at the top of this page. However, for any material modifications to the Terms of Service or in the
        event that such modifications materially alter your rights or obligations hereunder, such amended Terms of
        Service will automatically be effective upon the earlier of (i) your continued use of this Site and related
        services with actual knowledge of such modifications, or (ii) 30 days from publication of such modified Terms of
        Service on this service. Notwithstanding the foregoing, the resolution of any dispute that arises between you
        and us will be governed by the Terms of Service in effect at the time such dispute arose.
      </Typography>
      <Typography variant='h5' color='secondary'>
        Overview of our Services
      </Typography>
      <Typography>
        Scout Game provides a game where participants assemble a proxy collection of real software developers. The
        collections compete based on the real-time software contributions of those developers. The “Service” does not
        include Your Data (as defined below) or any software application or service that is provided by you or a third
        party, which you use in connection with the Service. Any modifications and new features added to the Service are
        also subject to this TOS. Scout Game reserves the right to modify or discontinue the Service (or any Service
        plan) or any feature or functionality thereof at any time without notice to you. All rights, title and interest
        in and to the Service and its components (including all intellectual property rights) will remain with and
        belong exclusively to Scout Game.
      </Typography>
      <Typography variant='h5' color='secondary'>
        Minimum configuration requirements
      </Typography>
      <Typography>
        To use the Service, the User must first create a User account by following the procedure described for this
        purpose on the Site. To be able to use a User account, the User must enter a valid smart contract address or
        Farcaster account throughout the entire duration of the Service usage period. The User alone is responsible for
        keeping the access codes to their crypto wallet and other 3rd party accounts private, and Scout Game declines
        all liability if the Service is used by a person other than the User or a person authorized by the latter,
        possessing the usernames and passwords to the User's account. User account is non-transferable.
      </Typography>

      <Typography variant='h5' color='secondary'>
        Term and Termination
      </Typography>
      <Typography>
        This TOS will continue in full effect unless and until your account or this TOS is terminated as described
        herein. You have the right to deactivate your account at any time by using the account deactivation interface
        provided at scoutgame.xyz.
      </Typography>

      <Typography variant='h6'>Termination of Service</Typography>
      <Typography>
        We may modify, replace, refuse access to, suspend or discontinue the Services, partially or entirely, or add,
        change and modify prices for all or part of the Services for you or for all our users at any time and in our
        sole discretion. All of these changes shall be effective upon their posting on the Site or by direct
        communication to you unless otherwise noted. We may cancel your account for any or no reason immediately upon
        notice to you.
      </Typography>
      <List listStyleType='decimal'>
        <ListItem>Services may be terminated by us, without cause, at any time.</ListItem>
        <ListItem>
          Services may be terminated by you, without cause, by following the cancellation procedures set forth in the
          Term and Termination section.
        </ListItem>
        <ListItem>
          Scout Game may terminate Services at any time, without penalty and without notice, if you fail to comply with
          any of the terms of this Agreement or the intellectual property protections applicable to these Services.
        </ListItem>
        <ListItem>
          Notice of termination of Services by Scout Game may be sent to the contact email associated with your account.
          Upon termination, Scout Game has the right to delete all data, files, or other information that is stored in
          your account.
        </ListItem>
      </List>

      <Typography variant='h5' color='secondary'>
        Rules
      </Typography>
      <Typography>
        To ensure the quality of the Scout Game experience, we have set up our Terms of Service for our mutual benefit.
        If you violate these rules it will mean you've broken the terms of service and this may result in a termination
        of your account. You agree to all of the following:
      </Typography>
      <List listStyleType='decimal'>
        <ListItem>
          You hereby certify that you are at least 13 years of age. Individuals under the age of 13 are prohibited from
          using the Site and Services.
        </ListItem>
        <ListItem>
          You will ensure that the Farcaster account, email address, and smart contract address provided in your account
          registration are always valid and keep your contact information accurate and up-to-date.
        </ListItem>
        <ListItem>
          You will not use the Services for any unlawful purposes or to conduct any unlawful activity, including, but
          not limited to, fraud, embezzlement, money laundering or insider trading.
        </ListItem>
        <ListItem>
          You will not use the Services or Site if you are located in a country embargoed by the U.S., or are on the
          U.S. Treasury Department's list of Specially Designated Nationals.
        </ListItem>
        <ListItem>You will not use the Services or Site to impersonate another person.</ListItem>
        <ListItem>
          You will not use the Service or Site to upload, post, transmit, or otherwise make available any unsolicited or
          unauthorized advertising, cold sales emails, promotional materials, "junk mail," "spam," "chain letters,"
          "pyramid schemes," or any other form of solicitation.
        </ListItem>
        <ListItem>
          You may not send messages using the Service which do not correctly identify the sender and you may not alter
          the attribution of origin in electronic mail messages or postings.
        </ListItem>
        <ListItem>
          You will not share your password, let anyone else access your account, or do anything that might jeopardize
          the security of your account.
        </ListItem>
        <ListItem>
          Scout Game has a zero tolerance policy for abusive language and/or abusive behavior towards our company, the
          Service we provide and/or our employees. Any user deemed at our sole discretion to be abusive will result in
          immediate irrevocable account termination without refund. Threats to sue, slander, libel, etc. will all be
          considered abuse.
        </ListItem>
      </List>
      <Typography>
        Scout Game may determine in its sole discretion whether or not an account is in violation of any of these
        policies. Violation of any of these policies may result in user information tracking with such information being
        stored to identify the offending user. Offending users may be permanently restricted from holding an account or
        using the Services. If Scout Game reasonably determines that your account is being used for illegal or
        fraudulent activity then your account may be immediately terminated and your financial data erased. We may also
        report you to law enforcement officials in the appropriate jurisdictions.
      </Typography>

      <Typography variant='h5' color='secondary'>
        Privacy
      </Typography>
      <Typography>
        We encourage you to read the Privacy Policy and to use the information it contains to help you make informed
        decisions. You acknowledge, consent and agree that we may access, preserve, and disclose your registration and
        any other information you provide if required to do so by law or in a good faith belief that such access
        preservation or disclosure is reasonably necessary in our opinion. Disclosures of user information to third
        parties are further addressed in the Privacy Policy.
      </Typography>

      <Typography variant='h6'>Your Data Rights and Related Responsibilities</Typography>
      <List listStyleType='decimal'>
        <ListItem>
          Scout Game is by design exposed to various types of information and data into the Services for access
          management purposes ("Your Data"). Your Data means any data and content you transmit to Scout Game or is
          otherwise made available via the Services. Your Data includes metadata such as profile and anything else you
          enter or upload into the Service or Site. Scout Game will make commercially reasonable efforts to ensure that
          all facilities used to store and process Your Data meet a high standard for security. For more information on
          our current practices and policies regarding data privacy, security and confidentiality, please see our
          privacy policy; we keep that document updated as these practices and policies evolve over time.
        </ListItem>
        <ListItem>
          In order for us to provide the Service to you, we require that you grant us certain rights with respect to
          Your Data. For example, we need to be able to transmit, store and copy Your Data in order to display it to
          you, to make backups to prevent data loss, and so on. Your acceptance of this TOS gives us the permission to
          do so and grants us any such rights necessary to provide the Service to you, only for the purpose of providing
          the Service (and for no other purpose). This permission includes allowing us to use third-party service
          providers (such as Amazon Web Services) in the operation and administration of the Service and the rights
          granted to us are extended to these third parties to the degree necessary in order for the Service to be
          provided.
        </ListItem>
        <ListItem>
          If any Users send us any feedback or suggestions regarding the Service, you grant Scout Game an unlimited,
          irrevocable, perpetual, free license to use any such feedback or suggestions for any purpose without any
          obligation to you.
        </ListItem>
      </List>

      <Typography variant='h5' color='secondary'>
        Disputes
      </Typography>
      <Typography>
        The formation, interpretation and performance of this Agreement and any disputes arising out of it shall be
        governed by the substantive and procedural laws of the state of Delaware without regard to its rules on
        conflicts or choice of law and, to the extent applicable, the laws of the United States of America. The
        exclusive jurisdiction and venue for actions related to the subject matter hereof shall be the state and federal
        courts located in Delaware, USA and you hereby submit to the personal jurisdiction of such courts. You hereby
        waive any right to a jury trial in any proceeding arising out of or related to this Agreement.
      </Typography>

      <Typography variant='h5' color='secondary'>
        Notices
      </Typography>
      <Typography>
        Any notices or other communications permitted or required hereunder, including those regarding modifications to
        these Terms of Service, will be in writing and given: by Scout Game (i) via email (in each case to the address
        that you provide) or (ii) by posting to the Site. For notices made by email, the date of receipt will be deemed
        the date on which such notice is transmitted.
      </Typography>
    </InfoCard>
  );
}
