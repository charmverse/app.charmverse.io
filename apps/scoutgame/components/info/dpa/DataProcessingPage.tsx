import { Typography } from '@mui/material';

import { InfoCard } from 'components/common/DocumentPageContainer/components/InfoCard';
import { List, ListItem } from 'components/common/DocumentPageContainer/components/List';
import { DocumentPageContainer } from 'components/common/DocumentPageContainer/DocumentPageContainer';

export function DataProcessingPage() {
  return (
    <DocumentPageContainer data-test='dpa-page'>
      <Typography variant='h4' align='center' color='secondary'>
        Data Processing Addendum
      </Typography>
      <Document />
    </DocumentPageContainer>
  );
}

function Document() {
  return (
    <>
      <InfoCard>
        <Typography component='em'>Last modified: September 30, 2024</Typography>
        <Typography>
          This Data Processing Addendum, including the Standard Contractual Clauses and UK Addendum referenced herein
          and Exhibits A and B to this addendum ("DPA"), is incorporated into any existing and currently valid Terms of
          Use (the "Agreement") either previously or concurrently made between you (together, with any subsidiaries and
          affiliated entities, collectively, "Customer") and Scout Game, wholly own by CharmVerse Inc. (together, with
          any subsidiaries and affiliated entities, collectively "Scout Game" or "Processor") and sets forth additional
          terms that apply to the extent any information you provide to Scout Game pursuant to the Agreement includes
          Personal Data (as defined below).
        </Typography>

        <Typography>
          1.0 Defined Terms.
          <br /> The following definitions are used in this DPA
        </Typography>

        <Typography>
          1.1 "Authorized Personnel" means (a) Scout Game's employees who have a need to know or otherwise access
          Personal Data for the purposes of performing applicable services; and (b) Scout Game's contractors, agents,
          and auditors who have a need to know or otherwise access Personal Data to enable Scout Game to perform its
          obligations under the Agreement and this DPA, and who are bound in writing by confidentiality and other
          obligations sufficient to protect Personal Data in accordance with the terms and conditions of this DPA.
        </Typography>

        <Typography>
          1.2 "CCPA" means the California Consumer Privacy Act of 2018, Cal. Civ. Code § [1798.100 – 1798.199.100]).
        </Typography>

        <Typography>
          1.3 "Data Protection Laws" means all applicable federal, state, and foreign data protection, privacy, and data
          security laws, as well as applicable regulations and formal directives intended by their nature to have the
          force of law, including, without limitation, the EU Data Protection Laws, UK Data Protection Laws, and the
          CCPA but excluding, without limitation, consent decrees.
        </Typography>

        <Typography>
          1.4 "EU Data Protection Laws" means GDPR together with any applicable implementing legislation or regulations
          of the European Union or Member State laws, as amended from time to time.
        </Typography>

        <Typography>
          1.5 "GDPR" means General Data Protection Regulation (Regulation (EU) 2016/679 of the European Parliament and
          of the Council of 27 April 2016 on the protection of natural persons with regard to the processing of personal
          data and on the free movement of such data.)
        </Typography>

        <Typography>
          1.6 "Personal Data" means any information relating to an identified or identifiable natural person that is
          Processed by Scout Game on behalf of Customer in connection with providing the Services to Customer when such
          data is protected as "personal data" or "personally identifiable information" or a similar term under Data
          Protection Law(s).
        </Typography>

        <Typography>
          1.7 "Process" or "Processing" means any operation or set of operations that is performed upon Personal Data,
          whether or not by automatic means, such as collection, recording, organization, storage, adaptation or
          alteration, retrieval, consultation, use, disclosure by transmission, dissemination or otherwise making
          available, alignment or combination, blocking, erasure or destruction.
        </Typography>

        <Typography>
          1.8 "Security Breach" means a confirmed breach of Scout Game's security measures leading to the accidental or
          unlawful destruction, loss, alteration, unauthorized disclosure of, or access to Personal Data.
        </Typography>

        <Typography>
          1.9 "Standard Contractual Clauses" of "SCCs" means the model clauses for the transfer of Personal Data to
          processors established in third countries approved by the European Commission, the approved version of which
          is set out in the European Commission Implementing Decision (EU) 2021/914 of 4 June 2021 and at
          https://eur-lex.europa.eu/eli/dec_impl/2021/914/oj?uri=CELEX%3A32021D0914&locale=e.
        </Typography>

        <Typography>
          1.10 "UK Addendum" means the International Data Transfer Addendum to the EU Commission Standard Contractual
          Clauses (the "SCCs" defined above) issued by the Commissioner under S119A(1) Data Protection Act 2018, Version
          B1.0, in force 21 March 2022 and available at
          https://ico.org.uk/media/for-organisations/documents/4019539/international-data-transfer-addendum.pdf.
        </Typography>

        <Typography>
          1.11 "UK Data Protection Laws" means all laws relating to data protection, the Processing of Personal Data,
          privacy and/or electronic communications in force from time to time in the United Kingdom, including the
          United Kingdom GDPR and the Data Protection Act 2018.
        </Typography>

        <Typography>
          1.12 "UK GDPR" means the United Kingdom General Data Protection Regulation, as it forms part of the law of the
          United Kingdom by virtue of section 3 of the European Union (Withdrawal) Act 2018.
        </Typography>

        <Typography>
          1.13 The terms "Processor", "Controller", and "Data Subject" shall have the meanings given to them under the
          GDPR. Any capitalized terms herein that are not defined in this DPA shall have the meanings associated with
          them in the Agreement, and are hereby adopted by reference in this Addendum.
        </Typography>

        <Typography>2.0 Processing and Transfer of Personal Data</Typography>

        <Typography>
          2.1 Customer Obligations. Customer is the Controller of Personal Data and shall (a) determine the purpose and
          essential means of the Processing of Personal Data in accordance with the Agreement; (b) be responsible for
          the accuracy of Personal Data; and (c) comply with its obligations under Data Protection Laws, including, when
          applicable, ensuring Customer has a lawful basis to collect Personal Data, providing Data Subjects with any
          required notices, and/or obtaining the Data Subject's consent to process the Personal Data.
        </Typography>

        <Typography>
          2.2 Scout Game Obligations. <br />
          Scout Game is the Processor of Personal Data and shall Process Personal Data on Customer's behalf in
          accordance with Customer's written instructions (unless waived in a written requirement) provided during the
          term of this DPA. The parties agree that the Agreement, including this DPA, together with Customer's use of
          Scout Game's services in accordance with the Agreement, constitutes Customer's complete and final written
          instructions to Scout Game in relation to the Processing of Personal Data, and additional instructions outside
          the scope of these instructions shall require a prior written and mutually executed agreement between Customer
          and Scout Game. In the event Scout Game reasonably believes there is a conflict with any Data Protection Law
          and Customer's instructions, Scout Game will inform Customer promptly and the parties shall cooperate in good
          faith to resolve the conflict and achieve the goals of such instruction.
        </Typography>

        <Typography>
          2.3 Data Use. <br />
          Except for the use of Personal Data as necessary to bring and defend claims, to comply with requirements of
          the legal process, to cooperate with regulatory authorities, and to exercise other similar permissible uses as
          expressly provided under Data Protection Laws, Scout Game shall not retain, use, sell, or disclose the
          Personal Data that is not de-identified or aggregated for analytics, for any purpose, including other
          commercial purposes, outside of the direct business relationship with Customer.
        </Typography>

        <Typography>
          2.4 Location of Processing. <br />
          The parties acknowledge and agree that Processing of Personal Data will occur in the United States and perhaps
          in other jurisdictions outside the residence of a Data Subject and Customer shall comply with all notice and
          consent requirements for such transfer and processing to the extent required by Data Protection Laws.
        </Typography>

        <Typography>
          2.5 Return or Destruction of Data. <br />
          Scout Game shall return or securely destroy Personal Data, in accordance with Customer's instructions, upon
          Customer's request or upon the termination of Customer's account(s) unless Personal Data must be retained to
          comply with applicable law.
        </Typography>

        <Typography>
          3.0 EU and United Kingdom Data Protection Laws. <br />
          This Section 3 shall apply with respect to Processing of Personal Data when such Processing is subject to the
          EU Data Protection Laws or UK Data Protection Laws.
        </Typography>

        <Typography>
          3.1 Transfers of Personal Data.
          <br /> Customer acknowledges and agrees that Scout Game is located in the United States and that Customer's
          provision of Personal Data from the European Economic Area or Switzerland ("EU") or the United Kingdom to
          Scout Game for Processing is a transfer of Personal Data to the United States. All transfers of Customer
          Personal Data out of the EU ("EU Personal Data") or the United Kingdom ("UK Personal Data") to the United
          States shall be governed by the Standard Contractual Clauses, and the UK Addendum as applicable, as follows:
        </Typography>

        <Typography>
          3.1.1 For such transfers of EU Personal Data, the terms of Module 2 of the SCCs for Controller to Processor
          transfers, together with Annexes set out in Exhibit A to this DPA, are incorporated in this DPA, and the
          parties agree that the following terms apply: (a) Clause 7 shall not apply; (b) Option 2 of Clause 9(a) shall
          apply with a time period of 30 days in advance; (c) the optional language in Clause 11(a) shall not apply; (d)
          the governing law shall be that of Ireland in Clause 17; (e) disputes shall be resolved by the courts of
          Ireland in Clause 18; and (f) the annexes are completed in Exhibit A to this DPA.
        </Typography>

        <Typography>
          3.1.2 For such transfers of UK Personal Data, Module 2 of the SCCs shall apply as set forth in subsection
          3.1.1. above, and the UK Addendum as set out in Exhibit B to this DPA shall apply and is incorporated into
          this DPA.
        </Typography>

        <Typography>
          3.2 GDPR Contractual Requirements. <br />
          Scout Game shall: (a) assist Customer, to a reasonable extent, in complying with its obligations with respect
          to EU Personal Data pursuant to Articles 32 to 36 of GDPR; (b) maintain a record of all categories of
          Processing activities carried out on behalf of Customer in accordance with Article 30(2) of the GDPR; and (c)
          cooperate, on request, with an EU supervisory authority regarding the performance of the Services under the
          Agreement.
        </Typography>

        <Typography>
          3.3 Sub-processors. Customer grants a general authorization to Scout Game and its affiliates to appoint as
          sub-processors the entities set out in Exhibit A attached hereto, and for the sub-processing activities
          described there on, as it may be updated from time to time.
        </Typography>

        <Typography>
          4.0 CCPA <br />
          This Section 4 shall apply with respect to Processing of Personal Data when such Processing is subject to the
          CCPA. Scout Game acts as Customer's service provider with respect to such Processing. Scout Game shall Process
          such Personal Data only for the purpose of providing the services to Customer, and shall not sell such
          Personal Data. For purposes of this Section 4, the terms "service provider" and "sell" shall have the meanings
          given to them under the CCPA.
        </Typography>

        <Typography>
          5.0 Customer Representation and Warranty <br />
          Customer represents and warrants on behalf of itself and its employees that the Personal Data provided to
          Scout Game for processing under the Agreement and this DPA is collected and/or validly obtained and utilized
          by Customer and its employees in compliance with all Data Protection Laws, including without limitation the
          disclosure, informed affirmative consent and targeted advertising provisions of the CCPA, UK GDPR, and EU Data
          Protection Laws, including without limitation Chapter II of the GDPR, and Customer shall defend, indemnify and
          hold harmless Scout Game from and against all loss, expense (including reasonable out-of-pocket attorneys'
          fees and court costs), damage, or liability arising out of any claim arising out of a breach of this Section
          5.
        </Typography>

        <Typography>6.0 Data Protection</Typography>

        <Typography>
          6.1 Data Security.
          <br /> Scout Game will utilize commercially reasonable efforts to protect the security, confidentiality, and
          integrity of the Personal Data transferred to it using reasonable administrative, physical, and technical
          safeguards. Notwithstanding the generality of the foregoing, Scout Game shall: (a) employ reasonable
          administrative, physical, and technical safeguards (including commercially reasonable safeguards against
          worms, Trojan horses, and other disabling or damaging codes) to afford protection of the Personal Data in
          accordance with Data Protection Laws as would be appropriate based on the nature of the Personal Data; (b)
          utilize commercially reasonable efforts to keep the Personal Data reasonably secure and in an encrypted form,
          and use industry standard security practices and systems applicable to the use of Personal Data to prevent,
          and take prompt and proper remedial action against unauthorized access, copying, modification, storage,
          reproduction, display, or distribution of Personal Data; and (c) cease to retain documents containing Personal
          Data, or remove the means by which Personal Data can be associated with particular individuals reasonably
          promptly after it is reasonable to assume that (i) the specified purposes are no longer being served by Scout
          Game's retention of Personal Data, and (ii) retention is no longer necessary for legal or business purposes.
        </Typography>

        <Typography>
          6.2 Authorized Personnel; Sub-processors.
          <br /> Scout Game shall ensure that Authorized Personnel has committed themselves to confidentiality or are
          under an appropriate statutory obligation of confidentiality with obligations at least as restrictive as those
          contained in this DPA. In addition, Scout Game is authorized to use sub-processors provided that Scout Game
          shall enter into an agreement with any such sub-processor containing data protection obligations that are at
          least as restrictive as the obligations under this DPA.
        </Typography>

        <Typography>
          6.3 Security Breaches.
          <br /> After confirmation of a Security Breach, Scout Game will promptly: (a) notify Customer of the Security
          Breach; (b) investigate the Security Breach; (c) provide Customer with necessary details about the Security
          Breach as required by applicable law; and (d) take reasonable actions to prevent a recurrence of the Security
          Breach. Scout Game agrees to cooperate in Customer's handling of the matter by: (a) providing reasonable
          assistance with Customer's investigation; and (b) making available relevant records, logs, files, data
          reporting, and other materials related to the Security Breach's effects on Customer, as required to comply
          with Data Protection Laws.
        </Typography>

        <Typography>
          7.0 Data Subjects.
          <br /> Request Scout Game shall reasonably assist Customer with the fulfillment of Customer's obligations to
          Data Subjects exercising rights afforded by Data Protection Laws, including Chapter III of GDPR. Scout Game
          will correct Personal Data as soon as reasonably practicable upon receiving a request from Customer to correct
          an error or omission in the Personal Data that is in Scout Game's possession or under Scout Game's control.
        </Typography>

        <Typography>
          8.0 Audits Within thirty (30) days of Customer's written request, and no more than once annually and subject
          to the confidentiality obligations set forth in the Agreement, Scout Game shall make available to Customer (or
          a mutually agreed upon third-party auditor) information reasonably necessary to demonstrate Scout Game's
          compliance with the obligations set forth in this DPA.
        </Typography>

        <Typography>9.0 Miscellaneous</Typography>
        <Typography>
          9.1 Conflict.
          <br /> In the event of any conflict or inconsistency between this DPA and Data Protection Laws, Data
          Protection Laws shall prevail. In the event of any conflict or inconsistency between the terms of this DPA and
          the terms of the Agreement, the terms of this DPA shall prevail solely to the extent that the subject matter
          concerns the Processing of Personal Data.
        </Typography>

        <Typography>
          9.2 Amendments. <br />
          This DPA shall not be modified except by a written instrument signed by the parties. To the extent that it is
          determined by any data protection authority that the Agreement or this DPA is insufficient to comply with Data
          Protection Laws or changes to Data Protection Laws, Customer and Scout Game agree to cooperate in good faith
          to amend the Agreement or this DPA or enter into further mutually agreeable data processing agreements in an
          effort to comply with all Data Protection Laws.
        </Typography>

        <Typography>
          9.3 Liability.
          <br /> Each Party's liability arising out of or related to this DPA, whether in contract, tort or under any
          other theory of liability, is subject to the limitations of liability contained in the Agreement. For the
          avoidance of doubt, each reference herein to the "DPA" means this DPA including its exhibits and appendices.
        </Typography>

        <Typography>
          9.4 Entire Agreement.
          <br /> This DPA is without prejudice to the rights and obligations of the parties under the Agreement which
          shall continue to have full force and effect. This DPA, together with the Agreement, is the final, complete
          and exclusive agreement of the Parties with respect to the subject matter hereof and supersedes and merges all
          prior discussions and agreements between the parties with respect to such subject matter.
        </Typography>
      </InfoCard>
      <InfoCard>
        <Typography fontWeight={600}>Exhibit A: Standard Contractual Clauses</Typography>

        <Typography>This Annex forms part of the Standard Contractual Clauses</Typography>

        <Typography variant='h6'>Annex I</Typography>

        <Typography fontWeight={600}>Data exporter</Typography>

        <Typography>Data exporter is Customer.</Typography>

        <Typography>Address: the Customer's address set out in the Agreement.</Typography>

        <Typography>
          Contact person's name, position, and contact details: the Customer's contact details as set out in the
          Agreement/order form.
        </Typography>

        <Typography>
          Activities relevant to the data transferred under these Clauses: activities necessary to provide the Services
          described in the Agreement.
        </Typography>

        <Typography>
          Signature and date: Customer is deemed to have signed this Annex I by accepting Scout Game's Terms of Use.
        </Typography>

        <Typography fontWeight={600}>Data importer</Typography>

        <Typography>The data importer is Scout Game.</Typography>

        <Typography>Address: 75 Midchester Ave, White Plains, NY 10606</Typography>

        <Typography>Contact person's name, position, and contact details:</Typography>
        <Typography>Alex Poon, CEO, alex.poon@charmverse.io</Typography>

        <Typography>
          Activities relevant to the data transferred under these Clauses: activities necessary to provide the Services
          described in the Agreement.
        </Typography>

        <Typography>
          Signature and date: Scout Game is deemed to have signed this Annex I by accepting Scout Game's Terms of Use
        </Typography>

        <Typography fontWeight={600}>Categories of data subjects whose personal data is transferred</Typography>

        <Typography>
          Data exporter may submit Personal Data to Scout Game, the extent of which is determined and controlled by the
          data exporter in its sole discretion, and which may include, but is not limited to Personal Data relating to
          the following categories of data subjects: (i) the data exporter's end-users including employees, contractors,
          representatives, business partners, collaborators, and customers, and (ii) persons with whom data exporter is
          collaborating through use of data importer's Services which may include its representatives, business
          partners, collaborators, customers, and potential customers.
        </Typography>

        <Typography fontWeight={600}>Categories of personal data transferred</Typography>

        <Typography>
          Data exporter may submit Personal Data to Scout Game, the extent of which is determined and controlled by the
          data exporter in its sole discretion, and which may include, but is not limited to the following categories of
          Personal Data: (a) First and last name; (b) Discord ID; (c) Crypto wallet address(es); (d) Employer; (e)
          Contact information (company, email, phone, physical business address); (f) Connection data; (g) Localisation
          data; and (h) other data in an electronic form used by Customer in the context of the Services.
        </Typography>

        <Typography fontWeight={600}>Sensitive data transferred (if applicable)</Typography>

        <Typography>None</Typography>

        <Typography fontWeight={600}>The Frequency of the Transfer</Typography>

        <Typography>Continuous</Typography>

        <Typography fontWeight={600}>Nature of the processing</Typography>

        <Typography>
          The processes may include collection, storage, retrieval, consultation, use, erasure or destruction,
          disclosure by transmission, dissemination, or otherwise making available data exporter's data as necessary to
          provide the Services in accordance with the data exporter's instructions, including related internal purposes
          (such as quality control, troubleshooting, product development, etc.).
        </Typography>

        <Typography fontWeight={600}>Purpose(s) if the data transfer and further processing</Typography>

        <Typography>
          The objective of the processing of Personal Data by the data importer is the performance of the contractual
          services related to the Agreement with the data exporter.
        </Typography>

        <Typography fontWeight={600}>
          The period for which the personal data will be retained, or, if that is not possible, the criteria used to
          determine that period.
        </Typography>

        <Typography>
          Personal data is retained for so long as is reasonably necessary to fulfill the purposes for which the data
          was collected, to perform our contractual and legal obligations, and for any applicable statute of limitations
          periods for the purposes of bringing and defending claims
        </Typography>

        <Typography fontWeight={600}>Competent Supervisory Authority</Typography>

        <Typography>Identify the competent supervisory authority/ies in accordance with Clause 13</Typography>

        <Typography>Irish Data Protection Commission</Typography>

        <Typography variant='h6'>
          Annex II: Technical And Organisational Measures Including Technical And Organisational Measures To Ensure The
          Security Of The Data
        </Typography>

        <Typography>
          Processor will maintain reasonable administrative, physical, and technical safeguards for the protection of
          the security, confidentiality, and integrity of personal data transferred to Processor as described in this
          DPA.
        </Typography>

        <Typography variant='h6'>Annex III: Processor's Sub-Processors</Typography>

        <Typography>
          By entering into this DPA, the Customer has authorized the use of the listed Sub-processors below:
        </Typography>

        <Typography fontWeight={600}>Amazon Web Services</Typography>

        <Typography>Permitted Sub-Processor Activities: Infrastructure</Typography>

        <Typography>Contact: aws-EU-privacy@amazon.com</Typography>

        <Typography>Address: 410 Terry Avenue North, Seattle, WA</Typography>

        <Typography>Processing Location: Washington, USA</Typography>

        <Typography fontWeight={600}>Datadog, Inc.</Typography>

        <Typography>Permitted Sub-Processor Activities: Developer tool and logging</Typography>

        <Typography>Contact: gdpr@datadoghq.com</Typography>

        <Typography>Address: 620 8th Avenue, Floor 45, New York, NY 10018</Typography>

        <Typography>Processing Location: California, USA</Typography>

        <Typography fontWeight={600}>Mixpanel, Inc.</Typography>

        <Typography>Permitted Sub-Processor Activities: Developer tool and logging</Typography>

        <Typography>Contact: compliance@mixpanel.com</Typography>

        <Typography>Address: 1 Front St Ste 2800, San Francisco, CA, 94111-5385</Typography>

        <Typography>Processing Location: California, USA</Typography>
      </InfoCard>
      <InfoCard>
        <Typography fontWeight={600}>Exhibit B: UK Addendum</Typography>

        <Typography>
          Standard Data Protection Clauses to be issued by the Commissioner under S119A(1) Data Protection Act 2018
        </Typography>

        <Typography>International Data Transfer Addendum to the EU Commission Standard Contractual Clauses</Typography>

        <Typography>VERSION B1.0, in force 21 March 2022</Typography>

        <Typography>
          This Addendum has been issued by the Information Commissioner for Parties making Restricted Transfers. The
          Information Commissioner considers that it provides Appropriate Safeguards for Restricted Transfers when it is
          entered into as a legally binding contract.
        </Typography>

        <Typography fontWeight={600}>Part 1: Table</Typography>
        <Typography fontWeight={600}>Table 1: Parties</Typography>

        <Typography>Start Date</Typography>
        <List>
          <ListItem>The effective date of the DPA</ListItem>
        </List>
        <Typography>The Parties</Typography>
        <List>
          <ListItem>Exporter (who sends the Restricted Transfer).</ListItem>
          <ListItem>Importer (who receives the Restricted Transfer)</ListItem>
        </List>
        <Typography>Parties details</Typography>
        <List>
          <ListItem>
            Full legal name: As set out in Annex I of Exhibit A Trading name (if different):Main address (if a company
            registered address): As set out in Annex I of Exhibit A Official registration number (if any) (company
            number or similar identifier):
          </ListItem>
          <ListItem>
            Full legal name: As set out in Annex I of Exhibit A Trading name (if different): Scout Game Main address (if
            a company registered address): As set out in Annex I of Exhibit A Official registration number (if any)
            (company number or similar identifier): N/A
          </ListItem>
        </List>
        <Typography>Key Contact</Typography>
        <List>
          <ListItem>
            Full Name (optional): As set out in Annex I of Exhibit A Job Title: As set out in Annex I of Exhibit A
            Contact details including email: As set out in Annex I of Exhibit A
          </ListItem>
        </List>
        <Typography>Signature (if required for the purposes of Section 2)</Typography>
        <List>
          <ListItem>Exporter is deemed to have signed this Addendum by accepting Scout Game's Terms of Use.</ListItem>
          <ListItem>Importer is deemed to have signed this Addendum by accepting Scout Game's Terms of Use.</ListItem>
        </List>
        <Typography fontWeight={600}>Table 2: Selected SCCs.</Typography>
        <Typography fontWeight={600}>Modules and Selected Causes</Typography>
        <List>
          <ListItem>Addendum EU SCCs</ListItem>
          <ListItem>
            The version of the Approved EU SCCs which this Addendum is appended to, detailed below, including the
            Appendix Information: Date: As set out in the DPA Reference (if any): As set out in the DPA Other identifier
            (if any): N/A
          </ListItem>
        </List>
        <Typography fontWeight={600}>Table 3: Appendix Information</Typography>
        <List>
          <ListItem>
            "Appendix Information" means the information which must be provided for the selected modules as set out in
            the Appendix of the Approved EU SCCs (other than the Parties), and which for this Addendum is set out in:
          </ListItem>
          <ListItem>Annex 1A: List of Parties: As set out in Annex I of Exhibit A</ListItem>
          <ListItem>Annex 1B: Description of Transfer: As set out in Annex I of Exhibit A</ListItem>
          <ListItem>
            Annex II: Technical and organizational measures including technical and organizational measures to ensure
            the security of the data: As set out in Annex II of Exhibit A
          </ListItem>
          <ListItem>Annex III: List of Sub processors: As set out in Annex III of Exhibit A</ListItem>
        </List>
        <Typography fontWeight={600}>Table 4: Ending this Addendum when the Approved Addendum Changes</Typography>
        <List>
          <ListItem>Ending this Addendum when the Approved Addendum changes</ListItem>
          <ListItem>Which Parties may end this Addendum as set out in Section 19: Importer & Exporter</ListItem>
        </List>
        <Typography fontWeight={600}>Part 2: Mandatory Clauses</Typography>
        <List>
          <ListItem>Mandatory Clauses</ListItem>
          <ListItem>
            Part 2: Mandatory Clauses of the Approved Addendum, being the template Addendum B.1.0 issued by the ICO and
            laid before Parliament in accordance with s119A of the Data Protection Act 2018 on 2 February 2022, as it is
            revised under Section 18 of those Mandatory Clauses.
          </ListItem>
        </List>
      </InfoCard>
    </>
  );
}
