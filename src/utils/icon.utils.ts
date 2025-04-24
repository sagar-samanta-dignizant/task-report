export const getBullet = (type: string, index: number) => {
  switch (type) {
    case "dot":
      return "• ";
    case "bullet":
      return "● ";
    case "number":
      return `${index + 1}. `;
    case "> ":
      return "> ";
    case "=>":
      return "=> ";
    case "==>":
      return "==> ";
    case "-":
      return "- ";
    case "--":
      return "-- ";
    case "->":
      return "-> ";  
    case "normal":
      return "○ ";
    case "star":
      return "★ ";
    case "square":
      return "■ ";
    case "diamond":
      return "♦ ";
    case "bullet(*)":
      return "★ "; // Icon for "bullet(*)"
    default:
      return "- ";
  }
};
