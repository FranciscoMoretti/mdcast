import path from "path";

export function validatePath(filePath: string) {
  if (path.extname(filePath).toLowerCase().indexOf("md") === -1) {
    console.log('File extension not allowed. Only ".md" files are allowed');
    throw Error("Incorrect file extension provided");
  }
}
