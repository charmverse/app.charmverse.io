import PublicProfileComponent from '../../profile/public/PublicProfile';
import { UserDetailsProps } from '../../profile/public/components/UserDetails';

export default function PublicProfile (props: UserDetailsProps) {
  return <PublicProfileComponent {...props} readOnly={true} />;
}
