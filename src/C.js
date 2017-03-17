
import Enum from 'easy-enums';

const C = {};
export default C;

/**
 * Special ID for things which dont yet have an ID
 */
C.newId = 'new';

C.TYPES = new Enum("Charity Person");

/** dialogs you can show/hide.*/
C.show = new Enum('LoginWidget');
