// Central icon list — all pulled from the css.gg set (react-icons/cg).
// Aliased to intent-based names so pages don't care which glyph is used.
import {
  CgSearch,
  CgBolt,
  CgCrown,
  CgGlobe,
  CgMusicNote,
  CgTrophy,
  CgCommunity,
  CgFilm,
  CgAwards,
  CgCalendarDates,
  CgPinAlt,
  CgMic,
  CgLogIn,
  CgLogOut,
  CgProfile,
  CgShoppingBag,
  CgArrowRight,
} from 'react-icons/cg';

export {
  CgSearch as IcoSearch,
  CgBolt as IcoSpark,
  CgCrown as IcoFeatured,
  CgGlobe as IcoAll,
  CgAwards as IcoTicket,
  CgCalendarDates as IcoDate,
  CgPinAlt as IcoVenue,
  CgMic as IcoMic,
  CgLogIn as IcoLogin,
  CgLogOut as IcoLogout,
  CgProfile as IcoUser,
  CgShoppingBag as IcoTickets,
  CgArrowRight as IcoArrow,
};

// Pick an icon component for a classification segment.
const BY_SEGMENT = [
  [/music/i, CgMusicNote],
  [/sport/i, CgTrophy],
  [/art|theat/i, CgCommunity],
  [/film|movie/i, CgFilm],
];

export function SegIcon({ segment = '', ...props }) {
  const [, Icon] = BY_SEGMENT.find(([re]) => re.test(segment)) || [, CgAwards];
  return <Icon {...props} />;
}
