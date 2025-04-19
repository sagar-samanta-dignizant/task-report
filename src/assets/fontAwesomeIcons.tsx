/* eslint-disable react-refresh/only-export-components */

import { faFileExport, faMinus, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Icons with styles

export const deleteIcon = <FontAwesomeIcon icon={faTrash} />;
export const AddIcon = <FontAwesomeIcon icon={faPlus} />;
export const minusIcon = <FontAwesomeIcon icon={faMinus} />
export const fileExportIcon = <FontAwesomeIcon icon={faFileExport} />;
