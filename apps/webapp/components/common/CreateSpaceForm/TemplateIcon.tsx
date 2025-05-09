import { SvgIcon } from '@mui/material';
import type { OverridableComponent } from '@mui/material/OverridableComponent';
import type { SvgIconTypeMap } from '@mui/material/SvgIcon';
import type { StaticSpaceTemplateType } from '@packages/spaces/config';

import CreatorIcon from 'public/images/template_icons/creator_icon.svg';
import GamingIcon from 'public/images/template_icons/gaming_icon.svg';
import GrantRecipientIcon from 'public/images/template_icons/grantee_icon.svg';
import GrantorIcon from 'public/images/template_icons/grantor_icon.svg';
import HackathonIcon from 'public/images/template_icons/hacker_icon.svg';
import ImpactCommunityIcon from 'public/images/template_icons/impact_icon.svg';
import LightBulbIcon from 'public/images/template_icons/light_bulb_icon_bnw.svg';
import NFTCommunityIcon from 'public/images/template_icons/nft_community_icon.svg';
import NounsIcon from 'public/images/template_icons/nounish_icon.svg';

type SvgComponent = OverridableComponent<SvgIconTypeMap<object, 'svg'>>;

const templateIcons: Record<StaticSpaceTemplateType, SvgComponent> = {
  templateCreator: CreatorIcon,
  templateGaming: GamingIcon,
  templateNftCommunity: NFTCommunityIcon,
  templateHackathon: HackathonIcon,
  templateNounishDAO: NounsIcon,
  templateImpactCommunity: ImpactCommunityIcon,
  templateGrantRecipient: GrantRecipientIcon,
  templateGrantor: GrantorIcon
};

export function TemplateIcon({ template }: { template: StaticSpaceTemplateType }) {
  if (!templateIcons[template]) {
    return null;
  }
  return <SvgIcon component={templateIcons[template]} inheritViewBox />;
}

export function CreateMyOwnIcon() {
  return <SvgIcon component={LightBulbIcon} inheritViewBox />;
}
